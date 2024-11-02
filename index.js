const express = require('express')
const dotenv = require('dotenv')
const app = express()

dotenv.config()

app.get("/", (req, res) => {
    res.send(":C");
})

app.listen(process.env.SERVER_PORT, () => {
    console.log(`Proyecto escuchando en el puerto ${process.env.SERVER_PORT}`);
})