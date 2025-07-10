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

router.post('/ingesta', authMiddleware, ingestData);


module.exports = router;
