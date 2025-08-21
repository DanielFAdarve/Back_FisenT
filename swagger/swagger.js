const swaggerJsdoc = require('swagger-jsdoc');

const url_swagger = process.env.URL_SWAGGER || 'http://localhost:3000';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Gestión Médica',
      version: '1.0.0',
      description: 'Documentación de la API de gestión de pacientes, citas y más. para terapias',
    },
    servers: [
      {
        url: url_swagger,
        description: 'Servidor local',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [__dirname + '/../src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
