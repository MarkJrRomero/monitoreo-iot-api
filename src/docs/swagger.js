const swaggerJSDoc = require('swagger-jsdoc');
require('dotenv').config();

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'API Monitoreo IoT',
    version: '1.0.0',
    description: 'Documentación de la API para monitoreo de flotas vehiculares con WebSocket en tiempo real',
  },
  servers: [
    {
      url: `${process.env.BASE_API_URL}/api`,
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

// Agregar documentación del simulador
const simulatorPaths = {
  '/simulador/iniciar': {
    post: {
      tags: ['Simulador'],
      summary: 'Iniciar simulación automática de sensores',
      description: 'Inicia una simulación automática que envía datos de sensores cada cierto intervalo',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                intervalo: {
                  type: 'number',
                  description: 'Intervalo en milisegundos entre envíos (por defecto: 5000)',
                  example: 5000
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Simulación iniciada correctamente'
        }
      }
    }
  },
  '/simulador/detener': {
    post: {
      tags: ['Simulador'],
      summary: 'Detener simulación automática de sensores',
      description: 'Detiene la simulación automática de sensores',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Simulación detenida correctamente'
        }
      }
    }
  },
  '/simulador/estado': {
    get: {
      tags: ['Simulador'],
      summary: 'Obtener estado de la simulación',
      description: 'Devuelve el estado actual de la simulación automática',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Estado de la simulación'
        }
      }
    }
  },
  '/simulador/vehiculos': {
    post: {
      tags: ['Simulador'],
      summary: 'Agregar vehículo a la simulación',
      description: 'Agrega un vehículo a la lista de vehículos simulados',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                vehicleId: { type: 'string', example: 'VEH999999' },
                nombre: { type: 'string', example: 'Camión Demo' }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Vehículo agregado correctamente'
        }
      }
    }
  },
  '/simulador/vehiculos/{vehicleId}': {
    delete: {
      tags: ['Simulador'],
      summary: 'Remover vehículo de la simulación',
      description: 'Remueve un vehículo de la lista de vehículos simulados',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'vehicleId',
          in: 'path',
          required: true,
          schema: { type: 'string' }
        }
      ],
      responses: {
        200: {
          description: 'Vehículo removido correctamente'
        },
        404: {
          description: 'Vehículo no encontrado en la simulación'
        }
      }
    }
  }
};

// Luego, en tu export de swaggerSpec, asegúrate de incluir estos paths:
const swaggerSpecWithSimulator = {
  ...swaggerSpec,
  paths: {
    ...swaggerSpec.paths,
    ...simulatorPaths
  }
};

module.exports = swaggerSpecWithSimulator;
