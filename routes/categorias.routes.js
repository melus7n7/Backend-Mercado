const router = require('express').Router()
const categorias = require('../controllers/categorias.controller')
const { checkSchema } = require('express-validator')
const validarFormatoPeticion = require('../middlewares/validadorpeticiones.middleware')
const { schemaGetCategoria } = require('../schema/categoria.schema')
//const Authorize = require ('../middlewares/auth.middleware')

router.get('/', categorias.getAll)
router.get('/:id', checkSchema(schemaGetCategoria()), validarFormatoPeticion, categorias.get)
router.post('/', categorias.categoriaValidator, categorias.create)
router.put('/:id', categorias.categoriaValidator, categorias.update)
router.delete('/:id', categorias.delete)

module.exports = router