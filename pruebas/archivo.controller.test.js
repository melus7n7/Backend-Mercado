const app = require('../index');
const request = require('supertest');
const { GeneraToken } = require('../services/jwttoken.service')

const TOKEN = GeneraToken('gvera@uv.mx', 'patito', 'Administrador');

describe("GET Detalle /api/archivos/:id", function(){
  
  test("TestObtenerArchivoExito", async () => {
    const response = await request(app).get("/api/archivos/1/detalle").set('Authorization', `Bearer ${TOKEN}`).send();
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toEqual(expect.stringContaining("application/json"))
    expect(response.body.archivoId).toBeDefined();
    expect(response.body.mime).toBeDefined();
    expect(response.body.indb).toBeDefined();
    expect(response.body.nombre).toBeDefined();
    expect(response.body.size).toBeDefined();
  });

  test("TestObtenerArchivoNoExistente", async () => {
    const response = await request(app).get("/api/archivos/400000/detalle").set('Authorization', `Bearer ${TOKEN}`).send();
    expect(response.status).toBe(404);
  });

})