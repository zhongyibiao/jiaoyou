/**
 * 拉黑 Controller
 */

const Block = require('../models/block.model');
const store = require('../utils/store');
const cache = require('../services/cache.service');
const logger = require('../utils/logger');

async function block(req, res) {
  const userId = req.user.id;
  const { blocked_id, reason = '' } = req.body;
  if (!blocked_id || blocked_id === userId) {
    return res.status(400).json({ code: 4001, message: '参数错误' });
  }
  const existing = await store.findOne('blocks', { user_id: userId, blocked_id });
  if (existing) {
    return res.json({ code: 0, data: existing, message: '已拉黑' });
  }
  const record = Block.newRecord(userId, blocked_id, reason);
  const id = await store.insert('blocks', record);
  record.id = id;

  // 同步清理缓存中的推荐池
  await cache.del(`swipe:candidate:${userId}`);
  await cache.del(`match:list:${userId}`);

  logger.info(`[Block] userId=${userId} block ${blocked_id}`);
  res.json({ code: 0, data: record });
}

async function unblock(req, res) {
  const userId = req.user.id;
  const { blocked_id } = req.body;
  if (!blocked_id) {
    return res.status(400).json({ code: 4001, message: '参数错误' });
  }
  await store.delete('blocks', { user_id: userId, blocked_id });
  await cache.del(`swipe:candidate:${userId}`);
  res.json({ code: 0, message: '已解除拉黑' });
}

async function listBlocked(req, res) {
  const userId = req.user.id;
  const { page = 1, page_size = 20 } = req.query;
  const list = await store.find('blocks', { user_id: userId }, { page, page_size, sort: { created_at: -1 } });
  res.json({ code: 0, data: list });
}

module.exports = { block, unblock, listBlocked };
