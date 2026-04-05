const axios = require('axios');
const { decrypt } = require('../utils/crypto');

const GITHUB_API = 'https://api.github.com';

/**
 * Create an authenticated Axios instance for the GitHub REST API.
 * @param {string} encryptedToken - The stored encrypted PAT
 * @returns {AxiosInstance}
 */
function createGithubClient(encryptedToken) {
  const token = decrypt(encryptedToken);
  return axios.create({
    baseURL: GITHUB_API,
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    },
    timeout: 10000
  });
}

/**
 * Validate a GitHub Personal Access Token and get the authenticated user info.
 * @param {string} rawToken - Plain-text PAT
 * @returns {Promise<{login, name, avatar_url, public_repos, html_url}>}
 */
async function validateToken(rawToken) {
  try {
    const client = axios.create({
      baseURL: GITHUB_API,
      headers: {
        Authorization: `token ${rawToken}`,
        Accept: 'application/vnd.github+json'
      },
      timeout: 8000
    });
    const { data } = await client.get('/user');
    return {
      login: data.login,
      name: data.name,
      avatar_url: data.avatar_url,
      public_repos: data.public_repos,
      html_url: data.html_url
    };
  } catch (err) {
    if (err.response?.status === 401) {
      throw new Error('Invalid GitHub token — authentication failed');
    }
    throw new Error(`GitHub API error: ${err.message}`);
  }
}

/**
 * Fetch the authenticated user's repositories.
 * @param {string} encryptedToken - Stored encrypted PAT
 * @param {object} [opts]
 * @param {string} [opts.sort='updated'] - Sort field
 * @param {string} [opts.visibility='all'] - 'all' | 'public' | 'private'
 * @param {number} [opts.perPage=100] - Results per page (max 100)
 * @returns {Promise<Array>} Formatted repository list
 */
async function fetchUserRepos(encryptedToken, { sort = 'updated', visibility = 'all', perPage = 100 } = {}) {
  const client = createGithubClient(encryptedToken);

  const { data } = await client.get('/user/repos', {
    params: { sort, visibility, per_page: perPage, affiliation: 'owner,collaborator,organization_member' }
  });

  return data.map((repo) => ({
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    description: repo.description || '',
    url: repo.html_url,
    cloneUrl: repo.clone_url,
    sshUrl: repo.ssh_url,
    language: repo.language,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    isPrivate: repo.private,
    defaultBranch: repo.default_branch,
    updatedAt: repo.updated_at,
    topics: repo.topics || []
  }));
}

/**
 * Fetch branches for a specific repository.
 * @param {string} encryptedToken
 * @param {string} fullName - "owner/repo"
 * @returns {Promise<string[]>} Branch names
 */
async function fetchRepoBranches(encryptedToken, fullName) {
  const client = createGithubClient(encryptedToken);
  const { data } = await client.get(`/repos/${fullName}/branches`);
  return data.map((b) => b.name);
}

module.exports = { validateToken, fetchUserRepos, fetchRepoBranches };
