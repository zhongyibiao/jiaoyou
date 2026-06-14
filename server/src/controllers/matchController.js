const { query, withTransaction } = require('../db');
const { ok, fail } = require('../utils/response');

async function recommendations(req, res) {
  const limit = Math.min(50, parseInt(req.query.limit) || 20, 10);
  const userId = req.user.id;
  const rows = await query(
    `SELECT u.id AS user_id, p.nickname, p.avatar, p.gender,
            p.birthday, p.bio, p.province, p.city, p.interests, p.last_active
     FROM users u
     LEFT JOIN profiles p ON p.user_id = u.id
     WHERE u.id <> ?
       AND u.id NOT IN (
         SELECT swiped_id FROM swipes WHERE swiper_id = ?
       )
       AND u.id NOT IN (
         SELECT blocked_id FROM blocks WHERE blocker_id = ?
       )
       AND u.id NOT IN (
         SELECT blocker_id FROM blocks WHERE blocked_id = ?
       )
     ORDER BY p.last_active DESC
     LIMIT ${limit}`,
    [userId, userId, userId, userId]
  );
  return ok(res, rows.map((row) => ({
    id: row.user_id,
    nickname: row.nickname,
    avatar: row.avatar,
    gender: row.gender,
    birthday: row.birthday,
    bio: row.bio,
    province: row.province,
    city: row.city,
    interests: parseInterests(row.interests),
    last_active: row.last_active,
  })));
}

function parseInterests(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  try { return JSON.parse(v); } catch (_) { return []; }
}

async function swipe(req, res) {
  const swipedId = Number(req.body?.swiped_id);
  const action = Number(req.body?.action);
  if (!swipedId || swipedId === req.user.id) return fail(res, 40060, 'invalid swiped_id');
  if (![1, 2].includes(action)) return fail(res, 40061, 'invalid action (1=like,2=pass)');

  const exists = await query('SELECT id FROM users WHERE id = ? LIMIT 1', [swipedId]);
  if (!exists.length) return fail(res, 40405, 'user not found', 404);

  await query(
    'INSERT INTO swipes (swiper_id, swiped_id, action) VALUES (?, ?, ?) ' +
    'ON DUPLICATE KEY UPDATE action = VALUES(action)',
    [req.user.id, swipedId, action]
  );

  if (action !== 1) return ok(res, { matched: false });

  const reverse = await query(
    'SELECT id FROM swipes WHERE swiper_id = ? AND swiped_id = ? AND action = 1 LIMIT 1',
    [swipedId, req.user.id]
  );
  if (!reverse.length) return ok(res, { matched: false });

  const [a, b] = req.user.id < swipedId ? [req.user.id, swipedId] : [swipedId, req.user.id];

  const result = await withTransaction(async (conn) => {
    const [insert] = await conn.execute(
      'INSERT IGNORE INTO matches (user_a_id, user_b_id) VALUES (?, ?)',
      [a, b]
    );
    if (insert.insertId) {
      return { matched: true, match_id: insert.insertId, peer_id: swipedId };
    }
    const [rows] = await conn.execute(
      'SELECT id FROM matches WHERE user_a_id = ? AND user_b_id = ? LIMIT 1',
      [a, b]
    );
    return { matched: true, match_id: rows[0]?.id, peer_id: swipedId };
  });

  return ok(res, result);
}

async function listMatches(req, res) {
  const me = req.user.id;
  const rows = await query(
    `SELECT m.id AS match_id, m.matched_at,
            CASE WHEN m.user_a_id = ? THEN m.user_b_id ELSE m.user_a_id END AS peer_id,
            p.nickname, p.avatar,
            (SELECT content FROM messages WHERE match_id = m.id ORDER BY id DESC LIMIT 1) AS last_message,
            (SELECT created_at FROM messages WHERE match_id = m.id ORDER BY id DESC LIMIT 1) AS last_message_at,
            (SELECT COUNT(*) FROM messages WHERE match_id = m.id AND sender_id <> ? AND read_at IS NULL) AS unread
     FROM matches m
     LEFT JOIN profiles p
       ON p.user_id = CASE WHEN m.user_a_id = ? THEN m.user_b_id ELSE m.user_a_id END
     WHERE m.user_a_id = ? OR m.user_b_id = ?
     ORDER BY COALESCE(last_message_at, m.matched_at) DESC`,
    [me, me, me, me, me]
  );
  return ok(res, rows.map((row) => ({
    match_id: row.match_id,
    peer: { id: row.peer_id, nickname: row.nickname, avatar: row.avatar },
    last_message: row.last_message,
    last_message_at: row.last_message_at,
    unread: Number(row.unread) || 0,
    matched_at: row.matched_at,
  })));
}

module.exports = { recommendations, swipe, listMatches };