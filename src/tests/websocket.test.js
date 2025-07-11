const request = require('supertest');
const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const { createToken } = require('../utils/jwt');
require('dotenv').config();

// Mock de la base de datos
jest.mock('../db.js', () => {
  return jest.fn((strings, ...values) => {
    const query = strings.reduce((result, str, i) => {
      return result + str + (values[i] || '');
    }, '');
    
    if (query.includes("SELECT id FROM vehiculos")) {
      return Promise.resolve([{ id: 1 }]);
    }
    if (query.includes("INSERT INTO sensores")) {
      return Promise.resolve([{ id: 1 }]);
    }
    return Promise.resolve([]);
  });
});

// Crear token de prueba
const token = createToken(
  { id: 1, rol: "admin", correo: "admin@demo.com" },
  process.env.JWT_SECRET,
  3600000
);

const apiRoutes = require('../routes/api.routes');
const websocketService = require('../services/websocket.service');

describe('WebSocket Tests', () => {
  let server, wss, app;

  beforeAll((done) => {
    app = express();
    app.use(express.json());
    app.use('/api', apiRoutes);
    
    server = http.createServer(app);
    wss = new WebSocket.Server({ server });
    websocketService.initialize(wss);
    
    // Iniciar el servidor en un puerto específico para tests
    server.listen(0, () => { // Puerto 0 = puerto aleatorio disponible
      done();
    });
  });

  afterAll((done) => {
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  test('debe conectarse al WebSocket', (done) => {
    const port = server.address().port;
    const ws = new WebSocket(`ws://localhost:${port}?token=${token}`);
    
    ws.on('open', () => {
      expect(ws.readyState).toBe(WebSocket.OPEN);
      ws.close();
      done();
    });

    ws.on('error', (error) => {
      console.error('Error en WebSocket:', error);
      done(error);
    });
  });

  test('debe recibir mensaje de bienvenida', (done) => {
    const port = server.address().port;
    const ws = new WebSocket(`ws://localhost:${port}?token=${token}`);
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        expect(message.type).toBe('connection');
        expect(message.message).toBe('Conexión establecida y autenticada');
        ws.close();
        done();
      } catch (error) {
        done(error);
      }
    });

    ws.on('error', (error) => {
      console.error('Error en WebSocket:', error);
      done(error);
    });
  });

  test('debe suscribirse a un vehículo', (done) => {
    const port = server.address().port;
    const ws = new WebSocket(`ws://localhost:${port}?token=${token}`);
    
    ws.on('open', () => {
      const subscribeMessage = {
        type: 'subscribe',
        vehicleId: 'VH1ZU432E',
        userId: 'test-user'
      };
      
      ws.send(JSON.stringify(subscribeMessage));
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        if (message.type === 'subscribed') {
          expect(message.vehicleId).toBe('VH1ZU432E');
          expect(message.message).toContain('Suscrito al vehículo');
          ws.close();
          done();
        }
      } catch (error) {
        done(error);
      }
    });

    ws.on('error', (error) => {
      console.error('Error en WebSocket:', error);
      done(error);
    });
  });

  test('debe responder a ping', (done) => {
    const port = server.address().port;
    const ws = new WebSocket(`ws://localhost:${port}?token=${token}`);
    
    ws.on('open', () => {
      const pingMessage = { type: 'ping' };
      ws.send(JSON.stringify(pingMessage));
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        if (message.type === 'pong') {
          expect(message.timestamp).toBeDefined();
          ws.close();
          done();
        }
      } catch (error) {
        done(error);
      }
    });

    ws.on('error', (error) => {
      console.error('Error en WebSocket:', error);
      done(error);
    });
  });

  test('debe obtener estadísticas del WebSocket', async () => {
    const stats = websocketService.getStats();
    
    expect(stats).toHaveProperty('totalClients');
    expect(stats).toHaveProperty('totalRooms');
    expect(stats).toHaveProperty('rooms');
    expect(Array.isArray(stats.rooms)).toBe(true);
  });
}); 