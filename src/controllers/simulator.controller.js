const simulatorService = require('../services/simulator.service');

// Iniciar simulación
exports.iniciarSimulacion = async (req, res) => {
  try {
    const { intervalo = 5000 } = req.body; // Intervalo en milisegundos
    
    simulatorService.iniciarSimulacion(intervalo);
    
    res.json({
      ok: true,
      message: 'Simulación iniciada correctamente',
      data: {
        intervalo: intervalo,
        estado: simulatorService.getEstado()
      }
    });
  } catch (error) {
    console.error('Error iniciando simulación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Detener simulación
exports.detenerSimulacion = async (req, res) => {
  try {
    simulatorService.detenerSimulacion();
    
    res.json({
      ok: true,
      message: 'Simulación detenida correctamente',
      data: {
        estado: simulatorService.getEstado()
      }
    });
  } catch (error) {
    console.error('Error deteniendo simulación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener estado de la simulación
exports.getEstadoSimulacion = async (req, res) => {
  try {
    const estado = simulatorService.getEstado();
    
    res.json({
      ok: true,
      data: estado
    });
  } catch (error) {
    console.error('Error obteniendo estado de simulación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Agregar vehículo a la simulación
exports.agregarVehiculo = async (req, res) => {
  try {
    const { vehicleId, nombre } = req.body;
    
    if (!vehicleId || !nombre) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }
    
    simulatorService.agregarVehiculo(vehicleId, nombre);
    
    res.json({
      ok: true,
      message: 'Vehículo agregado correctamente',
      data: {
        estado: simulatorService.getEstado()
      }
    });
  } catch (error) {
    console.error('Error agregando vehículo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Remover vehículo de la simulación
exports.removerVehiculo = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    
    const removido = simulatorService.removerVehiculo(vehicleId);
    
    if (removido) {
      res.json({
        ok: true,
        message: 'Vehículo removido correctamente',
        data: {
          estado: simulatorService.getEstado()
        }
      });
    } else {
      res.status(404).json({ error: 'Vehículo no encontrado en la simulación' });
    }
  } catch (error) {
    console.error('Error removiendo vehículo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}; 