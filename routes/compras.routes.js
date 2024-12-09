const router = require('express').Router()
const compras = require('../controllers/compras.controller')
const Authorize = require ('../middlewares/auth.middleware')

router.get('/', Authorize('Administrador'), compras.get)
router.get('/personal', Authorize('Usuario'), compras.getPersonal)
router.get('/personal/:id', Authorize('Usuario'), compras.personalIdValidator, compras.getPersonalDetails)
router.get('/:idCompra',  compras.compraIDValidator, compras.getDetails)
router.post('/',Authorize('Usuario'), compras.create)
module.exports = router
