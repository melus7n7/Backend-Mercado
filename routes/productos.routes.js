const router = require('express').Router()
const productos = require('../controllers/productos.controller')
//const Authorize = require ('../middlewares/auth.middleware')

router.get('/', productos.getAll)
router.get('/:id', productos.productoGetValidator, productos.get)
router.post('/', productos.productoValidator, productos.create)
router.put('/:id', productos.productoPutValidator, productos.update)
router.delete('/:id', productos.productoGetValidator, productos.delete)
router.post('/:id/categoria', productos.productoCategoriaPostValidator, productos.asignaCategoria)
router.delete('/:id/categoria/:categoriaid', productos.productoCategoriaDeleteValidator, productos.eliminaCategoria)

module.exports = router