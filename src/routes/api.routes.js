const express = require('express');
const router = express.Router();
const { 
  login, 
  ingestData, 
  getSensorData, 
  getVehicleStats, 
  getActiveAlerts,
  getWebSocketStats,
  getAllVehicles,
  getVehiclesWithAlerts,
  getAlertsSummary,
  getVehicleAlertHistory,
  createVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  getVehicleDetailedStats
} = require('../controllers/api.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');
const simulatorRoutes = require('./simulator.routes');

/**
 * @swagger
 * tags:
 *   - name: Autenticación
 *     description: Endpoints para gestión de usuarios y autenticación
 */

/**
 * @swagger
 * /login:
 *   post:
 *     tags: [Autenticación]
 *     summary: Inicia sesión
 *     description: Inicia sesión con correo y contraseña para obtener token JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - correo
 *               - password
 *             properties:
 *               correo:
 *                 type: string
 *                 description: El correo electrónico del usuario
 *                 example: admin@demo.com
 *               password:
 *                 type: string
 *                 description: La contraseña del usuario
 *                 example: "12345"
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 usuario:
 *                   type: object
 *                   properties:
 *                     nombre:
 *                       type: string
 *                     correo:
 *                       type: string
 *                     rol:
 *                       type: string
 *                 token:
 *                   type: string
 *                   description: Token JWT para autenticación
 *       401:
 *         description: Credenciales incorrectas
 *       500:
 *         description: Error interno del servidor
 */
router.post('/login', login);

/**
 * @swagger
 * tags:
 *   - name: Sensores
 *     description: Endpoints para gestión de datos de sensores y alertas
 */

/**
 * @swagger
 * /ingesta:
 *   post:
 *     tags: [Sensores]
 *     summary: Ingesta de datos de sensores
 *     description: Recibe datos de sensores de un vehículo y los almacena en tiempo real
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vehiculo_id
 *               - gps
 *               - combustible
 *               - temperatura
 *               - velocidad
 *               - latitud
 *               - longitud
 *             properties:
 *               vehiculo_id:
 *                 type: string
 *                 description: El ID del dispositivo del vehículo
 *                 example: "VH1ZU432E"
 *               gps:
 *                 type: string
 *                 description: La posición GPS en formato decimal
 *                 example: "ABC123"
 *               combustible:
 *                 type: number
 *                 description: El nivel de combustible de 0 a 100
 *                 example: 25
 *               temperatura:
 *                 type: number
 *                 description: La temperatura en grados Celsius
 *                 example: 85
 *               velocidad:
 *                 type: number
 *                 description: La velocidad en km/h
 *                 example: 75
 *               latitud:
 *                 type: number
 *                 description: La latitud
 *                 example: 6.25184
 *               longitud:
 *                 type: number
 *                 description: La longitud
 *                 example: -75.56359
 *     responses:
 *       200:
 *         description: Datos recibidos y procesados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                 websocket_sent:
 *                   type: boolean
 *       400:
 *         description: Faltan datos obligatorios
 *       404:
 *         description: Vehículo no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/ingesta', authMiddleware, ingestData);

/**
 * @swagger
 * /sensores/{vehicleId}:
 *   get:
 *     tags: [Sensores]
 *     summary: Obtener datos de sensores
 *     description: Obtiene los datos de sensores de un vehículo específico
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del vehículo
 *         example: "VH1ZU432E"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Número máximo de registros a retornar
 *     responses:
 *       200:
 *         description: Datos de sensores
 *       404:
 *         description: Vehículo no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/sensores/:vehicleId', authMiddleware, getSensorData);

/**
 * @swagger
 * /alerts/{vehicleId}:
 *   get:
 *     tags: [Sensores]
 *     summary: Obtener alertas activas
 *     description: Obtiene las alertas activas de un vehículo en la última hora
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del vehículo
 *         example: "VH1ZU432E"
 *     responses:
 *       200:
 *         description: Alertas activas
 *       404:
 *         description: Vehículo no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/alerts/:vehicleId', authMiddleware, getActiveAlerts);

/**
 * @swagger
 * /alerts/summary:
 *   get:
 *     tags: [Sensores]
 *     summary: Obtener resumen de alertas
 *     description: Obtiene un resumen de alertas por tipo en la última hora
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resumen de alertas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_alertas:
 *                   type: integer
 *                 alertas_combustible:
 *                   type: integer
 *                 alertas_temperatura:
 *                   type: integer
 *                 alertas_velocidad:
 *                   type: integer
 *       500:
 *         description: Error interno del servidor
 */
