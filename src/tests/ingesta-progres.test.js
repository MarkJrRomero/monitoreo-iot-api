const request = require("supertest");
const express = require("express");
const { createToken } = require("../utils/jwt");
require('dotenv').config();

// Mock simple y efectivo de la base de datos
jest.mock("../db.js", () => {
  return jest.fn((strings, ...values) => {
    // Simular la consulta SQL basada en el contenido
    const query = strings.reduce((result, str, i) => {
      return result + str + (values[i] || '');
    }, '');
    
    // Mock para consulta de vehículo
    if (query.includes("SELECT * FROM vehiculos")) {
      return Promise.resolve([{ id: 1, nombre: "Vehículo de Prueba" }]);
    }
    
    // Mock para inserción de sensores
    if (query.includes("INSERT INTO sensores")) {
      return Promise.resolve([{ id: 1 }]);
    }
    
    return Promise.resolve([]);
  });
});

const apiRoutes = require("../routes/api.routes");

// Crear token de prueba
const token = createToken(
  { id: 1, rol: "admin", correo: "admin@demo.com" },
  process.env.JWT_SECRET,
  3600000
);

const app = express();
app.use(express.json());
app.use("/api", apiRoutes);

// Función para generar datos aleatorios realistas
function generarDatosSensor() {
  return {
    vehiculo_id: "VH1ZU432E",
    gps: "GPS" + Math.floor(Math.random() * 1000),
    combustible: Math.floor(Math.random() * 100) + 1, // 1-100%
    temperatura: Math.floor(Math.random() * 120) + 20, // 20-140°C
    velocidad: Math.floor(Math.random() * 120) + 10, // 10-130 km/h
    latitud: 6.25184 + (Math.random() - 0.5) * 0.01, // Variación en latitud
    longitud: -75.56359 + (Math.random() - 0.5) * 0.01, // Variación en longitud
  };
}

// Función para simular movimiento del vehículo
function simularMovimiento(baseLat, baseLng, tiempo) {
  const velocidad = 0.0001; // Velocidad de movimiento
  const angulo = (tiempo / 1000) * 0.1; // Cambio de dirección
  
  return {
    latitud: baseLat + Math.sin(angulo) * velocidad,
    longitud: baseLng + Math.cos(angulo) * velocidad
  };
}

describe("POST /api/ingesta", () => {
  beforeEach(() => {
    // Limpiar todos los mocks antes de cada test
    jest.clearAllMocks();
  });

  it("debería insertar correctamente los datos del sensor", async () => {
    const res = await request(app)
      .post("/api/ingesta")
      .set("Authorization", `Bearer ${token}`)
      .set("Content-Type", "application/json")
      .send({
        vehiculo_id: "VH1ZU432E",
        gps: "ABC123",
        combustible: 5,
        temperatura: 95,
        velocidad: 100,
        latitud: 6.25184,
        longitud: -75.56359,
      });

    console.log('Response:', res.body);
    console.log('Status:', res.status);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("ok", true);
    expect(res.body).toHaveProperty("data");
    expect(res.body.data).toHaveProperty("estado");
  });

  it("debería retornar 400 si faltan datos obligatorios", async () => {
    const res = await request(app)
      .post("/api/ingesta")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error", "Faltan datos obligatorios");
  });

  it("debería retornar 401 si no se proporciona token", async () => {
    const res = await request(app)
      .post("/api/ingesta")
      .set("Content-Type", "application/json")
      .send({
        vehiculo_id: "VH1ZU432E",
        gps: "ABC123",
        combustible: 5,
        temperatura: 95,
        velocidad: 100,
        latitud: 6.25184,
        longitud: -75.56359,
      });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("error", "Sin token");
  });

  it("debería retornar 403 si el token es inválido", async () => {
    const res = await request(app)
      .post("/api/ingesta")
      .set("Authorization", "Bearer invalid-token")
      .set("Content-Type", "application/json")
      .send({
        vehiculo_id: "VH1ZU432E",
        gps: "ABC123",
        combustible: 5,
        temperatura: 95,
        velocidad: 100,
        latitud: 6.25184,
        longitud: -75.56359,
      });

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty("error", "Token inválido o expirado");
  });
});

