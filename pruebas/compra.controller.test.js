const app = require('../index');
const request = require('supertest');
const { GeneraToken } = require('../services/jwttoken.service');

const TOKEN = GeneraToken('patito@uv.mx', 'patito', 'Usuario');

describe("GET /api/compras/personal", function () {

    test("TestObtenerComprasPersonalExito", async () => {
        const response = await request(app).get("/api/compras/personal").set('Authorization', `Bearer ${TOKEN}`).send();
        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toEqual(expect.stringContaining("application/json"));
        expect(response.body).toBeInstanceOf(Array);
        response.body.forEach(compra => {
            expect(compra).toHaveProperty('id');
            expect(compra).toHaveProperty('fechapedido');
            expect(compra).toHaveProperty('totalCantidad');
            expect(compra).toHaveProperty('totalPrecio');
        });
    });

});


describe("POST /api/compras", function () {

    test("TestCrearCompraExito", async () => {
        const requestBody = {
            productos: [
                { productoid: 15, cantidad: 1 },
                { productoid: 14, cantidad: 2 },
                { productoid: 13, cantidad: 3 }
            ]
        };
        const response = await request(app).post("/api/compras").set('Authorization', `Bearer ${TOKEN}`).send(requestBody);

        expect(response.status).toBe(201);
        expect(response.headers['content-type']).toEqual(expect.stringContaining("application/json"));

        expect(response.body.id).toBeDefined(); 
        expect(response.body.fechapedido).toBeDefined(); 
        expect(response.body.usuarioid).toBeDefined(); 
    });
});


describe("POST /api/compras", function () {

    test("TestCompraSinStock", async () => {
        const requestBody = {
            productos: [
                { productoid: 15, cantidad: 10000 },
                { productoid: 14, cantidad: 2 },
                { productoid: 13, cantidad: 3 }
            ]
        };
        const response = await request(app).post("/api/compras").set('Authorization', `Bearer ${TOKEN}`).send(requestBody);

        expect(response.status).toBe(409);
    });
});


describe("POST /api/compras", function () {

    test("TestCompraProductoInexistente", async () => {
        const requestBody = {
            productos: [
                { productoid: 150000, cantidad: 1 },
                { productoid: 14, cantidad: 2 },
                { productoid: 13, cantidad: 3 }
            ]
        };
        const response = await request(app).post("/api/compras").set('Authorization', `Bearer ${TOKEN}`).send(requestBody);

        expect(response.status).toBe(404);
    });
});
