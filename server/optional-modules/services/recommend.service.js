/**
 * 推荐/滑卡 服务
 * 流程：Redis ZSET 拿候选 → 过滤已划/已拉黑 → DB 二次校验
 */

const cache = require('./cache.service');
const store = require('../utils/store');

const CANDIDATE_KEY = (uid) => `swipe:candidate:${uid}`;
const CANDIDATE_TTL = 30 * 60; // 30 min
const POOL_SIZE = 200;

async function getCandidates(userId, limit = 10) {
  await cache.connect();
  const key = CANDIDATE_KEY(userId);
  const exists = await cache.client.exists(key);
  if (!exists) {
    await warmPool(userId);
  }
  return cache.zrangeByScore(key, 0, '+inf', { offset: 0, count: limit });
}

async function warmPool(userId) {
  const key = CANDIDATE_KEY(userId);
  // 真实实现：从 DB 按 (location, gender, age) 检索候选写入 ZSET
  // 这里只占位，写入空数据
  await cache.del(key);
  // 实际：await cache.client.zAdd(key, candidates.map(c => ({ score: c.score, value: String(c.id) })));
  await cache.client.expire(key, CANDIDATE_TTL);
}

async function removeCandidate(userId, candidateId) {
  await cache.connect();
  await cache.client.zRem(CANDIDATE_KEY(userId), String(candidateId));
}

module.exports = { getCandidates, warmPool, removeCandidate, POOL_SIZE };
