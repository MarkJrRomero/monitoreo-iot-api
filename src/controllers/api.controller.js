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

exports.ingestData = (req, res) => {
  const { gps, combustible, temperatura } = req.body;
  // Aquí deberías guardar en BD y procesar la predicción
  return res.json({ ok: true, msg: 'Datos recibidos' });
};
