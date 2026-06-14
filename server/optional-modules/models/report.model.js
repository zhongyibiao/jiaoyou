/**
 * 举报模型
 * 支持对用户、动态、消息多种目标举报
 */

const TargetType = {
  USER: 'user',
  MOMENT: 'moment',
  MESSAGE: 'message',
  COMMENT: 'comment',
};

const ReportReason = {
  HARASSMENT: 'harassment',
  FRAUD: 'fraud',
  PORN: 'porn',
  SPAM: 'spam',
  FAKE_INFO: 'fake_info',
  UNDERAGE: 'underage',
  HATE: 'hate',
  OTHER: 'other',
};

const ReportStatus = {
  PENDING: 'pending',
  REVIEWING: 'reviewing',
  RESOLVED: 'resolved',
  REJECTED: 'rejected',
};

const fields = {
  id: 0,
  reporter_id: 0,
  target_type: 'user',
  target_id: 0,
  reason: 'other',
  description: '',
  evidence: [],     // 截图、消息ID等
  status: 'pending',
  reviewed_by: 0,
  reviewed_at: 0,
  created_at: 0,
};

function newRecord(reporterId, targetType, targetId, reason, description = '', evidence = []) {
  return {
    ...fields,
    reporter_id: reporterId,
    target_type: targetType,
    target_id: targetId,
    reason,
    description,
    evidence,
    created_at: Date.now(),
  };
}

module.exports = { fields, newRecord, TargetType, ReportReason, ReportStatus };
