const express = require('express');
const { body, param } = require('express-validator');
const ctrl = require('../controllers/messageController');
const { authRequired } = require('../middleware/auth');
const { runValidation } = require('../middleware/validators');

const router = express.Router();

router.get(
  '/:matchId',
  authRequired,
  [param('matchId').isInt({ min: 1 })],
  runValidation,
  ctrl.listMessages
);

router.post(
  '/',
  authRequired,
  [
    body('match_id').isInt({ min: 1 }),
    body('content').isString().isLength({ min: 1, max: 2000 }),
    body('content_type').optional().isInt({ min: 1, max: 3 }),
  ],
  runValidation,
  ctrl.sendMessage
);

router.get('/unread/count', authRequired, ctrl.unreadCount);

module.exports = router;