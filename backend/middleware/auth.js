const jwt = require('jsonwebtoken');

/**
 * Authentication middleware.
 * Validates JWT from the Authorization header.
 */
module.exports = function auth(req, res, next) {
  const header = req.header('Authorization');
  if (!header) {
    return res.status(401).json({ msg: 'No token provided, authorization denied' });
  }

  const token = header.startsWith('Bearer ') ? header.slice(7) : header;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ msg: 'Token is invalid or expired' });
  }
};
