const { createToken } = require('../utils/jwt');
const sql = require('../db.js');
const bcrypt = require('bcrypt');
const websocketService = require('../services/websocket.service');

exports.login = async (req, res) => {

  console.log('🔍 Datos recibidos:', req.body);
  
  const { correo, password } = req.body;

  if (!correo || !password) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }
  
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
      86400000
    );

    res.json({ usuario: {nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol}, token });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.ingestData = async (req, res) => {
  const { vehiculo_id, gps, combustible, temperatura, velocidad, latitud, longitud } = req.body;

  console.log('🚀 Iniciando ingesta de datos:', { vehiculo_id, gps, combustible, temperatura, velocidad, latitud, longitud });

  if (!vehiculo_id || !gps || combustible === null || temperatura === null || velocidad === null || latitud === null || longitud === null) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  try {
    const vehiculo = await sql`
      SELECT * FROM vehiculos WHERE dispositivo_id = ${vehiculo_id}
    `;

    console.log('🔍 Vehículo encontrado:', vehiculo);

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

    console.log('📊 Estado calculado:', estado);

    const sensorData = {
      vehiculo_id: vehiculo[0].id,
      nombre: vehiculo[0].nombre,
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

    console.log(' Guardando datos en BD:', sensorData);

    // Insertar en la base de datos
    await sql`
      INSERT INTO sensores (vehiculo_id, gps, combustible, temperatura, velocidad, latitud, longitud, estado)
      VALUES (${sensorData.vehiculo_id}, ${gps}, ${combustible}, ${temperatura}, ${velocidad}, ${latitud}, ${longitud}, ${estado})
    `;

    console.log('✅ Datos guardados en BD exitosamente');

    // Verificar estadísticas del WebSocket antes de enviar
    const stats = websocketService.getStats();
    console.log('📡 Estadísticas WebSocket antes de enviar:', stats);

    // Enviar datos en tiempo real por WebSocket
    try {
      console.log('🔌 Intentando enviar datos por WebSocket para vehículo:', vehiculo_id);
      await websocketService.broadcastSensorData(vehiculo_id, sensorData);
      console.log(`✅ Datos enviados por WebSocket para vehículo ${vehiculo_id}`);
    } catch (wsError) {
      console.error('❌ Error enviando datos por WebSocket:', wsError);
    }

    // Si hay alertas, enviarlas también por WebSocket
    if (estado !== 'normal') {
      try {
        console.log('🚨 Enviando alerta por WebSocket para vehículo:', vehiculo_id);
        await websocketService.broadcastAlert(vehiculo_id, {
          tipo: estado,
          datos: sensorData,
          timestamp: new Date().toISOString()
        });
        console.log(`✅ Alerta enviada por WebSocket para vehículo ${vehiculo_id}`);
      } catch (alertError) {
        console.error('❌ Error enviando alerta por WebSocket:', alertError);
      }
    }

    // Verificar estadísticas después de enviar
    const statsAfter = websocketService.getStats();
    console.log('📡 Estadísticas WebSocket después de enviar:', statsAfter);

    res.json({ 
      ok: true, 
      data: { 
        vehiculo_id, 
        nombre: vehiculo[0].nombre,
        gps, 
        combustible, 
        temperatura, 
        velocidad, 
        latitud, 
        longitud, 
        estado 
      },
      websocket_sent: true,
      websocket_stats: statsAfter
    });
  } catch (err) {
    console.error('❌ Error en ingesta:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Endpoint para obtener datos de sensores
exports.getSensorData = async (req, res) => {
  const { vehicleId } = req.params;
  const { limit = 100 } = req.query;

  try {
    // Verificar si el vehículo existe
    const vehiculo = await sql`
      SELECT id FROM vehiculos WHERE dispositivo_id = ${vehicleId}
    `;
    
    if (!vehiculo.length) {
      return res.status(404).json({ error: 'Vehículo no encontrado' });
    }

    // Obtener datos de sensores
    const sensorData = await sql`
      SELECT s.*, v.dispositivo_id, v.nombre as vehiculo_nombre
      FROM sensores s
      JOIN vehiculos v ON s.vehiculo_id = v.id
      WHERE v.dispositivo_id = ${vehicleId}
      ORDER BY s.timestamp DESC
      LIMIT ${limit}
    `;
    
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
    // Verificar si el vehículo existe
    const vehiculo = await sql`
      SELECT id FROM vehiculos WHERE dispositivo_id = ${vehicleId}
    `;
    
    if (!vehiculo.length) {
      return res.status(404).json({ error: 'Vehículo no encontrado' });
    }

    // Obtener estadísticas
    const stats = await sql`
      SELECT 
        COUNT(*) as total_lecturas,
        AVG(combustible) as promedio_combustible,
        AVG(temperatura) as promedio_temperatura,
        AVG(velocidad) as promedio_velocidad,
        MAX(temperatura) as max_temperatura,
        MIN(combustible) as min_combustible,
        MAX(velocidad) as max_velocidad
      FROM sensores s
      JOIN vehiculos v ON s.vehiculo_id = v.id
      WHERE v.dispositivo_id = ${vehicleId}
      AND s.timestamp >= NOW() - INTERVAL '24 hours'
    `;
    
    res.json({
      ok: true,
      data: stats[0]
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
    // Verificar si el vehículo existe
    const vehiculo = await sql`
      SELECT id FROM vehiculos WHERE dispositivo_id = ${vehicleId}
    `;
    
    if (!vehiculo.length) {
      return res.status(404).json({ error: 'Vehículo no encontrado' });
    }

    // Obtener alertas activas
    const alerts = await sql`
      SELECT s.*, v.dispositivo_id, v.nombre as vehiculo_nombre
      FROM sensores s
      JOIN vehiculos v ON s.vehiculo_id = v.id
      WHERE v.dispositivo_id = ${vehicleId}
      AND s.estado != 'normal'
      AND s.timestamp >= NOW() - INTERVAL '1 hour'
      ORDER BY s.timestamp DESC
    `;
    
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

// Endpoint para verificar estado del WebSocket
exports.getWebSocketStats = async (req, res) => {
  try {
    const stats = websocketService.getStats();
    res.json({
      ok: true,
      data: stats
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas WebSocket:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};