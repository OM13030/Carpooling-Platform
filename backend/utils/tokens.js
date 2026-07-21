const jwt = require('jsonwebtoken');

const cleanPayload = (payload) => {
  if (!payload) return {};
  const rawPayload = typeof payload.toObject === 'function' ? payload.toObject() : payload;
  return JSON.parse(JSON.stringify(rawPayload));
};

const getSanitizedEnv = (key, fallback) => {
  const value = process.env[key];
  if (!value) return fallback;
  // Trim spaces and strip surrounding quotes
  return value.trim().replace(/^['"]|['"]$/g, '');
};

const generateAccessToken = (payload) => {
  return jwt.sign(
    cleanPayload(payload),
    getSanitizedEnv('JWT_ACCESS_SECRET', 'access_secret'),
    { expiresIn: getSanitizedEnv('JWT_ACCESS_EXPIRY', '15m') }
  );
};

const generateRefreshToken = (payload) => {
  return jwt.sign(
    cleanPayload(payload),
    getSanitizedEnv('JWT_REFRESH_SECRET', 'refresh_secret'),
    { expiresIn: getSanitizedEnv('JWT_REFRESH_EXPIRY', '7d') }
  );
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, getSanitizedEnv('JWT_ACCESS_SECRET', 'access_secret'));
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, getSanitizedEnv('JWT_REFRESH_SECRET', 'refresh_secret'));
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
