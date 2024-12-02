const { usuario, producto, carritoproducto, carrito, Sequelize } = require('../models')
const ClaimTypes = require('../config/claimtypes')
const { body, param, validationResult } = require('express-validator')
const Op = Sequelize.Op

let self = {}

self.carritoIDProductoValidator = [
    param('idProducto', 'Es obligatorio un ID numérico').not().isEmpty().isInt()
]

self.carritoBodyValidator = [
    body('productoid', 'Es obligatorio el ID del producto').not().isEmpty().isInt(),
    body('cantidad', 'La cantidad no es válida').not().isEmpty().isInt({ min: 1, max: 10 }),
]

self.carritoPutValidator = [
    param('idProducto', 'Es obligatorio el ID del producto').not().isEmpty().isInt(),
    body('cantidad', 'La cantidad no es válida').not().isEmpty().isInt({ min: 1, max: 10 }),
]

self.get = async function (req, res, next) {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) throw new Error(JSON.stringify(errors))

        let carritoRecuperado = await obtenerCarritoUsuario(req);
        if (carritoRecuperado == null) {
            return res.status(400).send("No existe el carrito");
        }
        const carritoid = carritoRecuperado.id

        let data = await carrito.findAll({
            attributes: [['id', 'carritoId']],
            where: { id: carritoid },
            include: {
                model: carritoproducto,
                as: 'carritoproducto',
                attributes: ['cantidad'],
                include: {
                    model: producto,
                    attributes: [['id', 'productoId'], 'titulo', 'precio', ['archivoid', 'archivoId'], 'cantidadDisponible']
                }
            }
        })

        if (data && data[0] && data[0].carritoproducto) {
            await validarCantidadActual(data[0].carritoproducto, carritoid);

            let totalCompra = 0;
            data[0].carritoproducto.forEach(item => {
                if (item.producto != null) {
                    let cantidad = (item.cantidad * parseInt(item.producto.precio))
                    item.dataValues.totalprecio = cantidad
                    totalCompra += cantidad
                }
            });
            data[0].dataValues.total = totalCompra;
            res.status(200).json(data)
        }
        else
            res.status(404).send()

    } catch (error) {
        next(error)
    }
}

self.getDetails = async function (req, res, next) {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) throw new Error(JSON.stringify(errors))

        let carritoRecuperado = await obtenerCarritoUsuario(req);
        if (carritoRecuperado == null) {
            return res.status(400).send("No existe el carrito");
        }
        let carritoid = carritoRecuperado.id

        let data = await carritoproducto.findAll({
            attributes: ['cantidad', ['productoid', 'productoId']],
            where: { productoid: req.params.idProducto, carritoid: carritoid },
            include: {
                model: producto,
                as: 'producto',
                attributes: ['titulo']
            }
        })

        if (data[0] != null)
            res.status(200).json(data)
        else
            res.status(404).send()

    } catch (error) {
        next(error)
    }
}

self.createProducto = async function (req, res, next) {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) throw new Error(JSON.stringify(errors))

        let carritoRecuperado = await obtenerCarritoUsuario(req);
        if (carritoRecuperado == null) {
            return res.status(400).send("No existe el carrito");
        }
        let carritoid = carritoRecuperado.id

        let carritoprevio = await carritoproducto.findAll({
            attributes: ['carritoid', 'productoid'],
            where: { carritoid: carritoid, productoid: req.body.productoid }
        })

        if (carritoprevio[0] != null) {
            return res.status(400).send({ message: "Ya existe el producto en el carrito" })
        }

        const productoEnSistema = await obtenerProductoCantidad(req.body.productoid);

        if (productoEnSistema == null) {
            return res.status(404).send({ message: "No existe el producto" })
        }

        if (req.body.cantidad > productoEnSistema.cantidadDisponible) {
            return res.status(400).send({ message: "No hay suficientes productos para la compra" })
        }

        let data = await carritoproducto.create({
            carritoid: carritoid,
            productoid: req.body.productoid,
            cantidad: req.body.cantidad
        })

        res.status(201).json(data)

    } catch (error) {
        next(error)
    }
}

self.updateProducto = async function (req, res, next) {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) throw new Error(JSON.stringify(errors))

        let carritoRecuperado = await obtenerCarritoUsuario(req);
        if (carritoRecuperado == null) {
            return res.status(400).send("No existe el carrito");
        }
        let carritoid = carritoRecuperado.id

        const productoEnSistema = await obtenerProductoCantidad(req.params.idProducto);
        if (productoEnSistema == null) {
            return res.status(404).send({ message: "No existe el producto" })
        }
        if (req.body.cantidad > productoEnSistema.cantidadDisponible) {
            return res.status(400).send({ message: "No hay suficientes productos para la compra" })
        }

        const productoid = req.params.idProducto
        const cantidad = req.body.cantidad
        let data = await carritoproducto.update({ cantidad: cantidad },
            { where: { productoid: productoid, carritoid: carritoid } })

        if (data[0] == 0)
            return res.status(404).send()

        res.status(204).send()

    } catch (error) {
        next(error)
    }
}

self.deleteProducto = async function (req, res, next) {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) throw new Error(JSON.stringify(errors))

        let carritoRecuperado = await obtenerCarritoUsuario(req);
        if (carritoRecuperado == null) {
            return res.status(400).send("No existe el carrito");
        }
        let carritoid = carritoRecuperado.id

        let item = await producto.findByPk(req.params.idProducto)
        if (item[0] == null) return res.status(404).send()

        await carritoproducto.destroy({
            where: {
                carritoid: carritoid,
                productoid: req.params.idProducto
            }
        })

        res.status(204).send()

    } catch (error) {
        next(error)
    }
}

async function obtenerCarritoUsuario(req) {
    try {
        let decodedToken = req.decodedToken;
        if (decodedToken == null || decodedToken[ClaimTypes.Name] == null) {
            return null
        }

        const data = await usuario.findOne({
            where: { email: decodedToken[ClaimTypes.Name] },
            raw: true,
            attributes: ['id', 'email']
        })

        if (data == null) {
            return null
        }

        let carritoCompras = await carrito.findOne({
            where: { usuarioid: data.id },
            raw: true,
            attributes: ['id']
        })

        if (carritoCompras == null) {
            carritoCompras = await carrito.create({
                protegida: 0,
                usuarioid: data.id
            })
        }

        return carritoCompras

    } catch (error) {
        return null
    }
}

async function obtenerProductoCantidad(idProducto) {
    let data = await producto.findByPk(idProducto, {
        attributes: ['cantidadDisponible', 'id']
    })
    return data
}

async function validarCantidadActual(data, carritoid){
    for (let index = 0; index < data.length; index++) {
        if(data[index].producto != null){
            let cantidad = data[index].cantidad;
            const cantidadDisponible = data[index].producto.cantidadDisponible;
            let productoId = data[index].producto.dataValues.productoId;
            if(cantidad > cantidadDisponible){
                let modificacion = await carritoproducto.update(
                    { cantidad: 1 }, 
                    {
                        where: {
                            productoid: productoId, 
                            carritoid: carritoid   
                        }
                    }
                );
                if(modificacion == null){
                    return null
                }
                data[index].cantidad = cantidadDisponible;
            }
        }        
    }
}


module.exports = self