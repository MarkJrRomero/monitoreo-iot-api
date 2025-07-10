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
    if (query.includes("SELECT id FROM vehiculos")) {
      return Promise.resolve([{ id: 1 }]);
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
