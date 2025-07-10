const { createToken } = require('../utils/jwt');
const sql = require('../db.js');
const bcrypt = require('bcrypt');


exports.login = async (req, res) => {
  const { correo, password } = req.body;
  
  try {
    const result = await sql`
      SELECT id, nombre, correo, password, rol
      FROM usuarios
      WHERE correo = ${correo}
    `;

    const usuario = result[0];
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const valid = await bcrypt.compare(password, usuario.password);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const token = createToken(
      { id: usuario.id, correo: usuario.correo, rol: usuario.rol },
      process.env.JWT_SECRET,
      3600000
    );

    res.json({ usuario: {nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol}, token });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.ingestData = async (req, res) => {
  const { vehiculo_id, gps, combustible, temperatura, velocidad, latitud, longitud } = req.body;

  if (!vehiculo_id || !gps || combustible === null || temperatura === null || velocidad === null || latitud === null || longitud === null) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  try {
    const vehiculo = await sql`
      SELECT id FROM vehiculos WHERE dispositivo_id = ${vehiculo_id}
    `;

    if (!vehiculo.length) {
      return res.status(404).json({ error: 'Vehículo no encontrado' });
    }

    let estado = '';

    if (combustible <= 10) {
      if (estado === '') {
        estado += 'alerta de combustible';
      } else {
        estado += '| alerta de combustible';
      }
    }

    if (temperatura >= 90) {
      if (estado === '') {
        estado += 'alerta de temperatura';
      } else {
        estado += '| alerta de temperatura';
      }
    }

    if (velocidad > 80) {
      if (estado === '') {
        estado += 'alerta de exceso de velocidad';
      } else {
        estado += '| alerta de exceso de velocidad';
      }
    }

    if (estado === '') {
      estado = 'normal';
    }

    await sql`
      INSERT INTO sensores (vehiculo_id, gps, combustible, temperatura, velocidad, latitud, longitud, estado)
      VALUES (${vehiculo[0].id}, ${gps}, ${combustible}, ${temperatura}, ${velocidad}, ${latitud}, ${longitud}, ${estado})
    `;

    res.json({ ok: true, data: { vehiculo_id, gps, combustible, temperatura, velocidad, latitud, longitud, estado } });
  } catch (err) {
    console.error('Error en ingesta:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
