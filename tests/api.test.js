const request = require('supertest');
const app = require('../server');
const { sequelize } = require('../src/models');

describe('API Tests', () => {
  
  // Antes de todas las pruebas, sincronizar la base de datos (o conectar)
  beforeAll(async () => {
    // Aquí podrías usar una base de datos de prueba en memoria o una separada
    // Por ahora, solo aseguramos que la conexión esté abierta
    try {
        await sequelize.authenticate();
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
  });

  // Después de todas las pruebas, cerrar la conexión
  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /', () => {
    it('should redirect to login if not authenticated', async () => {
      const res = await request(app).get('/');
      expect(res.statusCode).toEqual(302);
      expect(res.headers.location).toBe('/auth/login');
    });
  });

  describe('GET /auth/login', () => {
    it('should return 200 OK', async () => {
      const res = await request(app).get('/auth/login');
      expect(res.statusCode).toEqual(200);
    });
  });

  // Puedes agregar más pruebas aquí, por ejemplo para la API de dispositivos
  // Necesitarías mockear la autenticación o obtener un token válido primero
});
