const express = require('express');
const router = express.Router();
const { login, ingestData } = require('../controllers/api.controller');
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


module.exports = router;
