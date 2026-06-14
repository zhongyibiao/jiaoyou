const jwt = require('jsonwebtoken');
const xss = require('xss');
const { Server } = require('socket.io');
const config = require('../config');
const { query } = require('../db');

function authenticateSocket(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('missing token'));
    try {
      const payload = jwt.verify(token, config.jwt.secret);
      socket.user = { id: payload.sub, phone: payload.phone };
      next();
    } catch (_) {
      next(new Error('invalid token'));
    }
  });
}

async function isParticipant(matchId, userId) {
  const rows = await query(
    'SELECT id FROM matches WHERE id = ? AND (user_a_id = ? OR user_b_id = ?) LIMIT 1',
    [matchId, userId]
  );
  return rows.length > 0;
}

function attachChat(io) {
  io.on('connection', (socket) => {
    const userId = socket.user.id;
    socket.join(`user:${userId}`);
    socket.emit('connected', { user_id: userId });

    socket.on('match:join', async (payload, ack) => {
      const matchId = Number(payload?.match_id);
      if (!matchId || !(await isParticipant(matchId, userId))) {
        return ack && ack({ ok: false, error: 'forbidden' });
      }
      socket.join(`match:${matchId}`);
      ack && ack({ ok: true });
    });

    socket.on('match:leave', (payload) => {
      const matchId = Number(payload?.match_id);
      if (matchId) socket.leave(`match:${matchId}`);
    });

    socket.on('message:send', async (payload, ack) => {
      const matchId = Number(payload?.match_id);
      const raw = typeof payload?.content === 'string' ? payload.content : '';
      const content = xss(raw.trim());
      const contentType = Number(payload?.content_type) || 1;

      if (!matchId || !content || content.length > 2000) {
        return ack && ack({ ok: false, error: 'invalid payload' });
      }
      if (![1, 2, 3].includes(contentType)) {
        return ack && ack({ ok: false, error: 'invalid content_type' });
      }
      if (!(await isParticipant(matchId, userId))) {
        return ack && ack({ ok: false, error: 'forbidden' });
      }

      const result = await query(
        'INSERT INTO messages (match_id, sender_id, content, content_type) VALUES (?, ?, ?, ?)',
        [matchId, userId, content, contentType]
      );
      const rows = await query(
        'SELECT id, match_id, sender_id, content, content_type, read_at, created_at FROM messages WHERE id = ?',
        [result.insertId]
      );
      const message = rows[0];
      io.to(`match:${matchId}`).emit('message:new', message);
      ack && ack({ ok: true, data: message });
    });

    socket.on('message:read', async (payload) => {
      const matchId = Number(payload?.match_id);
      if (!matchId || !(await isParticipant(matchId, userId))) return;
      await query(
        'UPDATE messages SET read_at = NOW() WHERE match_id = ? AND sender_id <> ? AND read_at IS NULL',
        [matchId, userId]
      );
      socket.to(`match:${matchId}`).emit('message:read', { match_id: matchId, reader_id: userId });
    });

    socket.on('typing', (payload) => {
      const matchId = Number(payload?.match_id);
      if (!matchId) return;
      socket.to(`match:${matchId}`).emit('typing', { match_id: matchId, user_id: userId });
    });
  });
}

function createSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: config.clientOrigin, credentials: true },
  });
  authenticateSocket(io);
  attachChat(io);
  return io;
}

module.exports = { createSocketServer };