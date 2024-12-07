const app = require('../index');
const request = require('supertest');
const { GeneraToken } = require('../services/jwttoken.service');

const TOKEN = GeneraToken('gvera@uv.mx', 'patito', 'Administrador');

describe("GET /api/bitacora", function () {

    test("TestObtenerBitacoraExito", async () => {
        const response = await request(app).get("/api/bitacora").set('Authorization', `Bearer ${TOKEN}`).send();

        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toEqual(expect.stringContaining("application/json"));
        expect(response.body).toBeInstanceOf(Array);

        response.body.forEach(bitacora => {
            expect(bitacora.bitacoraId).toBeDefined(); 
            expect(bitacora.accion).toBeDefined(); 
            expect(bitacora.elementoid).toBeDefined(); 
            expect(bitacora.ip).toBeDefined();
            expect(bitacora.usuario).toBeDefined(); 
            expect(bitacora.fecha).toBeDefined(); 
        });
    });

});
