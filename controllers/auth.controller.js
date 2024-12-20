const bcrypt = require('bcrypt')
const { body, param, validationResult } = require('express-validator')
const { usuario, rol, Sequelize } = require('../models')
const { GeneraToken, TiempoRestanteToken } = require('../services/jwttoken.service')

let self = {}

self.usuarioValidator = [
    body('email')
        .isEmail().withMessage('Debe ser un correo electrónico válido'),

    body('password')
        .isLength({ min: 4 }).withMessage('La contraseña debe tener al menos 8 caracteres')
        .not().isEmpty().withMessage('La contraseña no puede estar vacía'),
];

self.login = async function (req, res, next) {
    try {
        const errors = validationResult(req)
        if(!errors.isEmpty()) return res.status(400).send(JSON.stringify(errors));

        const { email, password } = req.body;

        let data = await usuario.findOne({
            where: { email: email },
            raw: true,
            attributes: ['id', 'email', 'nombre', 'passwordhash', [Sequelize.col('rol.nombre'), 'rol']],
            include: { model: rol, attributes: [] }
        });
        if (data == null) {
            return res.status(404).send();
        }
        const passwordMash = await bcrypt.compare(password, data.passwordhash);
        if (!passwordMash) {
            return res.status(422).send();
        }

        const token = GeneraToken(data.email, data.nombre, data.rol);
        req.bitacora("auth.login", data.email);
        return res.status(200).json({
            email: data.email,
            nombre: data.nombre,
            rol: data.rol,
            jwt: token
        });
    } catch (error) {
        next(error)
    }
};


self.tiempo = async function (req, res) {
    const tiempo = TiempoRestanteToken(req)
    if (tiempo == null) {
        res.status(404).send()
    }
    return res.status(200).send(tiempo)
}

module.exports = self
