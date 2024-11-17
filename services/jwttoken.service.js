const jwt = require('jsonwebtoken')
const jwtSecret = process.env.JWT_SECRET
const ClaimTypes = require('../config/claimtypes')

const GeneraToken = (email, nombre, rol) => {
    const token = jwt.sign({
        [ClaimTypes.Name]: email,
        [ClaimTypes.GivenName]: nombre,
        [ClaimTypes.Role]: rol,
        "iss":"ServidorFeiJWT",
        "aud": "ClientFeiJWT"
    }, 
    jwtSecret,{
        expiresIn: '20m',
    })
    return token;
}

const TiempoRestanteToken = (req)  => {
    try{
        const authHeader = req.header('Authorization')
        const token = authHeader.split(' ')[1]
        const decodedToken = jwt.verify(token,jwtSecret)

        const time = (decodedToken.exp -(new Date().getTime()/1000))
        const minutos = Math.floor(time/60)
        const segundos = Math.floor(time - minutos * 60)
        return "00:" + minutos.toString().padStart(2,"0")+':'+segundos.toString().padStart(2,"0")
    } catch(error){
        return null
    }
}

module.exports = {GeneraToken, TiempoRestanteToken}