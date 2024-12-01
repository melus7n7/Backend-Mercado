const multer = require("multer")
var size = 1000 * 100 //1000 * 100  = 100 KB

const imageFilter = (req,file,cb) => {
    if(file.mimetype.startsWith("image/jpeg") && file.originalname.endsWith(".jpg")){
        cb(null,true)
    }else{
        cb("Solo se permiten imágenes con extensión JPG", false)
    }
}
var storage = multer.memoryStorage()

var uploadFile = multer({ 
    storage: storage, 
    fileFilter: imageFilter,
    limits: {fileSize: size}
})

const customFilename = (req, res, next) => {
    if (req.file) {
        req.file.filename = `${Date.now()}-${req.file.originalname}`;
    }
    next();
};

module.exports = { uploadFile, customFilename };