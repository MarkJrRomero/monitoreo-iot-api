const { createToken } = require('../utils/jwt');
const sql = require('../db.js');
const websocketService = require('./websocket.service');

class SimulatorService {
  constructor() {
    this.isRunning = false;
    this.interval = null;
    this.vehicles = [
      { id: "VEH334345SDF", nombre: "Camión 1" },
      { id: "VEH2SDF33", nombre: "Camión 2" },
      { id: "VEH3ABC456", nombre: "Camión 3" }
    ];
    
    // Crear token para las peticiones
    this.token = createToken(
      { id: 1, rol: "admin", correo: "admin@demo.com" },
      process.env.JWT_SECRET,
      3600000
    );
  }

  // Generar datos aleatorios realistas
  generarDatosSensor(vehicleId) {
    return {
      vehiculo_id: vehicleId,
      gps: "GPS" + Math.floor(Math.random() * 1000),
      combustible: Math.floor(Math.random() * 100) + 1, // 1-100%
      temperatura: Math.floor(Math.random() * 120) + 20, // 20-140°C
      velocidad: Math.floor(Math.random() * 120) + 10, // 10-130 km/h
      latitud: 6.25184 + (Math.random() - 0.5) * 0.01,
      longitud: -75.56359 + (Math.random() - 0.5) * 0.01,
    };
  }

  // Simular movimiento del vehículo
  simularMovimiento(baseLat, baseLng, tiempo) {
    const velocidad = 0.0001;
    const angulo = (tiempo / 1000) * 0.1;
    
    return {
      latitud: baseLat + Math.sin(angulo) * velocidad,
      longitud: baseLng + Math.cos(angulo) * velocidad
    };
  }

  // Enviar datos de un vehículo
  async enviarDatosVehiculo(vehicleId, tiempo) {
    try {
      const datosBase = this.generarDatosSensor(vehicleId);
      const posicion = this.simularMovimiento(6.25184, -75.56359, tiempo);
      
      const datosSensor = {
        ...datosBase,
        latitud: posicion.latitud,
        longitud: posicion.longitud,
        timestamp: new Date().toISOString()
      };

      // Hacer petición HTTP al endpoint de ingesta
      const response = await fetch(`http://localhost:${process.env.PORT || 3000}/api/ingesta`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify(datosSensor)
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log(`✅ Datos enviados para ${vehicleId}: Combustible=${datosSensor.combustible}%, Temp=${datosSensor.temperatura}°C, Vel=${datosSensor.velocidad}km/h`);
        
        if (result.data.estado !== 'normal') {
          console.log(`🚨 Alerta detectada para ${vehicleId}: ${result.data.estado}`);
        }
        
        return { success: true, data: result };
      } else {
        console.error(`❌ Error enviando datos para ${vehicleId}:`, result);
        return { success: false, error: result };
      }
    } catch (error) {
      console.error(`❌ Excepción enviando datos para ${vehicleId}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  // Iniciar simulación automática
  iniciarSimulacion(intervaloMs = 5000) {
    if (this.isRunning) {
      console.log('⚠️  Simulación ya está corriendo');
      return;
    }

    console.log(`🚀 Iniciando simulación automática...`);
    console.log(`📊 Enviando datos cada ${intervaloMs/1000} segundos`);
    console.log(`�� Vehículos: ${this.vehicles.map(v => v.id).join(', ')}`);
    
    this.isRunning = true;
    const inicio = Date.now();
    let contadorCiclos = 0;
    
    this.interval = setInterval(async () => {
      contadorCiclos++;
      const tiempoActual = Date.now() - inicio;
      const minutosTranscurridos = Math.floor(tiempoActual / 60000);
      const segundosTranscurridos = Math.floor((tiempoActual % 60000) / 1000);
      
      console.log(`\n⏱️  Ciclo ${contadorCiclos} - ${minutosTranscurridos}:${segundosTranscurridos.toString().padStart(2, '0')}`);
      
      // Enviar datos para todos los vehículos
      const promesas = this.vehicles.map(vehicle => 
        this.enviarDatosVehiculo(vehicle.id, tiempoActual)
      );
      
      const resultados = await Promise.all(promesas);
      const exitosos = resultados.filter(r => r.success).length;
      const errores = resultados.filter(r => !r.success).length;
      
      console.log(`�� Resultados: ✅ ${exitosos} exitosos, ❌ ${errores} errores`);
      
      // Mostrar estadísticas del WebSocket cada 10 ciclos
      if (contadorCiclos % 10 === 0) {
        const wsStats = websocketService.getStats();
        console.log(`🔌 WebSocket: ${wsStats.totalConnections} conexiones activas`);
      }
      
    }, intervaloMs);
    
    console.log('✅ Simulación iniciada correctamente');
  }

  // Detener simulación
  detenerSimulacion() {
    if (!this.isRunning) {
      console.log('⚠️  Simulación no está corriendo');
      return;
    }

    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    
    this.isRunning = false;
    console.log('🛑 Simulación detenida');
  }

  // Obtener estado de la simulación
  getEstado() {
    return {
      isRunning: this.isRunning,
      vehicles: this.vehicles,
      totalVehicles: this.vehicles.length
    };
  }

  // Agregar vehículo a la simulación
  agregarVehiculo(vehicleId, nombre) {
    this.vehicles.push({ id: vehicleId, nombre });
    console.log(`�� Vehículo agregado: ${vehicleId} - ${nombre}`);
  }

  // Remover vehículo de la simulación
  removerVehiculo(vehicleId) {
    const index = this.vehicles.findIndex(v => v.id === vehicleId);
    if (index !== -1) {
      const removed = this.vehicles.splice(index, 1)[0];
      console.log(`�� Vehículo removido: ${removed.id} - ${removed.nombre}`);
      return true;
    }
    return false;
  }
}

module.exports = new SimulatorService(); 