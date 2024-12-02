const router = require('express').Router()
const compras = require('../controllers/compras.controller')
const Authorize = require ('../middlewares/auth.middleware')

router.get('/', Authorize('Administrador'), compras.get)
router.get('/:idCompra',  compras.compraIDValidator, compras.getDetails)
router.post('/',Authorize('Usuario'), compras.compraValidator, compras.create)
module.exports = router
