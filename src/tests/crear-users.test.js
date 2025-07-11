
const bcrypt = require('bcrypt');
const sql = require('../db.js');

describe('Creación de Usuarios', () => {

  test('debe crear un usuario administrador con contraseña hasheada', async () => {
    const passwordPlano = '12345';
    const hash = await bcrypt.hash(passwordPlano, 10);

    const result = await sql`
      INSERT INTO usuarios (nombre, correo, password, rol)
      VALUES ('admin', 'admin@demo.com', ${hash}, 'admin')
      RETURNING id
    `;

    const userId = result[0].id;

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

  test('debe crear 3 usuarios estándar con contraseñas hasheadas', async () => {
    const usuarios = [
      { nombre: 'Juan Pérez', correo: 'juan.perez@empresa.com', rol: 'estandar' },
      { nombre: 'María García', correo: 'maria.garcia@empresa.com', rol: 'estandar' },
      { nombre: 'Carlos López', correo: 'carlos.lopez@empresa.com', rol: 'estandar' }
    ];

    const passwordPlano = '12345';
    const hash = await bcrypt.hash(passwordPlano, 10);

    for (const usuario of usuarios) {
      const result = await sql`
        INSERT INTO usuarios (nombre, correo, password, rol)
        VALUES (${usuario.nombre}, ${usuario.correo}, ${hash}, ${usuario.rol})
        RETURNING id
      `;

      const userId = result[0].id;

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

      console.log(`✅ Usuario ${usuario.nombre} creado con contraseña hasheada`);
    }
  });

  test('debe verificar que todos los usuarios existen en la base de datos', async () => {
    const usuarios = [
      { nombre: 'admin', correo: 'admin@demo.com', rol: 'admin' },
      { nombre: 'Juan Pérez', correo: 'juan.perez@empresa.com', rol: 'estandar' },
      { nombre: 'María García', correo: 'maria.garcia@empresa.com', rol: 'estandar' },
      { nombre: 'Carlos López', correo: 'carlos.lopez@empresa.com', rol: 'estandar' }
    ];

    for (const usuario of usuarios) {
      const usuarioEnBD = await sql`
        SELECT id, nombre, correo, rol FROM usuarios 
        WHERE correo = ${usuario.correo} AND rol = ${usuario.rol}
      `;

      expect(usuarioEnBD).toHaveLength(1);
      expect(usuarioEnBD[0].nombre).toBe(usuario.nombre);
      expect(usuarioEnBD[0].correo).toBe(usuario.correo);
      expect(usuarioEnBD[0].rol).toBe(usuario.rol);
    }

    console.log('✅ Todos los usuarios verificados en la base de datos');
  });

  test('debe verificar que se pueden hacer login con todos los usuarios', async () => {
    const usuarios = [
      { correo: 'admin@demo.com', password: '12345' },
      { correo: 'juan.perez@empresa.com', password: '12345' },
      { correo: 'maria.garcia@empresa.com', password: '12345' },
      { correo: 'carlos.lopez@empresa.com', password: '12345' }
    ];

    for (const usuario of usuarios) {
      const usuarioEnBD = await sql`
        SELECT password FROM usuarios WHERE correo = ${usuario.correo}
      `;

      expect(usuarioEnBD).toHaveLength(1);
      
      const passwordValido = await bcrypt.compare(usuario.password, usuarioEnBD[0].password);
      expect(passwordValido).toBe(true);

      console.log(`✅ Login verificado para ${usuario.correo}`);
    }
  });
});