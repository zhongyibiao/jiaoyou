const jwt = require('jsonwebtoken');
const config = require('../config');
const { fail } = require('../utils/response');

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return fail(res, 40101, 'missing token', 401);
  try {
    const payload = jwt.verify(token, config.jwt.secret);
    req.user = { id: payload.sub, phone: payload.phone };
    next();
  } catch (e) {
    return fail(res, 40102, 'invalid or expired token', 401);
  }
}

function signToken(user) {
  return jwt.sign(
    { sub: user.id, phone: user.phone },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

module.exports = { authRequired, signToken };