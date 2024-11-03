const swaggerAutogen = require('swagger-autogen')()

const doc = {
    info: {
        title: "Backend Node.js API",
        description: "Esta en una API para Mercado Libre"
    },
    host: 'localhost:3000'
}

const outputFile = './swagger-output.json'
const routes = ['./index.js']

swaggerAutogen(outputFile,routes,doc)