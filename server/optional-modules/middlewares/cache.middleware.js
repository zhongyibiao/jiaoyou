/**
 * 缓存中间件
 * 通用 GET 缓存包装器，命中 Redis 直接返回
 */

const cache = require('../services/cache.service');
const logger = require('../utils/logger');

function cacheMiddleware({ key, ttl = 60, skip = () => false }) {
  return async (req, res, next) => {
    if (skip(req)) return next();
    try {
      await cache.connect();
    } catch {
      return next();
    }
    const fullKey = typeof key === 'function' ? key(req) : `${key}:${req.originalUrl}`;
    const hit = await cache.get(fullKey);
    if (hit) {
      res.set('X-Cache', 'HIT');
      return res.json(hit);
    }
    res.set('X-Cache', 'MISS');
    const origJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode === 200 && body && body.code === 0) {
        cache.set(fullKey, body, ttl).catch((err) => logger.error(`[Cache] set err: ${err.message}`));
      }
      return origJson(body);
    };
    return next();
  };
}

module.exports = { cacheMiddleware };
