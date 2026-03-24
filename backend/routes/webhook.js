const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { exec } = require('child_process');
const Project = require('../models/Project');

const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || '';

/**
 * POST /api/webhook/github
 * GitHub webhook handler.
 * When a push event is received for a linked repo, it triggers redeployment.
 */
router.post('/github', async (req, res) => {
  try {
    // Validate signature if secret is set
    if (WEBHOOK_SECRET) {
      const sig = req.headers['x-hub-signature-256'];
      const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
      hmac.update(JSON.stringify(req.body));
      const digest = 'sha256=' + hmac.digest('hex');

      if (sig !== digest) {
        return res.status(401).json({ msg: 'Invalid signature' });
      }
    }

    const event = req.headers['x-github-event'];
    if (event !== 'push') {
      return res.status(200).json({ msg: `Ignored event: ${event}` });
    }

    const repoName = req.body.repository?.name;
    if (!repoName) {
      return res.status(400).json({ msg: 'Missing repository info' });
    }

    // Find project linked to this repo
    const project = await Project.findOne({ githubRepo: repoName });
    if (!project) {
      return res.status(404).json({ msg: `No project linked to repo: ${repoName}` });
    }

    console.log(`[Webhook] Push received for ${repoName}, triggering redeploy...`);

    // Trigger redeployment (could call the full pipeline here)
    project.status = 'deploying';
    await project.save();

    // In a real system, you would clone the repo, rebuild, and restart.
    // For now we log the intent.
    console.log(`[Webhook] Redeployment queued for project "${project.name}" (port ${project.port})`);

    res.json({ msg: 'Redeployment triggered', project: project.name });
  } catch (err) {
    console.error('[Webhook] Error:', err);
    res.status(500).json({ msg: 'Webhook processing failed' });
  }
});

module.exports = router;
