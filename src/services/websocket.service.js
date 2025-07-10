const sql = require('../db.js');

class WebSocketService {
  constructor() {
    this.clients = new Map(); // Map para almacenar conexiones activas
    this.rooms = new Map();   // Map para salas por vehículo/usuario
  }

  // Inicializar el servicio WebSocket
  initialize(wss) {
    this.wss = wss;
    
    wss.on('connection', (socket) => {
      console.log('🔌 Cliente WebSocket conectado');
      
      // Enviar mensaje de bienvenida
      this.sendToClient(socket, {
        type: 'connection',
        message: 'Conexión establecida',
        timestamp: new Date().toISOString()
      });

      // Manejar mensajes del cliente
      socket.on('message', (message) => {
        this.handleMessage(socket, message);
      });

      // Manejar desconexión
      socket.on('close', () => {
        this.handleDisconnection(socket);
      });

      // Manejar errores
      socket.on('error', (error) => {
        console.error('❌ Error en WebSocket:', error);
        this.handleDisconnection(socket);
      });
    });
  }

  // Manejar mensajes entrantes
  handleMessage(socket, message) {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'subscribe':
          this.subscribeToVehicle(socket, data.vehicleId, data.userId);
          break;
        case 'unsubscribe':
          this.unsubscribeFromVehicle(socket, data.vehicleId);
          break;
        case 'ping':
          this.sendToClient(socket, { type: 'pong', timestamp: Date.now() });
          break;
        default:
          console.log('�� Mensaje no reconocido:', data);
      }
    } catch (error) {
      console.error('❌ Error procesando mensaje:', error);
      this.sendToClient(socket, {
        type: 'error',
        message: 'Error procesando mensaje',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Suscribir cliente a un vehículo específico
  subscribeToVehicle(socket, vehicleId, userId) {
    const roomKey = `vehicle_${vehicleId}`;
    
    // Crear sala si no existe
    if (!this.rooms.has(roomKey)) {
      this.rooms.set(roomKey, new Set());
    }
    
    // Agregar cliente a la sala
    this.rooms.get(roomKey).add(socket);
    this.clients.set(socket, { vehicleId, userId, roomKey });
    
    console.log(`📡 Cliente suscrito al vehículo ${vehicleId}`);
    
    // Enviar confirmación
    this.sendToClient(socket, {
      type: 'subscribed',
      vehicleId,
      message: `Suscrito al vehículo ${vehicleId}`,
      timestamp: new Date().toISOString()
    });
  }

  // Desuscribir cliente de un vehículo
  unsubscribeFromVehicle(socket, vehicleId) {
    const roomKey = `vehicle_${vehicleId}`;
    const room = this.rooms.get(roomKey);
    
    if (room) {
      room.delete(socket);
      if (room.size === 0) {
        this.rooms.delete(roomKey);
      }
    }
    
    this.clients.delete(socket);
    
    this.sendToClient(socket, {
      type: 'unsubscribed',
      vehicleId,
      message: `Desuscrito del vehículo ${vehicleId}`,
      timestamp: new Date().toISOString()
    });
  }

  // Manejar desconexión de cliente
  handleDisconnection(socket) {
    const clientInfo = this.clients.get(socket);
    
    if (clientInfo) {
      const { roomKey } = clientInfo;
      const room = this.rooms.get(roomKey);
      
      if (room) {
        room.delete(socket);
        if (room.size === 0) {
          this.rooms.delete(roomKey);
        }
      }
      
      this.clients.delete(socket);
      console.log(`🔌 Cliente desconectado del vehículo ${clientInfo.vehicleId}`);
    }
  }

  // Enviar datos de sensor a todos los clientes suscritos
  async broadcastSensorData(vehicleId, sensorData) {
    const roomKey = `vehicle_${vehicleId}`;
    const room = this.rooms.get(roomKey);
    
    if (room && room.size > 0) {
      const message = {
        type: 'sensor_data',
        vehicleId,
        data: sensorData,
        timestamp: new Date().toISOString()
      };
      
      room.forEach(client => {
        if (client.readyState === 1) { // WebSocket.OPEN
          this.sendToClient(client, message);
        }
      });
      
      console.log(`📊 Datos enviados a ${room.size} clientes para vehículo ${vehicleId}`);
    }
  }

  // Enviar alertas a todos los clientes
  async broadcastAlert(vehicleId, alertData) {
    const roomKey = `vehicle_${vehicleId}`;
    const room = this.rooms.get(roomKey);
    
    if (room && room.size > 0) {
      const message = {
        type: 'alert',
        vehicleId,
        alert: alertData,
        timestamp: new Date().toISOString()
      };
      
      room.forEach(client => {
        if (client.readyState === 1) {
          this.sendToClient(client, message);
        }
      });
      
      console.log(`🚨 Alerta enviada a ${room.size} clientes para vehículo ${vehicleId}`);
    }
  }

  // Enviar mensaje a un cliente específico
  sendToClient(socket, message) {
    if (socket.readyState === 1) { // WebSocket.OPEN
      socket.send(JSON.stringify(message));
    }
  }

  // Obtener estadísticas de conexiones
  getStats() {
    return {
      totalClients: this.clients.size,
      totalRooms: this.rooms.size,
      rooms: Array.from(this.rooms.entries()).map(([key, room]) => ({
        room: key,
        clients: room.size
      }))
    };
  }
}

module.exports = new WebSocketService();