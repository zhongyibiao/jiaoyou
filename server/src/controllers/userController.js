const fs = require('fs/promises');
const path = require('path');
const { query } = require('../db');
const { ok, fail } = require('../utils/response');
const config = require('../config');
const { cleanText, cleanOptional, cleanArray } = require('../utils/sanitize');

function parseInterests(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim().length) {
    try {
      const arr = JSON.parse(value);
      return Array.isArray(arr) ? arr : [];
    } catch (_) {
      return [];
    }
  }
  return [];
}

function shapeProfile(row) {
  if (!row) return null;
  let interests = row.interests;
  if (typeof interests === 'string') {
    try { interests = JSON.parse(interests); } catch (_) { interests = []; }
  }
  return {
    id: row.user_id,
    nickname: row.nickname,
    avatar: row.avatar,
    gender: row.gender,
    birthday: row.birthday,
    bio: row.bio,
    province: row.province,
    city: row.city,
    interests: interests || [],
    last_active: row.last_active,
  };
}

async function getMyProfile(req, res) {
  const rows = await query(
    `SELECT u.id AS user_id, u.phone, u.email, u.created_at,
            p.nickname, p.avatar, p.gender, p.birthday, p.bio,
            p.province, p.city, p.interests, p.last_active
     FROM users u
     LEFT JOIN profiles p ON p.user_id = u.id
     WHERE u.id = ? LIMIT 1`,
    [req.user.id]
  );
  if (!rows.length) return fail(res, 40401, 'user not found', 404);
  return ok(res, shapeProfile(rows[0]));
}

async function updateMyProfile(req, res) {
  const allowed = ['nickname', 'gender', 'birthday', 'bio', 'province', 'city', 'interests'];
  const updates = [];
  const params = [];

  if (req.body.nickname !== undefined) {
    const v = cleanText(req.body.nickname);
    if (v.length === 0 || v.length > 60) return fail(res, 40020, 'nickname length invalid');
    updates.push('nickname = ?'); params.push(v);
  }
  if (req.body.gender !== undefined) {
    const g = Number(req.body.gender);
    if (![0, 1, 2].includes(g)) return fail(res, 40021, 'invalid gender');
    updates.push('gender = ?'); params.push(g);
  }
  if (req.body.birthday !== undefined) {
    updates.push('birthday = ?'); params.push(req.body.birthday || null);
  }
  if (req.body.bio !== undefined) {
    const v = cleanOptional(req.body.bio);
    if (v && v.length > 500) return fail(res, 40022, 'bio too long');
    updates.push('bio = ?'); params.push(v);
  }
  if (req.body.province !== undefined) {
    updates.push('province = ?'); params.push(cleanOptional(req.body.province));
  }
  if (req.body.city !== undefined) {
    updates.push('city = ?'); params.push(cleanOptional(req.body.city));
  }
  if (req.body.interests !== undefined) {
    const arr = cleanArray(parseInterests(req.body.interests));
    updates.push('interests = ?'); params.push(JSON.stringify(arr));
  }

  if (updates.length === 0) return ok(res, null, 'no changes');
  params.push(req.user.id);
  await query(`UPDATE profiles SET ${updates.join(', ')} WHERE user_id = ?`, params);
  return ok(res, null, 'updated');
}

async function uploadAvatar(req, res) {
  if (!req.file) return fail(res, 40030, 'no file uploaded');
  const url = `/static/avatars/${req.file.filename}`;
  await query('UPDATE profiles SET avatar = ? WHERE user_id = ?', [url, req.user.id]);
  return ok(res, { avatar: url });
}

async function getUserById(req, res) {
  const id = Number(req.params.id);
  if (!id) return fail(res, 40031, 'invalid id');
  const rows = await query(
    `SELECT u.id AS user_id, p.nickname, p.avatar, p.gender,
            p.birthday, p.bio, p.province, p.city, p.interests, p.last_active
     FROM users u
     LEFT JOIN profiles p ON p.user_id = u.id
     WHERE u.id = ? LIMIT 1`,
    [id]
  );
  if (!rows.length) return fail(res, 40402, 'user not found', 404);
  return ok(res, shapeProfile(rows[0]));
}

async function blockUser(req, res) {
  const blockedId = Number(req.body?.blocked_id);
  if (!blockedId || blockedId === req.user.id) return fail(res, 40040, 'invalid blocked_id');
  const exists = await query('SELECT id FROM users WHERE id = ? LIMIT 1', [blockedId]);
  if (!exists.length) return fail(res, 40403, 'user not found', 404);
  await query(
    'INSERT IGNORE INTO blocks (blocker_id, blocked_id) VALUES (?, ?)',
    [req.user.id, blockedId]
  );
  return ok(res, null, 'blocked');
}

async function reportUser(req, res) {
  const reportedId = Number(req.body?.reported_id);
  const reason = cleanOptional(req.body?.reason) || '';
  if (!reportedId || reportedId === req.user.id) return fail(res, 40050, 'invalid reported_id');
  if (reason.length > 500) return fail(res, 40051, 'reason too long');
  const exists = await query('SELECT id FROM users WHERE id = ? LIMIT 1', [reportedId]);
  if (!exists.length) return fail(res, 40404, 'user not found', 404);
  await query(
    'INSERT INTO reports (reporter_id, reported_id, reason) VALUES (?, ?, ?)',
    [req.user.id, reportedId, reason]
  );
  return ok(res, null, 'reported');
}

module.exports = {
  getMyProfile,
  updateMyProfile,
  uploadAvatar,
  getUserById,
  blockUser,
  reportUser,
};