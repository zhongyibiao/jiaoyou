/**
 * 鉴权中间件
 * 解析 JWT 并挂到 req.user
 */

const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const SECRET = process.env.JWT_SECRET || 'change-me-in-production';

function authRequired(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) {
    return res.status(401).json({ code: 401, message: '未登录' });
  }
  try {
    req.user = jwt.verify(token, SECRET);
    return next();
  } catch (err) {
    logger.warn(`[Auth] token invalid: ${err.message}`);
    return res.status(401).json({ code: 401, message: 'token 无效' });
  }
}

function signToken(payload, ttl = '7d') {
  return jwt.sign(payload, SECRET, { expiresIn: ttl });
}

module.exports = { authRequired, signToken };
