const {bitacora} = require('../models')

let self = {}

self.getAll = async function (req, res, next) {
    try{
        let data = await bitacora.findAll({
            attributes: [['id','bitacoraId'],'accion','elementoid','ip','usuario','fecha'],
            order:[['id','DESC']]
        })
        res.status(200).json(data)
    }catch(error){
        next(error)
    }
    
}

module.exports = self