const router = require('express').Router()
const usuarios = require('../controllers/usuarios.controller')
const Authorize = require ('../middlewares/auth.middleware')

router.get('/', Authorize('Administrador'), usuarios.getAll)
router.get('/:email', Authorize('Administrador'), usuarios.get)
router.post('/', usuarios.create)
//router.put('/:email', Authorize('Usuario,Administrador'), usuarios.update)
router.put('/', Authorize('Usuario,Administrador'), usuarios.updateCambiado)
router.delete('/:email', Authorize('Administrador'), usuarios.delete)

module.exports = router