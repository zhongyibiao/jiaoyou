const bcrypt = require('bcrypt');
const { query } = require('../db');
const { signToken } = require('../middleware/auth');
const { ok, fail } = require('../utils/response');

const PHONE_RE = /^1[3-9]\d{9}$/;

async function register(req, res) {
  const { phone, email = null, password } = req.body || {};
  if (!PHONE_RE.test(phone)) return fail(res, 40010, 'invalid phone');
  if (typeof password !== 'string' || password.length < 8) {
    return fail(res, 40011, 'password too short (min 8)');
  }

  const existing = await query('SELECT id FROM users WHERE phone = ? LIMIT 1', [phone]);
  if (existing.length) return fail(res, 40910, 'phone already registered', 409);

  const hash = await bcrypt.hash(password, 10);
  const result = await query(
    'INSERT INTO users (phone, email, password_hash) VALUES (?, ?, ?)',
    [phone, email, hash]
  );
  const userId = result.insertId;
  await query('INSERT INTO profiles (user_id, nickname) VALUES (?, ?)', [userId, `user_${userId}`]);

  const token = signToken({ id: userId, phone });
  return ok(res, { token, user: { id: userId, phone, email } });
}

async function login(req, res) {
  const { phone, password } = req.body || {};
  if (!PHONE_RE.test(phone) || typeof password !== 'string') {
    return fail(res, 40012, 'invalid credentials');
  }
  const rows = await query(
    'SELECT id, phone, email, password_hash FROM users WHERE phone = ? LIMIT 1',
    [phone]
  );
  if (!rows.length) return fail(res, 40110, 'invalid credentials', 401);
  const user = rows[0];
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) return fail(res, 40110, 'invalid credentials', 401);

  const token = signToken(user);
  return ok(res, {
    token,
    user: { id: user.id, phone: user.phone, email: user.email },
  });
}

module.exports = { register, login };