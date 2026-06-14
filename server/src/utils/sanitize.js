const xss = require('xss');

function cleanText(value) {
  if (typeof value !== 'string') return value;
  return xss(value.trim());
}

function cleanOptional(value) {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : xss(trimmed);
}

function cleanArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => (typeof v === 'string' ? xss(v.trim()) : v))
    .filter((v) => typeof v === 'string' && v.length > 0)
    .slice(0, 30);
}

module.exports = { cleanText, cleanOptional, cleanArray };