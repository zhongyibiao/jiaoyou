/**
 * Redis 缓存服务
 * 滑动卡片池、用户资料、推荐列表等热点数据走这里
 */

const redis = require('redis');
const logger = require('../utils/logger');

class CacheService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.host = process.env.REDIS_HOST || '127.0.0.1';
    this.port = parseInt(process.env.REDIS_PORT || '6379', 10);
    this.password = process.env.REDIS_PASSWORD || '';
    this.db = parseInt(process.env.REDIS_DB || '0', 10);
  }

  async connect() {
    if (this.connected) return this.client;
    this.client = redis.createClient({
      socket: { host: this.host, port: this.port },
      password: this.password || undefined,
      database: this.db,
    });
    this.client.on('error', (err) => logger.error(`[Redis] error: ${err.message}`));
    await this.client.connect();
    this.connected = true;
    logger.info(`[Redis] connected ${this.host}:${this.port}/${this.db}`);
    return this.client;
  }

  async get(key) {
    if (!this.connected) return null;
    const v = await this.client.get(key);
    if (!v) return null;
    try { return JSON.parse(v); } catch { return v; }
  }

  async set(key, value, ttlSeconds) {
    if (!this.connected) return false;
    const v = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttlSeconds) {
      return this.client.setEx(key, ttlSeconds, v);
    }
    return this.client.set(key, v);
  }

  async del(key) {
    if (!this.connected) return 0;
    return this.client.del(key);
  }

  async delPattern(pattern) {
    if (!this.connected) return 0;
    let cursor = 0;
    let total = 0;
    do {
      const reply = await this.client.scan(cursor, { MATCH: pattern, COUNT: 100 });
      cursor = reply.cursor;
      if (reply.keys.length) {
        total += await this.client.del(reply.keys);
      }
    } while (cursor !== 0);
    return total;
  }

  async zadd(key, score, member) {
    if (!this.connected) return 0;
    return this.client.zAdd(key, [{ score, value: String(member) }]);
  }

  async zrangeByScore(key, min, max, limit) {
    if (!this.connected) return [];
    return this.client.zRangeByScore(key, min, max, { LIMIT: limit });
  }

  async incr(key) {
    if (!this.connected) return 0;
    return this.client.incr(key);
  }

  async close() {
    if (this.connected) {
      await this.client.quit();
      this.connected = false;
    }
  }
}

module.exports = new CacheService();
