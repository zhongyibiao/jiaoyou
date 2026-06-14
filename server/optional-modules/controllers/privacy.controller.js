/**
 * 隐私设置 Controller
 */

const Privacy = require('../models/privacy.model');
const store = require('../utils/store');
const logger = require('../utils/logger');

async function getPrivacy(req, res) {
  const userId = req.user.id;
  let record = await store.findOne('privacy', { user_id: userId });
  if (!record) {
    record = Privacy.defaultsFor(userId);
    await store.insert('privacy', record);
  }
  res.json({ code: 0, data: record });
}

async function updatePrivacy(req, res) {
  const userId = req.user.id;
  const allowed = [
    'profile_visibility', 'show_distance', 'show_online', 'show_age',
    'allow_stranger_msg', 'allow_search_by_phone', 'show_in_recommend', 'read_receipt',
  ];
  const updates = {};
  for (const k of allowed) {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  }
  updates.user_id = userId;
  updates.updated_at = Date.now();

  if (updates.profile_visibility && !Object.values(Privacy.Visibility).includes(updates.profile_visibility)) {
    return res.status(400).json({ code: 4001, message: 'profile_visibility 取值不合法' });
  }

  await store.upsert('privacy', { user_id: userId }, updates);
  logger.info(`[Privacy] update userId=${userId}`);
  res.json({ code: 0, data: updates });
}

module.exports = { getPrivacy, updatePrivacy };
