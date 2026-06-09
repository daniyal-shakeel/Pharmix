const jwt = require('jsonwebtoken');
require('dotenv').config();

const SECRET = process.env.JWT_SECRET || 'pharmix_fallback_secret_2026';

const generateToken = (userPayload) => {
  // Token stored in localStorage containing: user info, role, linked entities
  return jwt.sign(userPayload, SECRET, { expiresIn: '7d' });
};

const verifyToken = (token) => {
  return jwt.verify(token, SECRET);
};

module.exports = { generateToken, verifyToken };
