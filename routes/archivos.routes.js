const router = require('express').Router()
const archivos = require('../controllers/archivos.controller')
//const Authorize = require('../middlewares/auth.middleware')
const upload = require('../middlewares/upload.middleware')

router.get('/', archivos.getAll)
router.get('/:id', archivos.validarArchivoID, archivos.get)
router.get('/:id/detalle', archivos.validarArchivoID, archivos.getDetalle)
router.post('/', upload.single('file'), archivos.validarDatosArchivo, archivos.create)
router.put('/:id', upload.single("file"), archivos.validarDatosIDArchivo, archivos.update)
router.delete("/:id", archivos.validarArchivoID, archivos.delete)

module.exports = router