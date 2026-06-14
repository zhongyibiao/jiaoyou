/**
 * 简易日志工具
 * 生产环境建议替换为 winston / pino
 */

const level = (process.env.LOG_LEVEL || 'info').toLowerCase();
const ranks = { debug: 10, info: 20, warn: 30, error: 40 };

function shouldLog(lvl) {
  return (ranks[lvl] || 20) >= (ranks[level] || 20);
}

function fmt(lvl, msg, meta) {
  const ts = new Date().toISOString();
  const m = meta && Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${ts} [${lvl.toUpperCase()}] ${msg}${m}`;
}

module.exports = {
  debug: (msg, meta) => shouldLog('debug') && console.log(fmt('debug', msg, meta)),
  info: (msg, meta) => shouldLog('info') && console.log(fmt('info', msg, meta)),
  warn: (msg, meta) => shouldLog('warn') && console.warn(fmt('warn', msg, meta)),
  error: (msg, meta) => shouldLog('error') && console.error(fmt('error', msg, meta)),
};
