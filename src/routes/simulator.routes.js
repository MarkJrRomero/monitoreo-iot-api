const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth.middleware');
const simulatorController = require('../controllers/simulator.controller');

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// Rutas del simulador
router.post('/iniciar', simulatorController.iniciarSimulacion);
router.post('/detener', simulatorController.detenerSimulacion);
router.get('/estado', simulatorController.getEstadoSimulacion);
router.post('/vehiculos', simulatorController.agregarVehiculo);
router.delete('/vehiculos/:vehicleId', simulatorController.removerVehiculo);

module.exports = router;