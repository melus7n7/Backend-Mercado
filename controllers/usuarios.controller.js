const { usuario, rol,compra, Sequelize } = require('../models')
const jwtSecret = process.env.JWT_SECRET
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const ClaimTypes = require('../config/claimtypes')
const validator = require('validator');
const { body, param, validationResult } = require('express-validator')


let self = {}

self.usuarioPutValidator = [
    body('nombre', 'El nombre del usuario es obligatorio y debe ser una cadena con al menos un carácter')
        .not()
        .isEmpty()
        .isString()
        .withMessage('El nombre debe ser una cadena de texto')
        .isLength({ min: 1 })
        .withMessage('El nombre debe tener al menos un carácter'),
];

self.usuarioIDValidator = [
    param('email').isEmail().withMessage('Debe ser un correo electrónico válido') ,  
];


self.getAll = async function (req, res, next) {
    try {
        const data = await usuario.findAll({
            raw: true,
            attributes: ['id', 'email', 'nombre', [Sequelize.col('rol.nombre'), 'rol']],
            include: { model: rol, attributes: [] }
        })
        res.status(200).json(data)
    } catch (error) {
        next(error)
    }
}

self.get = async function (req, res, next) {
    try {
        const email = req.params.email
        const data = await usuario.findOne({
            where: { email: email },
            raw: true,
            attributes: ['id', 'email', 'nombre', [Sequelize.col('rol.nombre'), 'rol']],
            include: { model: rol, attributes: [] }
        })
        if (data) {
            return res.status(200).json(data)
        }
        res.status(404).send()
    } catch (error) {
        next(error)
    }
}

self.create = async function (req, res, next) {
    try {
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
        const token = req.header('Authorization')?.replace('Bearer ', '');
        const emailExistente = await usuario.findOne({ where: { email: req.body.email } });
        if (emailExistente) {
            return res.status(409).send();
        }
        if (!validator.isEmail(req.body.email) || !passwordRegex.test(req.body.password) || !req.body.nombre?.trim()) {
            return res.status(422).send();
        }
        if (token.startsWith("Bearer")) {
            const rolusuario = await rol.findOne({ where: { nombre: "Usuario" } })
            if (rolusuario == null) {
                return res.status(404).send();
            }
            const data = await usuario.create({
                id: crypto.randomUUID(),
                email: req.body.email,
                passwordhash: await bcrypt.hash(req.body.password, 10),
                nombre: req.body.nombre,
                rolid: rolusuario.id,
                protegido: 0
            })
            res.status(201).json({
                id: data.id,
                email: data.email,
                nombre: data.nombre,
                rolid: rolusuario.nombre
            })
        } else {
            const authHeader = req.header('Authorization')
            const token = authHeader.split(' ')[1]
            const decodedToken = jwt.verify(token, jwtSecret)
            if (decodedToken == null || decodedToken[ClaimTypes.Name] == null) {
                return res.status(404).send();
            }
            const usuarioRecuperado = await usuario.findOne({
                where: { email: decodedToken[ClaimTypes.Name] },
                raw: true,
                attributes: ['protegido']
            })
            if (usuarioRecuperado == null) {
                return res.status(404).send();
            }
            if (usuarioRecuperado.protegido != 1) {
                return res.status(401).send("acceso denegado");
            }
            const rolusuario = await rol.findOne({ where: { nombre: "Administrador" } })
            if (rolusuario == null) {
                return res.status(404).send();
            }
            const data = await usuario.create({
                id: crypto.randomUUID(),
                email: req.body.email,
                passwordhash: await bcrypt.hash(req.body.password, 10),
                nombre: req.body.nombre,
                rolid: rolusuario.id,
                protegido: 0
            })
            res.status(201).json({
                id: data.id,
                email: data.email,
                nombre: data.nombre,
                rolid: rolusuario.nombre
            })
        }
    } catch (error) {
        next(error)
    }
}

self.update = async function (req, res, next) {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) return res.status(400).send(JSON.stringify(errors));
        let correo = req.params.email;
        if (!validator.isEmail(correo)) {
            return res.status(422).send();
        }
        const usuarioRecuperado = await usuario.findOne({
            where: { email: correo },
            raw: true,
            attributes: ['id']
        })
        if (usuarioRecuperado == null) {
            return res.status(404).send()
        }
        const updateData = {};
        updateData.nombre = req.body.nombre;
        const data = await usuario.update(updateData, {
            where: { id: usuarioRecuperado.id },
            fields: ['nombre'] 
        });
        if (data[0] === 0) {
            return res.status(404).send()
        }
        res.status(204).send()
    } catch (error) {
        next(error)
    }
}

self.delete = async function (req, res, next) {
    try {
        //Comprobar si tiene compras, si tiene compras, entonces conflicto
        const errors = validationResult(req)
        if (!errors.isEmpty()) throw new Error(JSON.stringify(errors))
        const email = req.params.email
    
        let usuarioRecuperado = await usuario.findOne({ where: { email: email } })
        if (usuarioRecuperado == null) {
            return res.status(404).send()
        }
        if (usuarioRecuperado.protegido == 1) {
            return res.status(403).send()
        }
        let comprasCliente = await compra.findAll({
            attributes: ['id'],
            where: { usuarioid: usuarioRecuperado.id }
        });
        if (comprasCliente.length > 0) {
            return res.status(409).send()
        }
        data = await usuario.destroy({ where: { email: email } })

        if (data === 1) {
            //req.bitacora("usuarios.eliminar", email)
            return res.status(204).send()
        }
        res.status(400).send()
    } catch (error) {
        next(error)
    }
}

module.exports = self