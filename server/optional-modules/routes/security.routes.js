/**
 * 安全相关路由
 */

const router = require('express').Router();
const { authRequired } = require('../middlewares/auth.middleware');
const { rateLimit } = require('../middlewares/rate-limit.middleware');
const privacy = require('../controllers/privacy.controller');
const block = require('../controllers/block.controller');
const report = require('../controllers/report.controller');

// 隐私
router.get('/privacy', authRequired, privacy.getPrivacy);
router.put('/privacy', authRequired, privacy.updatePrivacy);

// 拉黑
router.post('/blocks', authRequired, rateLimit({ key: 'block', limit: 30, windowMs: 60_000 }), block.block);
router.delete('/blocks', authRequired, block.unblock);
router.get('/blocks', authRequired, block.listBlocked);

// 举报
router.post('/reports', authRequired, rateLimit({ key: 'report', limit: 10, windowMs: 60_000 }), report.createReport);
router.get('/reports', authRequired, report.listReports);
router.put('/reports/:id/review', authRequired, report.reviewReport);

module.exports = router;
