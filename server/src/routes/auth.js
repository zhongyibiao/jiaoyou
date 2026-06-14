const express = require('express');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const auth = require('../controllers/authController');
const { authRequired } = require('../middleware/auth');
const userCtrl = require('../controllers/userController');
const { runValidation } = require('../middleware/validators');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 42900, message: 'too many auth attempts' },
});

router.post(
  '/register',
  authLimiter,
  [
    body('phone').isString().notEmpty().withMessage('phone required'),
    body('password').isString().isLength({ min: 8 }).withMessage('password min 8'),
    body('email').optional({ checkFalsy: true }).isEmail().withMessage('invalid email'),
  ],
  runValidation,
  auth.register
);

router.post(
  '/login',
  authLimiter,
  [
    body('phone').isString().notEmpty().withMessage('phone required'),
    body('password').isString().notEmpty().withMessage('password required'),
  ],
  runValidation,
  auth.login
);

router.get('/me', authRequired, userCtrl.getMyProfile);

module.exports = router;