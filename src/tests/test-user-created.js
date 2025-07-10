
const bcrypt = require('bcrypt');
const sql = require('../db.js');


async function crearUsuario() {
  const passwordPlano = '12345';
  const hash = await bcrypt.hash(passwordPlano, 10);

  await sql`
    INSERT INTO usuarios (nombre, correo, password, rol)
    VALUES ('admin', 'admin@demo.com', ${hash}, 'admin')
  `;

  console.log('✅ Usuario creado con contraseña hasheada');
}

crearUsuario().catch(console.error);