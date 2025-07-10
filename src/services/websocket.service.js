const sql = require('../db.js');
const { verifyToken } = require('../utils/jwt');

class WebSocketService {
  constructor() {
    this.clients = new Map(); // Map para almacenar conexiones activas
    this.rooms = new Map();   // Map para salas por vehículo/usuario
  }

  // Inicializar el servicio WebSocket
  initialize(wss) {
    this.wss = wss;
    
    wss.on('connection', (socket, request) => {
      console.log('🔌 Cliente WebSocket conectado');
      
      // Verificar autenticación
      const isAuthenticated = this.authenticateConnection(socket, request);
      
      if (!isAuthenticated) {
        console.log('❌ Conexión rechazada - No autenticado');
        socket.close(1008, 'No autenticado');
        return;
      }
      
      // Enviar mensaje de bienvenida
      this.sendToClient(socket, {
        type: 'connection',
        message: 'Conexión establecida y autenticada',
        timestamp: new Date().toISOString()
      });

      // Manejar mensajes del cliente
      socket.on('message', (message) => {
        console.log('📨 Mensaje recibido:', message.toString());
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

  // Autenticar conexión WebSocket
  authenticateConnection(socket, request) {
    try {
      // Obtener token de los headers o query params
      const token = this.extractToken(request);
      
      if (!token) {
        console.log('❌ No se proporcionó token');
        return false;
      }

      // Verificar token
      const decoded = verifyToken(token, process.env.JWT_SECRET);
      
      if (!decoded) {
        console.log('❌ Token inválido o expirado');
        return false;
      }

      // Guardar información del usuario en el socket
      socket.user = decoded;
      console.log(`✅ Usuario autenticado: ${decoded.correo} (${decoded.rol})`);
      
      return true;
    } catch (error) {
      console.error('❌ Error en autenticación:', error);
      return false;
    }
  }

  // Extraer token de la request
  extractToken(request) {
    // Intentar obtener de query params
    const url = new URL(request.url, `http://${request.headers.host}`);
    let token = url.searchParams.get('token');
    
    // Si no está en query params, intentar de headers
    if (!token) {
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    return token;
  }

  // Manejar mensajes entrantes
  handleMessage(socket, message) {
    try {
      const data = JSON.parse(message);
      console.log('📨 Mensaje parseado:', data);
      
      // Verificar que el usuario esté autenticado
      if (!socket.user) {
        this.sendToClient(socket, {
          type: 'error',
          message: 'No autenticado',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      switch (data.type) {
        case 'subscribe':
          this.subscribeToVehicle(socket, data.vehicleId, socket.user);
          break;
        case 'unsubscribe':
          this.unsubscribeFromVehicle(socket, data.vehicleId);
          break;
        case 'ping':
          this.sendToClient(socket, { type: 'pong', timestamp: Date.now() });
          break;
        default:
          console.log('❓ Mensaje no reconocido:', data);
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
  subscribeToVehicle(socket, vehicleId, user) {
    const roomKey = `vehicle_${vehicleId}`;
    console.log(` Intentando suscribir usuario ${user.correo} al vehículo ${vehicleId} en sala ${roomKey}`);
    
    // Crear sala si no existe
    if (!this.rooms.has(roomKey)) {
      this.rooms.set(roomKey, new Set());
      console.log(`🏠 Sala creada: ${roomKey}`);
    }
    
    // Agregar cliente a la sala
    this.rooms.get(roomKey).add(socket);
    this.clients.set(socket, { 
      vehicleId, 
      userId: user.id, 
      userEmail: user.correo,
      userRole: user.rol,
      roomKey 
    });
    
    console.log(`✅ Usuario ${user.correo} suscrito al vehículo ${vehicleId}`);
    console.log(`📊 Estado actual: ${this.rooms.get(roomKey).size} clientes en sala ${roomKey}`);
    
    // Enviar confirmación
    this.sendToClient(socket, {
      type: 'subscribed',
      vehicleId,
      user: {
        id: user.id,
        correo: user.correo,
        rol: user.rol
      },
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

  // Obtener estadísticas de conexiones con información de usuarios
  getStats() {
    return {
      totalClients: this.clients.size,
      totalRooms: this.rooms.size,
      rooms: Array.from(this.rooms.entries()).map(([key, room]) => ({
        room: key,
        clients: room.size,
        users: Array.from(room).map(client => {
          const clientInfo = this.clients.get(client);
          return clientInfo ? {
            id: clientInfo.userId,
            email: clientInfo.userEmail,
            role: clientInfo.userRole
          } : null;
        }).filter(Boolean)
      }))
    };
  }
}

module.exports = new WebSocketService();