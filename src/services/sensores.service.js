const sql = require('../db.js');

class SensoresService {
  
  // Obtener datos de sensores por vehículo
  async getSensorDataByVehicle(vehicleId, limit = 100) {
    try {
      const result = await sql`
        SELECT s.*, v.dispositivo_id, v.nombre as vehiculo_nombre
        FROM sensores s
        JOIN vehiculos v ON s.vehiculo_id = v.id
        WHERE v.dispositivo_id = ${vehicleId}
        ORDER BY s.timestamp DESC
        LIMIT ${limit}
      `;
      
      return result;
    } catch (error) {
      console.error('Error obteniendo datos de sensores:', error);
      throw error;
    }
  }

  // Obtener datos de sensores en tiempo real (últimos 5 minutos)
  async getRealTimeSensorData(vehicleId) {
    try {
      const result = await sql`
        SELECT s.*, v.dispositivo_id, v.nombre as vehiculo_nombre
        FROM sensores s
        JOIN vehiculos v ON s.vehiculo_id = v.id
        WHERE v.dispositivo_id = ${vehicleId}
        AND s.timestamp >= NOW() - INTERVAL '5 minutes'
        ORDER BY s.timestamp DESC
      `;
      
      return result;
    } catch (error) {
      console.error('Error obteniendo datos en tiempo real:', error);
      throw error;
    }
  }

  // Obtener alertas activas por vehículo
  async getActiveAlerts(vehicleId) {
    try {
      const result = await sql`
        SELECT s.*, v.dispositivo_id, v.nombre as vehiculo_nombre
        FROM sensores s
        JOIN vehiculos v ON s.vehiculo_id = v.id
        WHERE v.dispositivo_id = ${vehicleId}
        AND s.estado != 'normal'
        ORDER BY s.timestamp DESC
      `;
      
      return result;
    } catch (error) {
      console.error('Error obteniendo alertas:', error);
      throw error;
    }
  }

  // Obtener estadísticas de vehículo
  async getVehicleStats(vehicleId) {
    try {
      const result = await sql`
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
      
      return result[0];
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  }

  // Verificar si un vehículo existe
  async vehicleExists(vehicleId) {
    try {
      const result = await sql`
        SELECT id FROM vehiculos WHERE dispositivo_id = ${vehicleId}
      `;
      
      return result.length > 0;
    } catch (error) {
      console.error('Error verificando vehículo:', error);
      return false;
    }
  }
}

module.exports = new SensoresService();