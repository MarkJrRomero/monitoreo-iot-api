const swaggerJSDoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'API Monitoreo IoT',
    version: '1.0.0',
    description: 'Documentación de la API para monitoreo de flotas vehiculares con WebSocket en tiempo real',
  },
  servers: [
    {
      url: 'http://localhost:3000/api',
      description: 'Servidor de desarrollo'
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
  tags: [
    {
      name: 'Autenticación',
      description: 'Endpoints para gestión de usuarios y autenticación'
    },
    {
      name: 'Sensores',
      description: 'Endpoints para gestión de datos de sensores y alertas'
    },
    {
      name: 'Vehículos',
      description: 'Endpoints para gestión de vehículos y posicionamiento'
    },
    {
      name: 'WebSocket',
      description: 'Endpoints para estadísticas de WebSocket'
    }
  ]
};

const options = {
  swaggerDefinition,
  apis: ['./src/routes/*.js'], // apunta a donde defines tus rutas con comentarios
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
