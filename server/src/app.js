const path = require('path');
const http = require('http');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const config = require('./config');
const { ok, fail } = require('./utils/response');
const { notFound, errorHandler } = require('./middleware/errors');
const { createSocketServer } = require('./sockets/chat');

const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');
const matchRouter = require('./routes/match');
const messagesRouter = require('./routes/messages');

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: config.clientOrigin, credentials: true }));
app.use(express.json({ limit: '256kb' }));
app.use(express.urlencoded({ extended: false }));

// Static for uploaded avatars
app.use('/static/avatars', express.static(config.uploadDir));

// Global rate limit (broad)
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get('/health', (req, res) => ok(res, { status: 'ok' }));

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/match', matchRouter);
app.use('/api/messages', messagesRouter);

app.use(notFound);
app.use(errorHandler);

const httpServer = http.createServer(app);
createSocketServer(httpServer);

if (require.main === module) {
  httpServer.listen(config.port, () => {
    console.log(`[jiaoyou-server] listening on :${config.port}`);
  });
}

module.exports = app;