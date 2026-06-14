/**
 * 举报 Controller
 * 同一举报人对同一目标 24 小时内只允许一次
 */

const Report = require('../models/report.model');
const store = require('../utils/store');
const logger = require('../utils/logger');

const DEDUP_WINDOW_MS = 24 * 60 * 60 * 1000;

async function createReport(req, res) {
  const reporterId = req.user.id;
  const { target_type, target_id, reason, description = '', evidence = [] } = req.body;

  if (!Object.values(Report.TargetType).includes(target_type)) {
    return res.status(400).json({ code: 4001, message: 'target_type 不合法' });
  }
  if (!Object.values(Report.ReportReason).includes(reason)) {
    return res.status(400).json({ code: 4001, message: 'reason 不合法' });
  }
  if (!target_id) {
    return res.status(400).json({ code: 4001, message: 'target_id 必填' });
  }

  const since = Date.now() - DEDUP_WINDOW_MS;
  const recent = await store.findOne('reports', {
    reporter_id: reporterId,
    target_type,
    target_id,
    created_at: { $gte: since },
  });
  if (recent) {
    return res.status(429).json({ code: 4291, message: '24 小时内已举报过，请勿重复提交' });
  }

  const record = Report.newRecord(reporterId, target_type, target_id, reason, description, evidence);
  const id = await store.insert('reports', record);
  record.id = id;

  // 高优先级原因（欺诈、未成年、仇恨）触发自动审核标记
  if ([Report.ReportReason.FRAUD, Report.ReportReason.UNDERAGE, Report.ReportReason.HATE].includes(reason)) {
    record.status = 'reviewing';
    await store.update('reports', { id }, { status: 'reviewing' });
    logger.warn(`[Report] high-priority reporter=${reporterId} target=${target_id} reason=${reason}`);
  }

  logger.info(`[Report] reporter=${reporterId} target_type=${target_type} target_id=${target_id} reason=${reason}`);
  res.json({ code: 0, data: { id } });
}

async function listReports(req, res) {
  const { status, page = 1, page_size = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  const list = await store.find('reports', filter, { page, page_size, sort: { created_at: -1 } });
  res.json({ code: 0, data: list });
}

async function reviewReport(req, res) {
  const { id } = req.params;
  const { status, remark = '' } = req.body;
  if (!Object.values(Report.ReportStatus).includes(status)) {
    return res.status(400).json({ code: 4001, message: 'status 不合法' });
  }
  await store.update('reports', { id }, {
    status,
    reviewed_by: req.user.id,
    reviewed_at: Date.now(),
    remark,
  });
  res.json({ code: 0, message: '已处理' });
}

module.exports = { createReport, listReports, reviewReport };