router.get('/alerts/summary', authMiddleware, getAlertsSummary);

/**
 * @swagger
 * tags:
 *   - name: Vehículos
 *     description: Endpoints para gestión de vehículos y posicionamiento
 */

/**
 * @swagger
 * /vehicles:
 *   get:
 *     tags: [Vehículos]
 *     summary: Obtener todos los vehículos
 *     description: Obtiene todos los vehículos con su última posición y estado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de vehículos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       nombre:
 *                         type: string
 *                       dispositivo_id:
 *                         type: string
 *                       latitud:
 *                         type: number
 *                       longitud:
 *                         type: number
 *                       estado:
 *                         type: string
 *       500:
 *         description: Error interno del servidor
 */
router.get('/vehicles', authMiddleware, getAllVehicles);

/**
 * @swagger
 * /vehicles/alerts:
 *   get:
 *     tags: [Vehículos]
 *     summary: Obtener vehículos con alertas
 *     description: Obtiene todos los vehículos que tienen alertas activas
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de vehículos con alertas
 *       500:
 *         description: Error interno del servidor
 */
router.get('/vehicles/alerts', authMiddleware, getVehiclesWithAlerts);

/**
 * @swagger
 * /vehicles/{vehicleId}/alerts/history:
 *   get:
 *     tags: [Vehículos]
 *     summary: Obtener historial de alertas
 *     description: Obtiene el historial de alertas de un vehículo específico
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del vehículo
 *         example: "VH1ZU432E"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Número máximo de registros
 *     responses:
 *       200:
 *         description: Historial de alertas
 *       404:
 *         description: Vehículo no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/vehicles/:vehicleId/alerts/history', authMiddleware, getVehicleAlertHistory);

/**
 * @swagger
 * /stats/{vehicleId}:
 *   get:
 *     tags: [Vehículos]
 *     summary: Obtener estadísticas del vehículo
 *     description: Obtiene estadísticas de los últimos 24 horas de un vehículo
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del vehículo
 *         example: "VH1ZU432E"
 *     responses:
 *       200:
 *         description: Estadísticas del vehículo
 *       404:
 *         description: Vehículo no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/stats/:vehicleId', authMiddleware, getVehicleStats);

/**
 * @swagger
 * tags:
 *   - name: WebSocket
 *     description: Endpoints para estadísticas de WebSocket
 */

/**
 * @swagger
 * /websocket/stats:
 *   get:
 *     tags: [WebSocket]
 *     summary: Obtener estadísticas del WebSocket
 *     description: Obtiene información sobre las conexiones WebSocket activas
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas del WebSocket
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalClients:
 *                   type: integer
 *                 totalRooms:
 *                   type: integer
 *                 rooms:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       room:
 *                         type: string
 *                       clients:
 *                         type: integer
 *       500:
 *         description: Error interno del servidor
 */
router.get('/websocket/stats', authMiddleware, getWebSocketStats);

// Rutas del simulador
router.use('/simulador', simulatorRoutes);

// ===== CRUD DE VEHÍCULOS =====


