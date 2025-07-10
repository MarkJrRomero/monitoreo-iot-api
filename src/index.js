require('dotenv').config();
const express = require('express');
const app = express();
const http = require('http');
const WebSocket = require('ws');

app.use(express.json());

// Rutas
const apiRoutes = require('./routes/api.routes');
app.use('/api', apiRoutes);

// Servidor HTTP y WebSocket
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (socket) => {
  console.log('Cliente WebSocket conectado');
  socket.send(JSON.stringify({ msg: "Conexión establecida" }));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});






