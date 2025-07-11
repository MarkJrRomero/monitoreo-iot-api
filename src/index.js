require('dotenv').config();
const express = require('express');
const app = express();
const http = require('http');
const WebSocket = require('ws');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./docs/swagger');
const websocketService = require('./services/websocket.service');
const path = require('path');
const cors = require('cors');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar CORS - debe ir antes de las rutas
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// Servir archivos estáticos desde la carpeta public
app.use(express.static(path.join(__dirname, '../public')));

// Rutas
const apiRoutes = require('./routes/api.routes');
app.use('/api', apiRoutes);

// Documentación Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Servidor HTTP y WebSocket
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Inicializar servicio WebSocket
websocketService.initialize(wss);

// Endpoint para estadísticas de WebSocket
app.get('/api/websocket/stats', (req, res) => {
  res.json({
    ok: true,
    data: websocketService.getStats()
  });
});

// Ruta para el cliente de prueba WebSocket
app.get('/websocket-test', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/websocket-test.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en puerto ${PORT}`);
  console.log(`📊 Documentación disponible en http://localhost:${PORT}/api-docs`);
  console.log(`🔌 WebSocket disponible en ws://localhost:${PORT}`);
  console.log(`🧪 Cliente de prueba WebSocket en http://localhost:${PORT}/websocket-test`);
});






