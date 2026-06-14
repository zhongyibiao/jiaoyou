const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, param } = require('express-validator');
const ctrl = require('../controllers/userController');
const { authRequired } = require('../middleware/auth');
const { runValidation } = require('../middleware/validators');
const config = require('../config');

const router = express.Router();

if (!fs.existsSync(config.uploadDir)) fs.mkdirSync(config.uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: config.uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `u${req.user.id}_${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: config.maxUploadSize },
  fileFilter: (req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype);
    if (!ok) return cb(new Error('only jpg/png/webp allowed'));
    cb(null, true);
  },
});

router.get('/me', authRequired, ctrl.getMyProfile);
router.put(
  '/me',
  authRequired,
  [
    body('nickname').optional().isString().isLength({ min: 1, max: 60 }),
    body('gender').optional().isInt({ min: 0, max: 2 }),
    body('birthday').optional({ checkFalsy: true }).isISO8601(),
    body('bio').optional({ checkFalsy: true }).isString().isLength({ max: 500 }),
    body('province').optional({ checkFalsy: true }).isString().isLength({ max: 60 }),
    body('city').optional({ checkFalsy: true }).isString().isLength({ max: 60 }),
    body('interests').optional().custom((v) => {
      if (Array.isArray(v)) return true;
      if (typeof v === 'string') {
        try { JSON.parse(v); return true; } catch (_) { return false; }
      }
      return false;
    }).withMessage('interests must be array or json string'),
  ],
  runValidation,
  ctrl.updateMyProfile
);
router.post('/avatar', authRequired, upload.single('file'), ctrl.uploadAvatar);

router.get(
  '/:id',
  authRequired,
  [param('id').isInt({ min: 1 })],
  runValidation,
  ctrl.getUserById
);

router.post(
  '/block',
  authRequired,
  [body('blocked_id').isInt({ min: 1 })],
  runValidation,
  ctrl.blockUser
);

router.post(
  '/report',
  authRequired,
  [
    body('reported_id').isInt({ min: 1 }),
    body('reason').optional({ checkFalsy: true }).isString().isLength({ max: 500 }),
  ],
  runValidation,
  ctrl.reportUser
);

module.exports = router;