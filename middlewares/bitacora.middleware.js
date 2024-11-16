const requestIp = require('request-ip')
const ClaimTypes = require('../config/claimtypes')
const {bitacora} = require('../models')

const bitacoraLogger = (req,res,next) => {
    const ip = requestIp.getClientIp(req)
    let email = 'invitado'

    req.bitacora = async (accion, id) => {
        if(req.decodedToken){
            email = req.decodedToken[ClaimTypes.Name]
        }
        await bitacora.create({
            accion: accion, elementoid: id, ip:ip, usuario:email, fecha:new Date()
        })
    }
    next()
}

module.exports = bitacoraLogger