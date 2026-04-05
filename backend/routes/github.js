const express = require('express');
const router = express.Router();
const DeployController = require('../controllers/deployController');
const auth = require('../middleware/auth');

/**
 * GitHub Interface API — Multi-Cloud Handshake v3.11
 * Synchronized with High-Resiliency Deployment Hub.
 */

// Deployment Hub
router.post('/deploy', auth, (req, res) => DeployController.deployGitHub(req, res));

// Webhook Node (GitHub CI/CD Pulse)
router.post('/webhook', (req, res) => {
    console.log('🐙 [Webhook Signal] Handshake Pulse detected from GitHub Gateway.');
    return res.json({ acknowledged: true, pulse: 'online' });
});

module.exports = router;
