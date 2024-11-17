const { producto, carritoproducto, carrito, Sequelize } = require('../models')
const { body, param, validationResult } = require('express-validator')
const Op = Sequelize.Op

let self = {}

self.carritoIDProductoValidator = [
    param('idProducto', 'Es obligatorio un ID numérico').not().isEmpty().isInt()
]

self.carritoBodyValidator = [
    body('productoid', 'Es obligatorio el ID del producto').not().isEmpty().isInt(),
    body('cantidad', 'Es obligatorio el ID del producto').not().isEmpty().isInt({ min: 1, max: 100 }),
]

self.carritoPutValidator = [
    param('idProducto', 'Es obligatorio el ID del producto').not().isEmpty().isInt(),
    body('cantidad', 'Es obligatorio el ID del producto').not().isEmpty().isInt({ min: 1, max: 100 }),
]

self.get = async function (req, res, next) {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) throw new Error(JSON.stringify(errors))

        //Conseguir por el usuario
        let carritoid = 1

        let data = await carrito.findAll({
            attributes: [['id', 'carritoId']],
            where: { id: carritoid },
            include: {
                model: carritoproducto,
                as: 'carritoproducto',
                attributes: ['cantidad'],
                include: {
                    model: producto,
                    attributes: [['id', 'productoId'], 'titulo', 'precio']
                }
            }
        })

        if (data && data[0] && data[0].carritoproducto) {
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

        //Conseguir por el usuario
        let carritoid = 1

        let data = await carritoproducto.findAll({
            attributes: ['cantidad', 'productoid'],
            where: { productoid: req.params.idProducto, carritoid: carritoid }
        })

        if (data)
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

        //encontrar el carrito id por el usuario
        let carritoid = 1

        let carritoprevio = await carritoproducto.findAll({
            attributes: ['carritoid', 'productoid'],
            where: { carritoid: carritoid, productoid: req.body.productoid }
        })

        if (carritoprevio[0] != null) {
            return res.status(400).send({ message: "Ya existe el producto en el carrito" })
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

        //encontrar el carritoid con el usuario
        let carritoid = 1

        let productoid = req.params.idProducto
        let cantidad = req.body.cantidad
        let data = await carritoproducto.update({ cantidad: cantidad },
            { where: { productoid: productoid, carritoid: carritoid } })
        if (data[0] === 0)
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

        /*let itemToRemove = await carrito.findByPk(req.params.categoriaid) -- Encontrar carrit con el usuario
        if(!itemToRemove) return res.status(404).send()*/
        let carritoid = 1

        let item = await producto.findByPk(req.params.idProducto)
        if (!item) return res.status(404).send()

        await carritoproducto.destroy({
            where: {
                carritoid: carritoid,
                productoid: req.params.idProducto
            }
        })

        //req.bitacora("productocategoria.remover", `${req.params.id}:${req.body.categoriaid}`)
        res.status(204).send()

    } catch (error) {
        next(error)
    }
}


module.exports = self