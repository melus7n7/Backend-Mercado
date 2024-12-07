const bcrypt = require('bcrypt')
const { body, param, validationResult } = require('express-validator')
const {usuario, rol, Sequelize} = require('../models')
const {GeneraToken, TiempoRestanteToken} = require('../services/jwttoken.service')

let self = {}

self.usuarioValidator = [
    body('email')
        .isEmail().withMessage('Debe ser un correo electrónico válido') ,  

    body('password')
        .isLength({ min: 4 }).withMessage('La contraseña debe tener al menos 8 caracteres')  
        .not().isEmpty().withMessage('La contraseña no puede estar vacía'),  
];

self.login = async function(req, res, next) {
    try{
        const errors = validationResult(req)
        if (!errors.isEmpty()) throw new Error(JSON.stringify(errors))

        const {email, password} = req.body
        let data = await usuario.findOne({
            where: {email: email},
            raw: true,
            attributes: ['id','email','nombre','passwordhash',[Sequelize.col('rol.nombre'),'rol']],
            include: {model:rol, attributes:[]}
        })
        if(data===null){
            return res.status(401).json({mensaje:'Usuario o contraseña incorrectos'})
        }

        const passwordMash = await bcrypt.compare(password,data.passwordhash)
        if(!passwordMash){
            return res.status(401).json({mensaje:'Usuario o contraseña incorrectos'})
        }
        token = GeneraToken(data.email, data.nombre, data.rol)
        req.bitacora("usuario.login",data.email)
        res.status(200).json({
            email: data.email,
            nombre: data.nombre,
            rol:data.rol,
            jwt:token
        })
    } catch(error){
        next(error)
    }
}
/*
self.login = async function(req, res, next) {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: 400,
                mensaje: "Errores de validación",
                errores: errors.array(),
            });
        }

        const { email, password } = req.body;
        let data = await usuario.findOne({
            where: { email: email },
            raw: true,
            attributes: ['id', 'email', 'nombre', 'passwordhash', [Sequelize.col('rol.nombre'), 'rol']],
            include: { model: rol, attributes: [] }
        });

        if (data === null) {
            return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos' });
        }

        const passwordMash = await bcrypt.compare(password, data.passwordhash);
        if (!passwordMash) {
            return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos' });
        }

        const token = GeneraToken(data.email, data.nombre, data.rol);
        req.bitacora("usuario.login", data.email);

        return res.status(200).json({
            email: data.email,
            nombre: data.nombre,
            rol: data.rol,
            jwt: token
        });
    } catch (error) {
        const sanitizedError = {
            status: 500,
            mensaje: "Ha ocurrido un error inesperado en el servidor. Por favor, intente más tarde.",
        };

        if (error.message) {
            sanitizedError.mensaje = `Error: ${error.message}`;
        }

        return res.status(sanitizedError.status).json(sanitizedError);
    }
};*/


self.tiempo = async function (req,res){
    const tiempo = TiempoRestanteToken(req)
    if(tiempo == null){
        res.status(404).send()
    }
    res.status(200).send()
}

module.exports = self
