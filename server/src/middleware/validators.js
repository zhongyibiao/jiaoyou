const { validationResult } = require('express-validator');
const { fail } = require('../utils/response');

function runValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return fail(res, 40001, errors.array()[0].msg, 400);
  }
  next();
}

module.exports = { runValidation };