/**
 * 拉黑/屏蔽模型
 * 拉黑后双方不再出现在推荐、滑卡、匹配列表中
 */

const fields = {
  id: 0,
  user_id: 0,        // 拉黑发起人
  blocked_id: 0,     // 被拉黑人
  reason: '',
  created_at: 0,
};

function newRecord(userId, blockedId, reason = '') {
  return {
    ...fields,
    user_id: userId,
    blocked_id: blockedId,
    reason,
    created_at: Date.now(),
  };
}

module.exports = { fields, newRecord };
