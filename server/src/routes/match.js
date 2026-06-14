const express = require('express');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const ctrl = require('../controllers/matchController');
const { authRequired } = require('../middleware/auth');
const { runValidation } = require('../middleware/validators');

const router = express.Router();

const swipeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/recommendations', authRequired, ctrl.recommendations);

router.post(
  '/swipe',
  authRequired,
  swipeLimiter,
  [
    body('swiped_id').isInt({ min: 1 }),
    body('action').isInt({ min: 1, max: 2 }),
  ],
  runValidation,
  ctrl.swipe
);

router.get('/matches', authRequired, ctrl.listMatches);

module.exports = router;