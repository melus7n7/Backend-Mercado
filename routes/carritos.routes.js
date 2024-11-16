const router = require('express').Router()
const carrito = require('../controllers/carritos.controller')
//const Authorize = require ('../middlewares/auth.middleware')

router.get('/', carrito.get)
router.get('/:idProducto', carrito.carritoIDProductoValidator, carrito.getDetails)
router.post('/', carrito.carritoBodyValidator, carrito.createProducto)
router.put('/:idProducto', carrito.carritoPutValidator, carrito.updateProducto)
router.delete('/:idProducto', carrito.carritoIDProductoValidator, carrito.deleteProducto)

module.exports = router
