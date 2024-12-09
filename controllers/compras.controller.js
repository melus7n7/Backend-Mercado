const { compraproducto, compra, usuario, rol, producto, carrito, carritoproducto } = require('../models')
const { body, param, validationResult } = require('express-validator')
const { Sequelize } = require('sequelize');
const ClaimTypes = require('../config/claimtypes')
const db = require('../models/index');
const sequelize = db.sequelize;

let self = {}

self.compraIDValidator = [
    param('idCompra', 'Es obligatorio un ID numérico').not().isEmpty().isInt()
]


self.get = async function (req, res, next) {
    try {
        let data = await compra.findAll({
            attributes: [['id', 'compraId']],
            include: [
                {
                    model: usuario,
                    as: 'usuario',
                    raw: true,
                    attributes: ['id', 'email', 'nombre'],
                    include: {
                        model: rol,
                        as: 'rol',
                        attributes: ['nombre']
                    }
                },
                {
                    model: compraproducto,
                    as: 'compraproducto',
                    attributes: ['cantidad', 'precio']
                }
            ]
        })

        if (data && data.length) {
            data.forEach(item => {
                if (item.dataValues != null && item.dataValues.compraproducto != null) {
                    item.dataValues.totalProductos = 0;
                    item.dataValues.totalCosto = 0;

                    let compraproductositem = item.dataValues.compraproducto;
                    compraproductositem.forEach(element => {
                        if (element != null && element.cantidad != null && element.precio != null) {
                            let cantidadelement = parseInt(element.cantidad);
                            let precioelement = parseFloat(element.precio);
                            if (!isNaN(cantidadelement) && !isNaN(precioelement)) {
                                item.dataValues.totalProductos += cantidadelement;
                                item.dataValues.totalCosto += (cantidadelement * precioelement)
                            }
                        }
                    });
                }

                if (item.dataValues != null && item.dataValues.usuario != null &&
                    item.dataValues.usuario.dataValues.rol != null && item.dataValues.usuario.dataValues.rol.dataValues != null) {
                    item.dataValues.usuario.dataValues.rol = item.dataValues.usuario.dataValues.rol.dataValues.nombre
                }
            });

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

        let idCompra = req.params.idCompra;

        let data = await compra.findOne({
            where: { id: idCompra },
            attributes: [['id', 'compraId']],
            include: [
                {
                    model: usuario,
                    as: 'usuario',
                    raw: true,
                    attributes: ['id', 'email', 'nombre'],
                    include: {
                        model: rol,
                        as: 'rol',
                        attributes: ['nombre']
                    }
                },
                {
                    model: compraproducto,
                    as: 'compraproducto',
                    attributes: ['productoid', 'cantidad', 'precio']
                }
            ]
        })

        if (data && data.dataValues != null) {
            data.dataValues.totalProductos = 0;
            data.dataValues.totalCosto = 0;

            if (data.dataValues.usuario != null && data.dataValues.usuario.dataValues.rol != null && data.dataValues.usuario.dataValues.rol.dataValues != null) {
                data.dataValues.usuario.dataValues.rol = data.dataValues.usuario.dataValues.rol.dataValues.nombre
            }

            for (let i = 0; i < data.dataValues.compraproducto.length; i++) {
                let item = data.dataValues.compraproducto[i];


                if (item != null && item.dataValues.cantidad != null && item.dataValues.precio != null) {
                    let cantidadelement = parseInt(item.dataValues.cantidad);
                    let precioelement = parseFloat(item.dataValues.precio);
                    if (!isNaN(cantidadelement) && !isNaN(precioelement)) {
                        data.dataValues.totalProductos += cantidadelement;
                        data.dataValues.totalCosto += (cantidadelement * precioelement)
                    }
                }

                let productoitem = await obtenerproducto(item);
                if (productoitem != null) {
                    data.dataValues.compraproducto[i].dataValues.producto = productoitem;
                }
            }
            res.status(200).json(data)
        }
        else {
            res.status(404).send()
        }


    } catch (error) {
        next(error)
    }
}

async function obtenerproducto(item) {
    if (item.productoid != null) {
        let productoItem = await producto.findOne({
            attributes: ['titulo', 'descripcion'],
            where: { id: item.productoid }
        });
        return productoItem;
    }
}

self.create = async function (req, res, next) {
    let transaccion;
    try {
        let decodedToken = req.decodedToken;
        if (decodedToken == null || decodedToken[ClaimTypes.Name] == null) {
            return res.status(404).send();
        }
        const usuarioRecuperado = await usuario.findOne({
            where: { email: decodedToken[ClaimTypes.Name] },
            raw: true,
            attributes: ['id', 'email']
        })
        if (usuarioRecuperado == null) {
            return res.status(404).send();
        }
        transaccion = await sequelize.transaction();

        let carritoCompras = await carrito.findOne({
            where: { usuarioid: usuarioRecuperado.id },
            raw: true,
            attributes: ['id']
        })

        if (carritoCompras == null) {
            await transaccion.rollback();
            return res.status(404).send();
        }

        let carritoProductos = await carritoproducto.findAll({
            where: { carritoid: carritoCompras.id },
            raw: true,
            attributes: ['productoid', 'cantidad']
        })

        if (carritoProductos == null || carritoProductos.length === 0) {
            await transaccion.rollback();
            return res.status(404).send("Carrito vacio");
        }

        for (let productos of carritoProductos) {
            let productoRecuperado = await producto.findOne({
                where: { id: productos.productoid },
                raw: true,
                attributes: ['id', 'precio', 'cantidadDisponible']
            })
            if (productoRecuperado == null) {
                await transaccion.rollback();
                return res.status(404).send();
            }
            let nuevaCantidadDisponible = productoRecuperado.cantidadDisponible - productos.cantidad
            if (nuevaCantidadDisponible >= 0) {
                let actualizarProducto = await producto.update(
                    { cantidadDisponible: nuevaCantidadDisponible },
                    { where: { id: productos.productoid } },
                    { transaction: transaccion }
                );
                if (actualizarProducto == null) {
                    await transaccion.rollback();
                    return res.status(404).send();
                }
            } else {
                await transaccion.rollback();
                return res.status(409).send("Sin stock")
            }
        }

        let compraCreada = await compra.create({
            fechapedido: new Date(),
            usuarioid: usuarioRecuperado.id
        }, { transaction: transaccion })
        if (compraCreada == null) {
            await transaccion.rollback();
            return res.status(404).send();
        }

        for (let productos of carritoProductos) {
            if (productos.cantidad != 0) {
                if (isNaN(productos.productoid) || productos.productoid == null) {
                    await transaccion.rollback();
                    return res.status(404).send();
                }
                let productoRecuperado = await producto.findOne({
                    where: { id: productos.productoid },
                    raw: true,
                    attributes: ['id', 'precio', 'cantidadDisponible']
                })
                if (productoRecuperado == null) {
                    await transaccion.rollback();
                    return res.status(409).send();
                }
                let compraproductoCreado = await compraproducto.create({
                    productoid: productoRecuperado.id,
                    compraid: compraCreada.id,
                    cantidad: productos.cantidad,
                    precio: productoRecuperado.precio,
                }, { transaction: transaccion })
                if (compraproductoCreado == null) {
                    await transaccion.rollback();
                    return res.status(404).send();
                }
            }
        }

        let resultadodelete = await carritoproducto.destroy({
            where: { carritoid: carritoCompras.id }
        })

        if (resultadodelete == null) {
            return res.status(404).send();
        }

        await transaccion.commit();
        return res.status(201).json(compraCreada)
    } catch (error) {
        if (transaccion && !transaccion.finished) {
            await transaccion.rollback();
        }
        next(error)
    }
}

self.getPersonal = async function (req, res, next) {
    try {
        let decodedToken = req.decodedToken;
        if (decodedToken == null || decodedToken[ClaimTypes.Name] == null) {
            return res.status(404).send();
        }
        const usuarioRecuperado = await usuario.findOne({
            where: { email: decodedToken[ClaimTypes.Name] },
            raw: true,
            attributes: ['id', 'email']
        })
        if (usuarioRecuperado == null) {
            res.status(404).send()
        }

        let comprasCliente = await compra.findAll({
            attributes: [
                'id',
                'fechapedido',
                [sequelize.fn('SUM', sequelize.col('compraproducto.cantidad')), 'totalCantidad'],
                [sequelize.fn('SUM', sequelize.literal('compraproducto.cantidad * compraproducto.precio')), 'totalPrecio']
            ],
            where: { usuarioid: usuarioRecuperado.id },
            include: [
                {
                    model: compraproducto,
                    as: 'compraproducto',
                    attributes: []
                }
            ],
            group: ['compra.id'],
            order: [['fechapedido', 'DESC']]
        });
        if (comprasCliente.length == 0) {
            return res.status(404).send("Compras vacio")
        }
        return res.status(200).json(comprasCliente)
    } catch (error) {
        next(error)
    }
}

self.getPersonalDetails = async function (req, res, next) {
    try {
        let decodedToken = req.decodedToken;
        if (decodedToken == null || decodedToken[ClaimTypes.Name] == null) {
            return res.status(404).send();
        }
        const usuarioRecuperado = await usuario.findOne({
            where: { email: decodedToken[ClaimTypes.Name] },
            raw: true,
            attributes: ['id', 'email']
        })
        console.log("req.params.id" + req.params.id)
        if (usuarioRecuperado == null) {
            return res.status(404).send();
        }
        let verificar = await compra.findOne({
            where: { id: req.params.id },
            raw: true,
            attributes: ['usuarioid']
        });
        if (verificar == null) {
            return res.status(404).send();
        }

        if (verificar.usuarioid != usuarioRecuperado.id) {
            return res.status(401).send();
        }
        let comprasproducto = await compraproducto.findAll({
            where: { compraid: req.params.id },
            raw: true,
            attributes: ['productoid', 'cantidad']
        });
        if (comprasproducto.length == 0) {
            return res.status(404).send();
        }
        let productosList = []
        for (let compra of comprasproducto) {
            let productos = await producto.findOne({
                attributes: ['titulo', 'descripcion', 'precio'],
                where: { id: compra.productoid }
            });
            if (producto) {
                const productoConCantidad = {
                    titulo: productos.titulo,
                    descripcion: productos.descripcion,
                    precio: productos.precio,
                    cantidad: compra.cantidad
                };

                productosList.push(productoConCantidad);
            }
        }

        return res.status(200).json(productosList)
    } catch (error) {
        next(error)
    }
}

module.exports = self