-- TABLA DE USUARIOS
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  correo TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'usuario',
  creado_en TIMESTAMP DEFAULT NOW()
);

-- TABLA DE VEHICULOS
CREATE TABLE vehiculos (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  dispositivo_id TEXT UNIQUE NOT NULL,
  usuario_id INTEGER REFERENCES usuarios(id),
  creado_en TIMESTAMP DEFAULT NOW()
);

-- TABLA DE SENSORES
CREATE TABLE sensores (
  id SERIAL PRIMARY KEY,
  vehiculo_id INTEGER REFERENCES vehiculos(id),
  gps TEXT,
  combustible NUMERIC,
  temperatura NUMERIC,
  latitud NUMERIC,
  longitud NUMERIC,
  estado TEXT,
  velocidad NUMERIC,
  timestamp TIMESTAMP DEFAULT NOW()
);
