const { createToken } = require('../utils/jwt');
const sql = require('../db.js');
const websocketService = require('./websocket.service');

class SimulatorService {
  constructor() {
    this.isRunning = false;
    this.interval = null;
    
    // Cada vehículo con ubicación base diferente
    this.vehicles = [
      { 
        id: "VH1ZU432E", 
        baseLat: 4.68354356704774,
        baseLng: -74.12042084673625
      },
      { 
        id: "VEH2SDF33", 
        baseLat: 4.828713450549544,
        baseLng: -74.04927894044259
      },
      { 
        id: "VEH334345SDF", 
        baseLat: 6.263130238372258,
        baseLng: -75.57929489793553
      }
    ];
    
    // Crear token para las peticiones
    this.token = createToken(
      { id: 1, rol: "test-simulador", correo: "simulador@demo.com" },
      process.env.JWT_SECRET,
      86400000
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
    };
  }

  // Simular movimiento del vehículo con patrones únicos por vehículo
  simularMovimiento(vehicleId, tiempo) {
    // Encontrar el vehículo y sus coordenadas base
    const vehicle = this.vehicles.find(v => v.id === vehicleId);
    if (!vehicle) {
      return { latitud: 6.25184, longitud: -75.56359 };
    }

    const { baseLat, baseLng } = vehicle;
    
    // Diferentes patrones de movimiento según el vehículo
    switch(vehicleId) {
      case "VEH334345SDF": // Camión 1 - Movimiento circular amplio
        const radio1 = 0.008;
        const velocidad1 = 0.003;
        const angulo1 = (tiempo / 1000) * velocidad1;
        return {
          latitud: baseLat + Math.sin(angulo1) * radio1,
          longitud: baseLng + Math.cos(angulo1) * radio1
        };
        
      case "VEH2SDF33": // Camión 2 - Movimiento en figura 8
        const radio2 = 0.006;
        const velocidad2 = 0.004;
        const angulo2 = (tiempo / 1000) * velocidad2;
        return {
          latitud: baseLat + Math.sin(angulo2) * radio2 + Math.sin(angulo2 * 2) * radio2 * 0.5,
          longitud: baseLng + Math.cos(angulo2) * radio2 + Math.cos(angulo2 * 2) * radio2 * 0.5
        };
        
      case "VEH3ABC456": // Camión 3 - Movimiento en zigzag amplio
        const radio3 = 0.007;
        const velocidad3 = 0.005;
        const angulo3 = (tiempo / 1000) * velocidad3;
        return {
          latitud: baseLat + Math.sin(angulo3 * 3) * radio3,
          longitud: baseLng + Math.cos(angulo3 * 2) * radio3
        };
        
      default: // Movimiento estándar para otros vehículos
        const radio = 0.005;
        const velocidad = 0.002;
        const angulo = (tiempo / 1000) * velocidad;
        return {
          latitud: baseLat + Math.sin(angulo) * radio,
          longitud: baseLng + Math.cos(angulo) * radio
        };
    }
  }

  // Enviar datos de un vehículo con ubicación única
  async enviarDatosVehiculo(vehicleId, tiempo) {
    try {
      const datosBase = this.generarDatosSensor(vehicleId);
      const posicion = this.simularMovimiento(vehicleId, tiempo);
      
      const datosSensor = {
        ...datosBase,
        latitud: posicion.latitud,
        longitud: posicion.longitud,
        timestamp: new Date().toISOString()
      };

      // Hacer petición HTTP al endpoint de ingesta
      const response = await fetch(`${process.env.BASE_URL_API}/api/ingesta`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify(datosSensor)
      });

      const result = await response.json();
      
      if (response.ok) {
        const vehicle = this.vehicles.find(v => v.id === vehicleId);
        console.log(`✅ ${vehicle?.nombre || vehicleId}: Combustible=${datosSensor.combustible}%, Temp=${datosSensor.temperatura}°C, Vel=${datosSensor.velocidad}km/h`);
        console.log(`📍 Posición: ${datosSensor.latitud.toFixed(6)}, ${datosSensor.longitud.toFixed(6)}`);
        
        if (result.data.estado !== 'normal') {
          console.log(`🚨 Alerta detectada para ${vehicle?.nombre || vehicleId}: ${result.data.estado}`);
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
    console.log(` Vehículos con ubicaciones únicas:`);
    this.vehicles.forEach(v => {
      console.log(`   🚛 ${v.nombre} (${v.id}): ${v.baseLat}, ${v.baseLng}`);
    });
    console.log(`🔌 WebSocket activo: ${websocketService.getStats().totalConnections} conexiones`);
    
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
      
      console.log(` Resultados: ✅ ${exitosos} exitosos, ❌ ${errores} errores`);
      
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
      vehicles: this.vehicles.map(v => ({
        id: v.id,
        nombre: v.nombre,
        ubicacion: `${v.baseLat}, ${v.baseLng}`
      })),
      totalVehicles: this.vehicles.length
    };
  }

  // Agregar vehículo a la simulación
  agregarVehiculo(vehicleId, nombre, baseLat = 6.25184, baseLng = -75.56359) {
    this.vehicles.push({ 
      id: vehicleId, 
      nombre, 
      baseLat, 
      baseLng 
    });
    console.log(` Vehículo agregado: ${nombre} (${vehicleId}) en ${baseLat}, ${baseLng}`);
  }

  // Remover vehículo de la simulación
  removerVehiculo(vehicleId) {
    const index = this.vehicles.findIndex(v => v.id === vehicleId);
    if (index !== -1) {
      const removed = this.vehicles.splice(index, 1)[0];
      console.log(` Vehículo removido: ${removed.nombre} (${removed.id})`);
      return true;
    }
    return false;
  }
}

module.exports = new SimulatorService(); 