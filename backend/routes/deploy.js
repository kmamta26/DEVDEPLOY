const express = require('express');
const router  = express.Router();
const auth = require('../middleware/auth');
const DeployController = require('../controllers/deployController');

/**
 * Main Deployment Interface
 * Synchronized with High-Resiliency Controller v3.11
 */

// Deployment Root
router.get('/', auth, (req, res) => DeployController.listDeployments(req, res));
router.delete('/:id', auth, (req, res) => DeployController.deleteDeployment(req, res));

// ZIP Upload Path
router.post('/upload', auth, (req, res) => DeployController.uploadProject(req, res));

// Secondary Logic (Compatibility)
router.post('/deploy', auth, (req, res) => DeployController.deployGitHub(req, res));

module.exports = router;
