const User          = require('../models/User');
const { encrypt }   = require('../utils/crypto');
const githubService = require('../services/githubService');
const response      = require('../utils/response');

/**
 * POST /api/github/connect
 * Validate a GitHub PAT, store it encrypted, save the GitHub username.
 * Body: { token }
 */
async function connectGithub(req, res) {
  try {
    const { token } = req.body;
    if (!token || typeof token !== 'string' || token.trim() === '') {
      return response.badRequest(res, 'GitHub Personal Access Token is required');
    }

    // 1. Validate with GitHub API before storing anything
    let ghUser;
    try {
      ghUser = await githubService.validateToken(token.trim());
    } catch (err) {
      return response.badRequest(res, err.message);
    }

    // 2. Encrypt and save to user document
    const encryptedToken = encrypt(token.trim());
    await User.findByIdAndUpdate(req.user.id, {
      'github.token':       encryptedToken,
      'github.username':    ghUser.login,
      'github.connectedAt': new Date()
    });

    return response.success(res, {
      githubUsername: ghUser.login,
      name:           ghUser.name,
      avatarUrl:      ghUser.avatar_url,
      publicRepos:    ghUser.public_repos,
      profileUrl:     ghUser.html_url,
      connectedAt:    new Date()
    }, `GitHub account @${ghUser.login} connected successfully`);
  } catch (err) {
    return response.error(res, 'Failed to connect GitHub', 500, err.message);
  }
}

/**
 * GET /api/github/repos
 * Fetch the authenticated user's repositories from GitHub.
 * Query: ?sort=updated&visibility=all&perPage=50
 */
async function getRepos(req, res) {
  try {
    // Load user with the encrypted token
    const user = await User.findById(req.user.id).select('+github.token');
    if (!user || !user.github?.token) {
      return response.badRequest(res, 'GitHub is not connected. Please connect GitHub first via POST /api/github/connect');
    }

    const { sort = 'updated', visibility = 'all', perPage = 50 } = req.query;

    const repos = await githubService.fetchUserRepos(user.github.token, {
      sort,
      visibility,
      perPage: Math.min(Number(perPage) || 50, 100)
    });

    return response.success(res, { count: repos.length, repos }, 'Repositories fetched successfully');
  } catch (err) {
    // Surface GitHub API errors nicely
    if (err.response?.status === 401) {
      return response.unauthorized(res, 'GitHub token has expired or been revoked. Please reconnect.');
    }
    return response.error(res, 'Failed to fetch repositories', 500, err.message);
  }
}

/**
 * GET /api/github/repos/:owner/:repo/branches
 * Fetch available branches for a specific repository.
 */
async function getRepoBranches(req, res) {
  try {
    const user = await User.findById(req.user.id).select('+github.token');
    if (!user?.github?.token) {
      return response.badRequest(res, 'GitHub is not connected');
    }

    const fullName = `${req.params.owner}/${req.params.repo}`;
    const branches = await githubService.fetchRepoBranches(user.github.token, fullName);

    return response.success(res, { fullName, branches });
  } catch (err) {
    return response.error(res, 'Failed to fetch branches', 500, err.message);
  }
}

/**
 * DELETE /api/github/disconnect
 * Remove stored GitHub credentials.
 */
async function disconnectGithub(req, res) {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      $unset: { github: '' }
    });
    return response.success(res, null, 'GitHub account disconnected');
  } catch (err) {
    return response.error(res, 'Failed to disconnect GitHub', 500, err.message);
  }
}

module.exports = { connectGithub, getRepos, getRepoBranches, disconnectGithub };
