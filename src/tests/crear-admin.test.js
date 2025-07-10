
const bcrypt = require('bcrypt');
const sql = require('../db.js');

describe('Creación de Usuario Administrador', () => {
  let userId;

  afterAll(async () => {
    // Limpiar el usuario creado después de las pruebas
    if (userId) {
      await sql`DELETE FROM usuarios WHERE id = ${userId}`;
    }
    await sql.end();
  });

  test('debe crear un usuario administrador con contraseña hasheada', async () => {
    const passwordPlano = '12345';
    const hash = await bcrypt.hash(passwordPlano, 10);

    const result = await sql`
      INSERT INTO usuarios (nombre, correo, password, rol)
      VALUES ('admin', 'admin@demo.com', ${hash}, 'admin')
      RETURNING id
    `;

    userId = result[0].id;

    // Verificar que el usuario se creó correctamente
    expect(result).toHaveLength(1);
    expect(result[0].id).toBeDefined();
    expect(typeof result[0].id).toBe('number');

    // Verificar que la contraseña está hasheada
    const usuarioCreado = await sql`
      SELECT password FROM usuarios WHERE id = ${userId}
    `;

    expect(usuarioCreado).toHaveLength(1);
    expect(usuarioCreado[0].password).not.toBe(passwordPlano);
    expect(usuarioCreado[0].password).toBe(hash);

    // Verificar que la contraseña se puede verificar
    const passwordValido = await bcrypt.compare(passwordPlano, hash);
    expect(passwordValido).toBe(true);

    console.log('✅ Usuario administrador creado con contraseña hasheada');
  });

  test('debe verificar que el usuario admin existe en la base de datos', async () => {
    const usuario = await sql`
      SELECT id, nombre, correo, rol FROM usuarios 
      WHERE correo = 'admin@demo.com' AND rol = 'admin'
    `;

    expect(usuario).toHaveLength(1);
    expect(usuario[0].nombre).toBe('admin');
    expect(usuario[0].correo).toBe('admin@demo.com');
    expect(usuario[0].rol).toBe('admin');
  });
});