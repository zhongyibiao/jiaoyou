const { fail } = require('../utils/response');

function notFound(req, res) {
  return fail(res, 40400, 'route not found', 404);
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // express-validator errors
  if (err && err.array && typeof err.array === 'function') {
    return fail(res, 40001, err.array()[0]?.msg || 'invalid request', 400);
  }
  if (err && err.status && err.message) {
    return fail(res, err.code || err.status, err.message, err.status);
  }
  console.error('[unhandled]', err);
  return fail(res, 50000, 'internal server error', 500);
}

module.exports = { notFound, errorHandler };