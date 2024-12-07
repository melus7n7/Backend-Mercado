const { usuario, rol, Sequelize } = require('../models')
const jwtSecret = process.env.JWT_SECRET
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const ClaimTypes = require('../config/claimtypes')
const validator = require('validator');



let self = {}

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
        if (!validator.isEmail(req.body.email) || !passwordRegex.test(req.body.password)) {
            return res.status(422).send();
        }
        if (!token) {
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
            //req.bitacora("usuarios.crear", data.email)
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
            console.log("decoded");
            if (decodedToken == null || decodedToken[ClaimTypes.Name] == null) {
                console.log("decoded null");
                return res.status(404).send();
            }
            const usuarioRecuperado = await usuario.findOne({
                where: { email: decodedToken[ClaimTypes.Name] },
                raw: true,
                attributes: ['protegido']
            })
            if (usuarioRecuperado == null) {
                console.log("usaurio null");
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
                protegido: 1
            })
            //req.bitacora("usuarios.crear", data.email)
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

//Sin Email, sin protegido, sin password, sin rol
self.updateCambiado = async function (req, res, next) {
    try {
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
        if (!passwordRegex.test(req.body.password)) {
            return res.status(422).send();
        }
        let decodedToken = req.decodedToken;
        const usuarioRecuperado = await usuario.findOne({
            where: { email: decodedToken[ClaimTypes.Name] },
            raw: true,
            attributes: ['id']
        })
        if (usuarioRecuperado == null) {
            res.status(404).send()
        }
        const updateData = {};
        if (req.body.password && req.body.nombre){
            updateData.nombre = req.body.nombre;
            updateData.passwordhash = await bcrypt.hash(req.body.password, 10);    
        }
        const data = await usuario.update(updateData, {
            where: { id: usuarioRecuperado.id },
            fields: ['nombre', 'passwordhash'] 
        });
        if (data[0] === 0) {
            return res.status(404).send()
        }

        //req.bitacora("usuarios.editar", email)
        res.status(204).send()
    } catch (error) {
        next(error)
    }
}

self.update = async function (req, res, next) {
    try {
        const email = req.params.email
        const rolusuario = await rol.findOne({ where: { nombre: req.body.rol } })
        req.body.rolid = rolusuario.id

        const data = await usuario.update(req.body, {
            where: { email: email },
        })
        if (data[0] === 0) {
            return res.status(404).send()
        }

        //req.bitacora("usuarios.editar", email)
        res.status(204).send()
    } catch (error) {
        next(error)
    }
}

self.delete = async function (req, res, next) {
    try {
        const email = req.params.email
        const data = await usuario.findOne({ where: { email: email } })
        if (data.protegido) {
            return res.status(403).send()
        }
        data = await usuario.destroy({ where: { email: email } })

        if (data === 1) {
            //req.bitacora("usuarios.eliminar", email)
            return res.status(204).send()
        }
        res.status(403).send()
    } catch (error) {
        next(error)
    }
}

module.exports = self