const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const {
  connectAws,
  getAwsStatus,
  listInstances,
  createInstance,
  startInstance,
  stopInstance,
  terminateInstance,
  disconnectAws
} = require('../controllers/awsController');

/**
 * AWS Integration Routes
 * Base path: /api/aws
 * All routes require authentication.
 *
 * Phase 4: AWS EC2 management
 */

// POST   /api/aws/connect                          — Connect & validate AWS credentials
router.post('/connect', auth, connectAws);

// GET    /api/aws/status                           — Check if AWS is connected
router.get('/status', auth, getAwsStatus);

// GET    /api/aws/instances                        — List all EC2 instances
router.get('/instances', auth, listInstances);

// POST   /api/aws/instances                        — Create a new EC2 instance
router.post('/instances', auth, createInstance);

// POST   /api/aws/instances/:instanceId/start      — Start a stopped instance
router.post('/instances/:instanceId/start', auth, startInstance);

// POST   /api/aws/instances/:instanceId/stop       — Stop a running instance
router.post('/instances/:instanceId/stop', auth, stopInstance);

// DELETE /api/aws/instances/:instanceId            — Terminate (permanently delete) an instance
router.delete('/instances/:instanceId', auth, terminateInstance);

// DELETE /api/aws/disconnect                       — Remove stored AWS credentials
router.delete('/disconnect', auth, disconnectAws);

module.exports = router;
