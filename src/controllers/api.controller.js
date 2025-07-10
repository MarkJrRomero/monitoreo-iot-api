const { createToken } = require('../utils/jwt');
const sql = require('../db.js');
const bcrypt = require('bcrypt');
const websocketService = require('../services/websocket.service');

exports.login = async (req, res) => {
  const { correo, password } = req.body;
  
  try {
    const result = await sql`
      SELECT id, nombre, correo, password, rol
      FROM usuarios
      WHERE correo = ${correo}
    `;

    const usuario = result[0];
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const valid = await bcrypt.compare(password, usuario.password);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const token = createToken(
      { id: usuario.id, correo: usuario.correo, rol: usuario.rol },
      process.env.JWT_SECRET,
      3600000
    );

    res.json({ usuario: {nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol}, token });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.ingestData = async (req, res) => {
  const { vehiculo_id, gps, combustible, temperatura, velocidad, latitud, longitud } = req.body;

  if (!vehiculo_id || !gps || combustible === null || temperatura === null || velocidad === null || latitud === null || longitud === null) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  try {
    const vehiculo = await sql`
      SELECT id FROM vehiculos WHERE dispositivo_id = ${vehiculo_id}
    `;

    if (!vehiculo.length) {
      return res.status(404).json({ error: 'Vehículo no encontrado' });
    }

    let estado = '';

    if (combustible <= 10) {
      if (estado === '') {
        estado += 'alerta de combustible';
      } else {
        estado += '| alerta de combustible';
      }
    }

    if (temperatura >= 90) {
      if (estado === '') {
        estado += 'alerta de temperatura';
      } else {
        estado += '| alerta de temperatura';
      }
    }

    if (velocidad > 80) {
      if (estado === '') {
        estado += 'alerta de exceso de velocidad';
      } else {
        estado += '| alerta de exceso de velocidad';
      }
    }

    if (estado === '') {
      estado = 'normal';
    }

    const sensorData = {
      vehiculo_id: vehiculo[0].id,
      dispositivo_id: vehiculo_id,
      gps,
      combustible,
      temperatura,
      velocidad,
      latitud,
      longitud,
      estado,
      timestamp: new Date().toISOString()
    };


    await sql`
      INSERT INTO sensores (vehiculo_id, gps, combustible, temperatura, velocidad, latitud, longitud, estado)
      VALUES (${sensorData.vehiculo_id}, ${sensorData.gps}, ${sensorData.combustible}, ${sensorData.temperatura}, ${sensorData.velocidad}, ${sensorData.latitud}, ${sensorData.longitud}, ${sensorData.estado})
    `;

    // Enviar datos en tiempo real por WebSocket
    try {
      await websocketService.broadcastSensorData(vehiculo_id, sensorData);
      console.log(`Datos enviados por WebSocket para vehículo ${vehiculo_id}`);
    } catch (wsError) {
      console.error('Error enviando datos por WebSocket:', wsError);
      // No fallar la respuesta HTTP si WebSocket falla
    }

    // Si hay alertas, enviarlas también por WebSocket
    if (estado !== 'normal') {
      try {
        await websocketService.broadcastAlert(vehiculo_id, {
          tipo: estado,
          datos: sensorData,
          timestamp: new Date().toISOString()
        });
        console.log(`Alerta enviada por WebSocket para vehículo ${vehiculo_id}`);
      } catch (alertError) {
        console.error('Error enviando alerta por WebSocket:', alertError);
      }
    }

    res.json({ ok: true, data: { vehiculo_id, gps, combustible, temperatura, velocidad, latitud, longitud, estado } });
  } catch (err) {
    console.error('Error en ingesta:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};


exports.getSensorData = async (req, res) => {
  const { vehicleId } = req.params;
  const { limit = 100 } = req.query;

  try {
    const vehicleExists = await sensoresService.vehicleExists(vehicleId);
    if (!vehicleExists) {
      return res.status(404).json({ error: 'Vehículo no encontrado' });
    }

    const sensorData = await sensoresService.getSensorDataByVehicle(vehicleId, limit);
    
    res.json({
      ok: true,
      data: sensorData
    });
  } catch (error) {
    console.error('Error obteniendo datos de sensores:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Endpoint para obtener estadísticas
exports.getVehicleStats = async (req, res) => {
  const { vehicleId } = req.params;

  try {
    const vehicleExists = await sensoresService.vehicleExists(vehicleId);
    if (!vehicleExists) {
      return res.status(404).json({ error: 'Vehículo no encontrado' });
    }

    const stats = await sensoresService.getVehicleStats(vehicleId);
    
    res.json({
      ok: true,
      data: stats
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Endpoint para obtener alertas activas
exports.getActiveAlerts = async (req, res) => {
  const { vehicleId } = req.params;

  try {
    const vehicleExists = await sensoresService.vehicleExists(vehicleId);
    if (!vehicleExists) {
      return res.status(404).json({ error: 'Vehículo no encontrado' });
    }

    const alerts = await sensoresService.getActiveAlerts(vehicleId);
    
    res.json({
      ok: true,
      data: alerts
    });
  } catch (error) {
    console.error('Error obteniendo alertas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener todos los vehículos con su última posición
exports.getAllVehicles = async (req, res) => {
  try {
    const vehicles = await sql`
      SELECT 
        v.id,
        v.nombre,
        v.dispositivo_id,
        v.usuario_id,
        s.latitud,
        s.longitud,
        s.estado,
        s.timestamp as ultima_actualizacion,
        s.combustible,
        s.temperatura,
        s.velocidad
      FROM vehiculos v
      LEFT JOIN LATERAL (
        SELECT * FROM sensores 
        WHERE vehiculo_id = v.id 
        ORDER BY timestamp DESC 
        LIMIT 1
      ) s ON true
      ORDER BY v.nombre
    `;
    
    res.json({
      ok: true,
      data: vehicles
    });
  } catch (error) {
    console.error('Error obteniendo vehículos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener vehículos con alertas activas
exports.getVehiclesWithAlerts = async (req, res) => {
  try {
    const vehiclesWithAlerts = await sql`
      SELECT 
        v.id,
        v.nombre,
        v.dispositivo_id,
        v.usuario_id,
        s.latitud,
        s.longitud,
        s.estado,
        s.timestamp as ultima_actualizacion,
        s.combustible,
        s.temperatura,
        s.velocidad,
        CASE 
          WHEN s.estado LIKE '%alerta de combustible%' THEN 'combustible'
          WHEN s.estado LIKE '%alerta de temperatura%' THEN 'temperatura'
          WHEN s.estado LIKE '%alerta de exceso de velocidad%' THEN 'velocidad'
          ELSE 'normal'
        END as tipo_alerta
      FROM vehiculos v
      LEFT JOIN LATERAL (
        SELECT * FROM sensores 
        WHERE vehiculo_id = v.id 
        ORDER BY timestamp DESC 
        LIMIT 1
      ) s ON true
      WHERE s.estado != 'normal' 
        AND s.estado IS NOT NULL
        AND s.timestamp >= NOW() - INTERVAL '1 hour'
      ORDER BY s.timestamp DESC
    `;
    
    res.json({
      ok: true,
      data: vehiclesWithAlerts
    });
  } catch (error) {
    console.error('Error obteniendo vehículos con alertas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener resumen de alertas por tipo
exports.getAlertsSummary = async (req, res) => {
  try {
    const alertsSummary = await sql`
      SELECT 
        COUNT(*) as total_alertas,
        COUNT(CASE WHEN estado LIKE '%alerta de combustible%' THEN 1 END) as alertas_combustible,
        COUNT(CASE WHEN estado LIKE '%alerta de temperatura%' THEN 1 END) as alertas_temperatura,
        COUNT(CASE WHEN estado LIKE '%alerta de exceso de velocidad%' THEN 1 END) as alertas_velocidad
      FROM sensores s
      JOIN vehiculos v ON s.vehiculo_id = v.id
      WHERE s.estado != 'normal' 
        AND s.timestamp >= NOW() - INTERVAL '1 hour'
    `;
    
    res.json({
      ok: true,
      data: alertsSummary[0]
    });
  } catch (error) {
    console.error('Error obteniendo resumen de alertas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener historial de alertas de un vehículo
exports.getVehicleAlertHistory = async (req, res) => {
  const { vehicleId } = req.params;
  const { limit = 50 } = req.query;

  try {
    const alertHistory = await sql`
      SELECT 
        s.*,
        v.nombre as vehiculo_nombre,
        v.dispositivo_id,
        CASE 
          WHEN s.estado LIKE '%alerta de combustible%' THEN 'combustible'
          WHEN s.estado LIKE '%alerta de temperatura%' THEN 'temperatura'
          WHEN s.estado LIKE '%alerta de exceso de velocidad%' THEN 'velocidad'
          ELSE 'normal'
        END as tipo_alerta
      FROM sensores s
      JOIN vehiculos v ON s.vehiculo_id = v.id
      WHERE v.dispositivo_id = ${vehicleId}
        AND s.estado != 'normal'
      ORDER BY s.timestamp DESC
      LIMIT ${limit}
    `;
    
    res.json({
      ok: true,
      data: alertHistory
    });
  } catch (error) {
    console.error('Error obteniendo historial de alertas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};