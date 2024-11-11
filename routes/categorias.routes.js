const router = require('express').Router()
const categorias = require('../controllers/categorias.controller')
//const Authorize = require ('../middlewares/auth.middleware')

router.get('/', categorias.getAll)
router.get('/:id', categorias.categoriaIdValidator, categorias.get)
router.post('/', categorias.categoriaValidator, categorias.create)
router.put('/:id', categorias.categoriaValidator, categorias.update)
router.delete('/:id', categorias.categoriaIdValidator, categorias.delete)

module.exports = router