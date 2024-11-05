const express = require('express')
const cors = require("cors")
const dotenv = require('dotenv')
const app = express()

dotenv.config()

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

var corsOptions = {
    origin: ["http://localhost:8080", "http://localhost:8080"],
    methods: "GET,PUT,POST,DELETE"
}

app.use(cors(corsOptions))

const swaggerUi = require('swagger-ui-express')
const swaggerFile = require('./swagger-output.json')
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerFile))

//app.use(require("./middlewares/bitacora.middleware"))

app.use("/api/categorias", require('./routes/categorias.routes'))
app.use("/api/productos", require('./routes/productos.routes'))


app.get("*", (req, res) => {
    res.status(404).send("Recurso no encontrado");
})

//const errorhandler = require("./middlewares/errorhandler.middleware")
//app.use(errorhandler)

app.listen(process.env.SERVER_PORT, () => {
    console.log(`Escuchando en el puerto ${process.env.SERVER_PORT}`);
})