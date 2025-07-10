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
  getVehicleAlertHistory
} = require('../controllers/api.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Inicia sesión
 *     description: Inicia sesión con correo y contraseña
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               correo:
 *                 type: string
 *                 description: El correo electrónico del usuario
 *               password:
 *                 type: string
 *                 description: La contraseña del usuario
 *     responses:
 *       200:
 *         description: Token de autenticación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: Token de autenticación
 *       401:
 *         description: Credenciales incorrectas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Mensaje de error
 *       500:
 *         description: Error interno del servidor
 */
router.post('/login', login);


/**
 * @swagger
 * /ingesta:
 *   post:
 *     summary: Ingesta de datos
 *     description: Ingesta de datos de sensores
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vehiculo_id:
 *                 type: string
 *                 description: El ID del dispositivo
 *               gps:
 *                 type: string
 *                 description: La posición GPS en formato decimal
 *               combustible:
 *                 type: number
 *                 description: El nivel de combustible de 0 a 100
 *               temperatura:
 *                 type: number
 *                 description: La temperatura en grados Celsius
 *               velocidad:
 *                 type: number
 *                 description: La velocidad en km/h
 *               latitud:
 *                 type: number
 *                 description: La latitud
 *               longitud:
 *                 type: number
 *                 description: La longitud
 *     responses:
 *       200:
 *         description: Datos recibidos
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
 * /stats/{vehicleId}:
 *   get:
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
 * /alerts/{vehicleId}:
 *   get:
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
 * /vehicles:
 *   get:
 *     summary: Obtener todos los vehículos
 *     description: Obtiene todos los vehículos con su última posición y estado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de vehículos
 *       500:
 *         description: Error interno del servidor
 */
router.get('/vehicles', authMiddleware, getAllVehicles);

/**
 * @swagger
 * /vehicles/alerts:
 *   get:
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
 * /alerts/summary:
 *   get:
 *     summary: Obtener resumen de alertas
 *     description: Obtiene un resumen de alertas por tipo
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resumen de alertas
 *       500:
 *         description: Error interno del servidor
 */
router.get('/alerts/summary', authMiddleware, getAlertsSummary);

/**
 * @swagger
 * /vehicles/{vehicleId}/alerts/history:
 *   get:
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

module.exports = router;