describe("Simulación de ingesta progresiva en tiempo real", () => {
  it("debería simular datos de sensores durante 5 minutos", async () => {
    const duracionMinutos = 5;
    const intervaloMs = 2000; // Enviar datos cada 2 segundos
    const totalIteraciones = (duracionMinutos * 60 * 1000) / intervaloMs;
    
    console.log(`🚀 Iniciando simulación de ${duracionMinutos} minutos...`);
    console.log(`📊 Enviando datos cada ${intervaloMs/1000} segundos`);
    console.log(`🔄 Total de iteraciones: ${totalIteraciones}`);
    
    const baseLat = 6.25184;
    const baseLng = -75.56359;
    let contadorExitosos = 0;
    let contadorErrores = 0;
    let contadorAlertas = 0;
    
    const inicio = Date.now();
    
    for (let i = 0; i < totalIteraciones; i++) {
      const tiempoActual = Date.now() - inicio;
      const minutosTranscurridos = Math.floor(tiempoActual / 60000);
      const segundosTranscurridos = Math.floor((tiempoActual % 60000) / 1000);
      
      // Generar datos base
      const datosBase = generarDatosSensor();
      
      // Simular movimiento del vehículo
      const posicion = simularMovimiento(baseLat, baseLng, tiempoActual);
      
      // Crear datos finales
      const datosSensor = {
        ...datosBase,
        latitud: posicion.latitud,
        longitud: posicion.longitud,
        timestamp: new Date().toISOString()
      };
      
      try {
        const res = await request(app)
          .post("/api/ingesta")
          .set("Authorization", `Bearer ${token}`)
          .set("Content-Type", "application/json")
          .send(datosSensor);
        
        if (res.statusCode === 200) {
          contadorExitosos++;
          
          // Verificar si hay alertas
          if (res.body.data.estado !== 'normal') {
            contadorAlertas++;
            console.log(`🚨 Alerta detectada: ${res.body.data.estado}`);
          }
          
          // Mostrar progreso cada 10 iteraciones
          if (i % 10 === 0) {
            console.log(`⏱️  ${minutosTranscurridos}:${segundosTranscurridos.toString().padStart(2, '0')} - Iteración ${i + 1}/${totalIteraciones}`);
            console.log(` Datos: Combustible=${datosSensor.combustible}%, Temp=${datosSensor.temperatura}°C, Vel=${datosSensor.velocidad}km/h`);
            console.log(`📍 Posición: ${datosSensor.latitud.toFixed(6)}, ${datosSensor.longitud.toFixed(6)}`);
            console.log(`✅ Exitosos: ${contadorExitosos}, ❌ Errores: ${contadorErrores}, 🚨 Alertas: ${contadorAlertas}`);
            console.log('---');
          }
        } else {
          contadorErrores++;
          console.error(`❌ Error en iteración ${i + 1}:`, res.body);
        }
      } catch (error) {
        contadorErrores++;
        console.error(`❌ Excepción en iteración ${i + 1}:`, error.message);
      }
      
      // Esperar antes de la siguiente iteración
      await new Promise(resolve => setTimeout(resolve, intervaloMs));
    }
    
    const tiempoTotal = Date.now() - inicio;
    const minutosTotales = Math.floor(tiempoTotal / 60000);
    const segundosTotales = Math.floor((tiempoTotal % 60000) / 1000);
    
    console.log('\n Simulación completada!');
    console.log(`⏱️  Tiempo total: ${minutosTotales}:${segundosTotales.toString().padStart(2, '0')}`);
    console.log(` Estadísticas finales:`);
    console.log(`   ✅ Envíos exitosos: ${contadorExitosos}`);
    console.log(`   ❌ Errores: ${contadorErrores}`);
    console.log(`    Alertas generadas: ${contadorAlertas}`);
    console.log(`   📈 Tasa de éxito: ${((contadorExitosos / totalIteraciones) * 100).toFixed(2)}%`);
    
    // Verificaciones finales
    expect(contadorExitosos).toBeGreaterThan(0);
    expect(contadorExitosos + contadorErrores).toBe(totalIteraciones);
    expect(contadorExitosos).toBeGreaterThan(contadorErrores);
  }, 6 * 60 * 1000); // Timeout de 6 minutos para el test completo
  
  it("debería simular múltiples vehículos simultáneamente", async () => {
    const duracionMinutos = 2; // Test más corto para múltiples vehículos
    const intervaloMs = 3000; // Cada 3 segundos
    const totalIteraciones = (duracionMinutos * 60 * 1000) / intervaloMs;
    
    const vehiculos = [
      { id: "VH1ZU432E", nombre: "VEHICULO 1" },
      { id: "VEH2SDF33", nombre: "VEHICULO 2" },
      { id: "VEH334345SDF", nombre: "VEHICULO 3" }
    ];
    
    console.log(`🚛 Iniciando simulación con ${vehiculos.length} vehículos...`);
    console.log(`⏱️  Duración: ${duracionMinutos} minutos`);
    
    const estadisticas = {
      totalEnviados: 0,
      totalExitosos: 0,
      totalErrores: 0,
      alertasPorVehiculo: {}
    };
    
    vehiculos.forEach(v => estadisticas.alertasPorVehiculo[v.id] = 0);
    
    const inicio = Date.now();
    
    for (let i = 0; i < totalIteraciones; i++) {
      const tiempoActual = Date.now() - inicio;
      const minutosTranscurridos = Math.floor(tiempoActual / 60000);
      const segundosTranscurridos = Math.floor((tiempoActual % 60000) / 1000);
      
      // Enviar datos para cada vehículo
      const promesas = vehiculos.map(async (vehiculo) => {
        const datosSensor = {
          ...generarDatosSensor(),
          vehiculo_id: vehiculo.id,
          timestamp: new Date().toISOString()
        };
        
        try {
          const res = await request(app)
            .post("/api/ingesta")
            .set("Authorization", `Bearer ${token}`)
            .set("Content-Type", "application/json")
            .send(datosSensor);
          
          estadisticas.totalEnviados++;
          
          if (res.statusCode === 200) {
            estadisticas.totalExitosos++;
            
            if (res.body.data.estado !== 'normal') {
              estadisticas.alertasPorVehiculo[vehiculo.id]++;
            }
          } else {
            estadisticas.totalErrores++;
          }
        } catch (error) {
          estadisticas.totalEnviados++;
          estadisticas.totalErrores++;
        }
      });
      
      await Promise.all(promesas);
      
      // Mostrar progreso cada 5 iteraciones
      if (i % 5 === 0) {
        console.log(`⏱️  ${minutosTranscurridos}:${segundosTranscurridos.toString().padStart(2, '0')} - Iteración ${i + 1}/${totalIteraciones}`);
        console.log(`📊 Enviados: ${estadisticas.totalEnviados}, Exitosos: ${estadisticas.totalExitosos}, Errores: ${estadisticas.totalErrores}`);
        console.log(`🚨 Alertas por vehículo:`, estadisticas.alertasPorVehiculo);
        console.log('---');
      }
      
      await new Promise(resolve => setTimeout(resolve, intervaloMs));
    }
    
    console.log('\n🎉 Simulación multi-vehículo completada!');
    console.log(` Estadísticas finales:`);
    console.log(`    Total enviados: ${estadisticas.totalEnviados}`);
    console.log(`   ✅ Exitosos: ${estadisticas.totalExitosos}`);
    console.log(`   ❌ Errores: ${estadisticas.totalErrores}`);
    console.log(`   📈 Tasa de éxito: ${((estadisticas.totalExitosos / estadisticas.totalEnviados) * 100).toFixed(2)}%`);
    console.log(`   🚨 Alertas por vehículo:`, estadisticas.alertasPorVehiculo);
    
    expect(estadisticas.totalExitosos).toBeGreaterThan(0);
    expect(estadisticas.totalExitosos).toBeGreaterThan(estadisticas.totalErrores);
  }, 3 * 60 * 1000); // Timeout de 3 minutos
});