/**
 * @swagger
 * /vehiculos:
 *   post:
 *     tags: [Vehículos]
 *     summary: Crear un vehículo
 *     description: Crea un nuevo vehículo en la base de datos
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - dispositivo_id
 *             properties:
 *               nombre:
 *                 type: string
 *                 description: El nombre del vehículo
 *                 example: "Camión 1"
 *               dispositivo_id:
 *                 type: string
 *                 description: El ID del dispositivo del vehículo (debe ser único)
 *                 example: "VH123456"
 *               usuario_id:
 *                 type: integer
 *                 description: ID del usuario propietario (opcional)
 *                 example: 1
 *     responses:
 *       201:
 *         description: Vehículo creado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     nombre:
 *                       type: string
 *                     dispositivo_id:
 *                       type: string
 *                     usuario_id:
 *                       type: integer
 *       400:
 *         description: Faltan datos obligatorios
 *       409:
 *         description: Ya existe un vehículo con este dispositivo_id
 *       500:
 *         description: Error interno del servidor
 */
router.post('/vehiculos', authMiddleware, createVehicle);

/**
 * @swagger
 * /vehiculos:
 *   get:
 *     tags: [Vehículos]
 *     summary: Listar vehículos
 *     description: Obtiene una lista paginada de vehículos con opciones de búsqueda
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Número de elementos por página
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Término de búsqueda (nombre o dispositivo_id)
 *     responses:
 *       200:
 *         description: Lista de vehículos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       nombre:
 *                         type: string
 *                       dispositivo_id:
 *                         type: string
 *                       usuario_id:
 *                         type: integer
 *                       usuario_nombre:
 *                         type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     hasNext:
 *                       type: boolean
 *                     hasPrev:
 *                       type: boolean
 *       500:
 *         description: Error interno del servidor
 */
router.get('/vehiculos', authMiddleware, getVehicles);

/**
 * @swagger
 * /vehiculos/{id}:
 *   get:
 *     tags: [Vehículos]
 *     summary: Obtener un vehículo por ID
 *     description: Obtiene los datos de un vehículo específico por su ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del vehículo
 *         example: 1
 *     responses:
 *       200:
 *         description: Vehículo encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     nombre:
 *                       type: string
 *                     dispositivo_id:
 *                       type: string
 *                     usuario_id:
 *                       type: integer
 *                     usuario_nombre:
 *                       type: string
 *       404:
 *         description: Vehículo no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/vehiculos/:id', authMiddleware, getVehicleById);

/**
 * @swagger
 * /vehiculos/{id}:
 *   put:
 *     tags: [Vehículos]
 *     summary: Actualizar un vehículo
 *     description: Actualiza los datos de un vehículo existente
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del vehículo
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 description: El nombre del vehículo
 *                 example: "Camión 1 Modificado"
 *               dispositivo_id:
 *                 type: string
 *                 description: El ID del dispositivo del vehículo (debe ser único)
 *                 example: "VH654321"
 *               usuario_id:
 *                 type: integer
 *                 description: ID del usuario propietario
 *                 example: 2
 *     responses:
 *       200:
 *         description: Vehículo actualizado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     nombre:
 *                       type: string
 *                     dispositivo_id:
 *                       type: string
 *                     usuario_id:
 *                       type: integer
 *       400:
 *         description: Debe proporcionar al menos un campo para actualizar
 *       404:
 *         description: Vehículo no encontrado
 *       409:
 *         description: Ya existe otro vehículo con este dispositivo_id
 *       500:
 *         description: Error interno del servidor
 */
router.put('/vehiculos/:id', authMiddleware, updateVehicle);

/**
 * @swagger
 * /vehiculos/{id}:
 *   delete:
 *     tags: [Vehículos]
 *     summary: Eliminar un vehículo
 *     description: Elimina un vehículo específico por su ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del vehículo
 *         example: 1
 *     responses:
 *       200:
 *         description: Vehículo eliminado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     nombre:
 *                       type: string
 *       404:
 *         description: Vehículo no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete('/vehiculos/:id', authMiddleware, deleteVehicle);

module.exports = router;
