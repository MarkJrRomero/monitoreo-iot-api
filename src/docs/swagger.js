const swaggerJSDoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'API Monitoreo IoT',
    version: '1.0.0',
    description: 'Documentación de la API para monitoreo de flotas vehiculares',
  },
  servers: [
    {
      url: 'http://localhost:3000/api',
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ['./src/routes/*.js'], // apunta a donde defines tus rutas con comentarios
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;
