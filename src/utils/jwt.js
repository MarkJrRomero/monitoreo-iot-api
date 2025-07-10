const crypto = require('crypto');

function createToken(payload, secret, expiresInMs) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + expiresInMs })).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}

function verifyToken(token, secret) {
  const [headerB64, bodyB64, signature] = token.split('.');
  const expectedSig = crypto.createHmac("sha256", secret).update(`${headerB64}.${bodyB64}`).digest("base64url");
  if (expectedSig !== signature) return null;

  const body = JSON.parse(Buffer.from(bodyB64, 'base64url'));
  if (body.exp < Date.now()) return null;

  return body;
}

module.exports = { createToken, verifyToken };
