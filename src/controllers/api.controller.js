const { createToken } = require('../utils/jwt');

exports.login = (req, res) => {
  const { user, password } = req.body;
  if (user === 'admin' && password === '1234') {
    const token = createToken({ user, role: 'admin' }, process.env.JWT_SECRET, 3600000);
    return res.json({ token });
  }
  return res.status(401).json({ error: 'Credenciales inválidas' });
};

exports.ingestData = (req, res) => {
  const { gps, combustible, temperatura } = req.body;
  // Aquí deberías guardar en BD y procesar la predicción
  return res.json({ ok: true, msg: 'Datos recibidos' });
};
