const app = require('../index');
const request = require('supertest');
const { GeneraToken } = require('../services/jwttoken.service')

const TOKEN = GeneraToken('gvera@uv.mx', 'patito', 'Administrador');

describe("GET /api/productos/:id", function(){
  
  test("TestObtenerProductoExito", async () => {
    const response = await request(app).get("/api/productos/1").set('Authorization', `Bearer ${TOKEN}`).send();
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toEqual(expect.stringContaining("application/json"))
    expect(response.body.productoId).toBeDefined();
    expect(response.body.titulo).toBeDefined();
    expect(response.body.descripcion).toBeDefined();
    expect(response.body.precio).toBeDefined();
    expect(response.body.archivoid).toBeDefined();
    expect(response.body.categorias).toBeDefined();
  });

  test("TestObtenerProductoNoExistente", async () => {
    const response = await request(app).get("/api/productos/400000").set('Authorization', `Bearer ${TOKEN}`).send();
    expect(response.status).toBe(404);
  });

})