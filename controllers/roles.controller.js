const {rol} = require('../models')

let self = {}

self.getAll = async function (req, res) {
    let data = await rol.findAll({attributes: ['id','nombre']})
    req.bitacora("roles.getAll", data.id)
    res.status(200).json(data)
}

module.exports = self