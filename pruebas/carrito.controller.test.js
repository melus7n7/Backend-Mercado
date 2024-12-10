const app = require('../index');
const request = require('supertest');
const { GeneraToken } = require('../services/jwttoken.service')

const TOKEN = GeneraToken('patito@uv.mx', 'patito', 'Usuario');

describe("GET /api/carritos/", function(){
  
  test("TestObtenerCarritoExito", async () => {
    const response = await request(app).get("/api/carritos/").set('Authorization', `Bearer ${TOKEN}`).send();
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toEqual(expect.stringContaining("application/json"))
  });

})