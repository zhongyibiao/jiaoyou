/**
 * 限流中间件
 * 基于滑动窗口（Redis ZSET）
 */

const cache = require('../services/cache.service');
const logger = require('../utils/logger');

function rateLimit({ key, limit, windowMs, message = '请求过于频繁' }) {
  return async (req, res, next) => {
    try {
      await cache.connect();
    } catch {
      return next(); // 缓存不可用时降级放行
    }
    const id = req.user?.id || req.ip;
    const redisKey = `rl:${key}:${id}`;
    const now = Date.now();
    const min = now - windowMs;

    try {
      await cache.client.zRemRangeByScore(redisKey, 0, min);
      const count = await cache.client.zCard(redisKey);
      if (count >= limit) {
        return res.status(429).json({ code: 429, message });
      }
      await cache.client.zAdd(redisKey, [{ score: now, value: String(now) }]);
      await cache.client.pExpire(redisKey, windowMs);
      return next();
    } catch (err) {
      logger.error(`[RateLimit] error: ${err.message}`);
      return next();
    }
  };
}

module.exports = { rateLimit };
