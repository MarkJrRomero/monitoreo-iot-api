# 🚀 Guía de Configuración Local - Monitoreo IoT API

## 📋 Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** (versión 16 o superior)
- **npm** (viene con Node.js)
- **Git** (para clonar el repositorio)
- **Postman** o similar (para probar la API)

## Instalación

### 1. Clonar el repositorio
```bash
git clone https://github.com/MarkJrRomero/monitoreo-iot-api.git
cd monitoreo-iot-api
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crea un archivo `.env` en la raíz del proyecto:

```env
# Base de datos Supabase
DATABASE_URL=postgresql://tu-usuario:tu-password@tu-host:5432/tu-database

# JWT Secret (genera una clave segura)
JWT_SECRET=tu-clave-secreta-muy-segura

# Puerto del servidor (opcional)
PORT=3000
```

### 4. Configurar la base de datos
Ejecuta el script SQL en tu base de datos Supabase:

```sql
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
```

### 5. Crear usuarios del sistema
Ejecuta el script de creación de usuarios:

```bash
npm test src/tests/crear-users.test.js
```

## 👥 Usuarios del Sistema

### 🔐 Usuario Administrador
- **Nombre:** admin
- **Correo:** admin@demo.com
- **Contraseña:** 12345
- **Rol:** admin
- **Permisos:** Acceso completo a todas las funcionalidades

### 👤 Usuarios Estándar

#### 1. Juan Pérez
- **Correo:** juan.perez@empresa.com
- **Contraseña:** 12345
- **Rol:** estandar
- **Permisos:** Acceso básico a datos de sensores

#### 2. María García
- **Correo:** maria.garcia@empresa.com
- **Contraseña:** 12345
- **Rol:** estandar
- **Permisos:** Acceso básico a datos de sensores

#### 3. Carlos López
- **Correo:** carlos.lopez@empresa.com
- **Contraseña:** 12345
- **Rol:** estandar
- **Permisos:** Acceso básico a datos de sensores

## 🚀 Ejecutar el proyecto

### Desarrollo (con auto-reload)
```bash
npm run dev
```

### Producción
```bash
npm start
```

### Ejecutar tests
```bash
npm test
```

## ✅ Verificar que todo funciona

### 1. Verificar el servidor
- El servidor debe estar corriendo en `http://localhost:3000`
- Deberías ver en consola:
  ```
  🚀 Servidor escuchando en puerto 3000
  📊 Documentación disponible en http://localhost:3000/api-docs
  🔌 WebSocket disponible en ws://localhost:3000
  🧪 Cliente de prueba WebSocket en http://localhost:3000/websocket-test
  ```

### 2. Verificar la documentación
- Abre `http://localhost:3000/api-docs` en tu navegador
- Deberías ver la documentación Swagger de la API

### 3. Verificar WebSocket
- Abre `http://localhost:3000/websocket-test` en tu navegador