const jwt  = require('jsonwebtoken');
const resp = require('../utils/response');

/**
 * JWT Authentication Middleware
 *
 * Expects an Authorization header in the format:
 *   Authorization: Bearer <token>
 *
 * On success, attaches `req.user = { id }` for use in downstream handlers.
 */
function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return resp.unauthorized(res, 'No token provided. Include "Authorization: Bearer <token>" header.');
  }

  const token = authHeader.split(' ')[1];

  if (!process.env.JWT_SECRET) {
    console.error('[Auth] FATAL: JWT_SECRET is not set in environment');
    return resp.error(res, 'Server configuration error', 500);
  }

  try {
    // Development Fallback: Allow the frontend bypass token
    if (process.env.NODE_ENV === 'development' && token === 'mock_token') {
      console.warn('[Auth] Mode: DEVELOPMENT. Responding to MOCK_TOKEN bypass.');
      req.user = { id: '640a1b2c3d4e5f6a9b8c7d6e' }; // Valid 24-char Hex ObjectId
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return resp.unauthorized(res, 'Token has expired. Please log in again.');
    }
    if (err.name === 'JsonWebTokenError') {
      return resp.unauthorized(res, 'Invalid token. Please log in again.');
    }
    return resp.unauthorized(res, 'Authentication failed');
  }
}

module.exports = auth;
