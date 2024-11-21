const app = require('../index');
const request = require('supertest');
const { GeneraToken } = require('../services/jwttoken.service')

const TOKEN = GeneraToken('gvera@uv.mx', 'patito', 'Administrador');

describe("GET /api/categorias/:id", function(){
  
  test("TestObtenerCategoriaExito", async () => {
    const response = await request(app).get("/api/categorias/1").set('Authorization', `Bearer ${TOKEN}`).send();
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toEqual(expect.stringContaining("application/json"))
    expect(response.body.categoriaId).toBeDefined();
    expect(response.body.nombre).toBeDefined();
    expect(response.body.protegida).toBeDefined();
  });

  test("TestObtenerCategoriaNoExistente", async () => {
    const response = await request(app).get("/api/categorias/400000").set('Authorization', `Bearer ${TOKEN}`).send();
    expect(response.status).toBe(404);
  });

})