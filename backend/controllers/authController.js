const jwt   = require('jsonwebtoken');
const response = require('../utils/response');
const authService = require('../services/authService');

const JWT_SECRET  = process.env.JWT_SECRET;
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

/**
 * Sign a JWT for a user document.
 */
function signToken(userId) {
  if (!JWT_SECRET) throw new Error('JWT_SECRET is not set in environment');
  return jwt.sign({ id: userId.toString() }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

/**
 * POST /api/auth/register
 * Create a new user account.
 */
async function register(req, res) {
  try {
    const { username, password, email } = req.body;

    if (!username || !password) {
      return response.badRequest(res, 'Username and password are required');
    }
    if (password.length < 6) {
      return response.badRequest(res, 'Password must be at least 6 characters');
    }

    const user = await authService.registerUser({ username, password, email });
    const token = signToken(user._id);

    return response.created(res, {
      token,
      user: { id: user._id, username: user.username, createdAt: user.createdAt || new Date() }
    }, 'Account created successfully');
  } catch (err) {
    console.error('[Auth] Registration Error:', err);
    return response.error(res, 'Registration failed', 500, err.message);
  }
}

/**
 * POST /api/auth/login
 * Authenticate using EMAIL ONLY (Development Bypass)
 */
async function login(req, res) {
  try {
    const { username } = req.body; // In 'Easy-Dev' mode, the 'username' field represents the email
    
    if (!username) {
      return response.badRequest(res, 'Email is required');
    }

    // Auto-Find or Auto-Create by Email
    const user = await authService.findOrCreateByEmail(username);

    // Bypassing password validation entirely for Dev Speed
    const token = signToken(user._id);

    return response.success(res, {
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        githubConnected: user.isGithubConnected ? user.isGithubConnected() : false,
        awsConnected:    user.isAwsConnected ? user.isAwsConnected() : false
      }
    }, 'Access Granted');
  } catch (err) {
    console.error('[Auth] Login Error:', err.message);
    return response.error(res, 'Station Error', 500, err.message);
  }
}

/**
 * GET /api/auth/me
 * Return current authenticated user info.
 */
async function getMe(req, res) {
  try {
    const user = await authService.getUserById(req.user.id);
    if (!user) return response.notFound(res, 'User not found');

    return response.success(res, {
      id: user._id,
      username: user.username,
      email: user.email || 'local@user.station',
      githubConnected: user.isGithubConnected(),
      githubUsername:  (user.github && user.github.username) || null,
      awsConnected:    user.isAwsConnected(),
      awsRegion:       (user.aws && user.aws.region) || 'local-host',
      createdAt:       user.createdAt || new Date()
    });
  } catch (err) {
    console.error('[Auth] getMe Error:', err);
    return response.error(res, 'Failed to fetch user', 500, err.message);
  }
}

module.exports = { register, login, getMe };
