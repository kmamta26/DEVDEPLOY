const express = require('express');
const router  = express.Router();
const { handleGithubWebhook } = require('../controllers/webhookController');

/**
 * Webhook Routes
 * Base path: /api/webhooks
 *
 * These routes do NOT use the auth middleware — GitHub calls them directly.
 * Security is enforced via HMAC-SHA256 signature verification in the controller.
 */

// POST /api/webhooks/github — GitHub push event receiver
router.post('/github', handleGithubWebhook);

module.exports = router;
