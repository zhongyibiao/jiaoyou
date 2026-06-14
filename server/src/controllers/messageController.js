const { query } = require('../db');
const { ok, fail } = require('../utils/response');
const { cleanText } = require('../utils/sanitize');

async function ensureParticipant(matchId, userId) {
  const rows = await query(
    'SELECT id, user_a_id, user_b_id FROM matches WHERE id = ? LIMIT 1',
    [matchId]
  );
  if (!rows.length) return { error: { code: 40410, status: 404, message: 'match not found' } };
  const m = rows[0];
  if (m.user_a_id !== userId && m.user_b_id !== userId) {
    return { error: { code: 40310, status: 403, message: 'not a participant' } };
  }
  return { match: m };
}

async function listMessages(req, res) {
  const matchId = Number(req.params.matchId);
  if (!matchId) return fail(res, 40070, 'invalid matchId');
  const ensure = await ensureParticipant(matchId, req.user.id);
  if (ensure.error) return fail(res, ensure.error.code, ensure.error.message, ensure.error.status);

  const limit = Math.min(100, Number(req.query.limit) || 30);
  const beforeId = Number(req.query.before_id) || null;

  const sql = beforeId
    ? `SELECT id, match_id, sender_id, content, content_type, read_at, created_at
       FROM messages
       WHERE match_id = ? AND id < ?
       ORDER BY id DESC LIMIT ?`
    : `SELECT id, match_id, sender_id, content, content_type, read_at, created_at
       FROM messages
       WHERE match_id = ?
       ORDER BY id DESC LIMIT ?`;
  const params = beforeId ? [matchId, beforeId, limit] : [matchId, limit];

  const rows = await query(sql, params);
  await query(
    'UPDATE messages SET read_at = NOW() WHERE match_id = ? AND sender_id <> ? AND read_at IS NULL',
    [matchId, req.user.id]
  );
  return ok(res, rows.reverse());
}

async function sendMessage(req, res) {
  const matchId = Number(req.body?.match_id);
  const content = cleanText(req.body?.content || '');
  const contentType = Number(req.body?.content_type) || 1;
  if (!matchId) return fail(res, 40071, 'invalid match_id');
  if (![1, 2, 3].includes(contentType)) return fail(res, 40072, 'invalid content_type');
  if (!content || content.length > 2000) return fail(res, 40073, 'invalid content');

  const ensure = await ensureParticipant(matchId, req.user.id);
  if (ensure.error) return fail(res, ensure.error.code, ensure.error.message, ensure.error.status);

  const result = await query(
    'INSERT INTO messages (match_id, sender_id, content, content_type) VALUES (?, ?, ?, ?)',
    [matchId, req.user.id, content, contentType]
  );
  const rows = await query(
    'SELECT id, match_id, sender_id, content, content_type, read_at, created_at FROM messages WHERE id = ?',
    [result.insertId]
  );
  return ok(res, rows[0]);
}

async function unreadCount(req, res) {
  const rows = await query(
    `SELECT m.id AS match_id, COUNT(msg.id) AS unread
     FROM matches m
     LEFT JOIN messages msg
       ON msg.match_id = m.id AND msg.sender_id <> ? AND msg.read_at IS NULL
     WHERE m.user_a_id = ? OR m.user_b_id = ?
     GROUP BY m.id`,
    [req.user.id, req.user.id, req.user.id]
  );
  const total = rows.reduce((sum, r) => sum + Number(r.unread || 0), 0);
  return ok(res, { total, by_match: rows.map((r) => ({ match_id: r.match_id, unread: Number(r.unread) || 0 })) });
}

module.exports = { listMessages, sendMessage, unreadCount };