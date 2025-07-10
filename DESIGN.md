# Diseño del Sistema de Monitoreo IoT API

## 🎯 Objetivo del Proyecto

Desarrollo de una API REST con soporte para WebSocket para el monitoreo de dispositivos IoT, utilizando Node.js como plataforma principal.

## 🛠️ Stack Tecnológico

### Tecnologías Principales
- **Runtime**: Node.js
- **Framework**: Express.js
- **Base de Datos**: PostgreSQL (Supabase)
- **WebSocket**: ws
- **Variables de Entorno**: dotenv

### Justificación de la Elección
Se eligió Node.js por su facilidad para crear servicios REST con WebSocket y por la experiencia previa con este stack tecnológico.

## 📦 Instalación y Configuración

### 1. Inicialización del Proyecto
```bash
npm init -y
```

### 2. Dependencias Principales
```bash
npm install express pg ws dotenv
```

### 3. Dependencias de Desarrollo
```bash
npm install --save-dev nodemon
```

### 4. Documentación API
```bash
npm install swagger-ui-express swagger-jsdoc
```

#### Documentación con Swagger
- **swagger-ui-express**: Interfaz web para visualizar la documentación de la API
- **swagger-jsdoc**: Genera especificaciones OpenAPI a partir de comentarios JSDoc en el código

## 📁 Estructura del Proyecto

### Organización de Carpetas
```
src/
├── controllers/     # Controladores de la API
├── models/         # Modelos de datos
├── routes/         # Definición de rutas
├── services/       # Lógica de negocio
├── middlewares/    # Middlewares personalizados
├── utils/          # Utilidades y helpers
└── index.js        # Punto de entrada de la aplicación
```

### Comandos para Crear la Estructura
```bash
mkdir src
mkdir src/routes src/controllers src/models src/services src/utils src/middlewares
touch src/index.js
```

## 🗄️ Base de Datos

### Configuración de Supabase
- **Tipo**: PostgreSQL
- **Proveedor**: Supabase
- **Cliente**: postgres

### Instalación del Cliente
```bash
npm install postgres
```

### Conexión
Seguir las instrucciones oficiales de conexión de Supabase para configurar la conexión a la base de datos.

## 🔧 Configuración de Desarrollo

### Scripts Recomendados (package.json)
```json
{
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  }
}
```

## 🚀 Próximos Pasos

1. Configurar variables de entorno con dotenv
2. Implementar conexión a Supabase
3. Crear modelos de datos
4. Desarrollar controladores y rutas
5. Implementar WebSocket para tiempo real
6. Agregar middlewares de autenticación
7. Configurar validaciones de datos
8. Configurar documentación API con Swagger

## 📋 Checklist de Implementación

- [X] Configuración inicial del proyecto
- [X] Estructura de carpetas creada
- [X] Dependencias instaladas
- [X] Conexión a Supabase configurada
- [X] Variables de entorno configuradas
- [X] Servidor Express básico funcionando
- [X] Rutas API implementadas
- [X] WebSocket implementado
- [ ] Autenticación configurada
- [X] Documentación API configurada
- [ ] Tests implementados

---

*Documento de diseño actualizado para el proyecto de Monitoreo IoT API*
