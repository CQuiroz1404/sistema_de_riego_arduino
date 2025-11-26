const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sistema de Riego IoT API',
      version: '1.0.0',
      description: 'API para el control y monitoreo del sistema de riego automatizado con Arduino y MQTT',
      contact: {
        name: 'Soporte',
        email: 'soporte@ejemplo.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de Desarrollo',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
        },
      },
    },
  },
  apis: ['./src/routes/*.js', './src/models/*.js'], // Archivos donde buscar anotaciones
};

const specs = swaggerJsdoc(options);

module.exports = specs;
