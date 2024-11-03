const schemaGetCategoria = () =>{
    return {
        idCategoria: {
            in: ['params'],
            notEmpty: true,
            isDecimal: {
                errorMessage: 'ID debe ser un número'
            },
            errorMessage: 'ID no válido'
        }
    }
}

module.exports = { schemaGetCategoria }