const { verifyToken } = require('../utils/jwt');

exports.authMiddleware = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Sin token' });

  const token = auth.split(' ')[1];
  const data = verifyToken(token, process.env.JWT_SECRET);
  if (!data) return res.status(403).json({ error: 'Token inválido o expirado' });

  req.user = data;
  next();
};
