const express = require('express');
const router  = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const auth = require('../middleware/auth');

/**
 * Auth Routes
 * Base path: /api/auth
 */

// POST /api/auth/register  — Create new account
router.post('/register', register);

// POST /api/auth/login     — Authenticate and get JWT
router.post('/login', login);

// GET  /api/auth/me        — Get current user info (protected)
router.get('/me', auth, getMe);

module.exports = router;
