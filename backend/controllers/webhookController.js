const crypto     = require('crypto');
const Deployment = require('../models/Deployment');
const response   = require('../utils/response');

const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || '';

/**
 * POST /api/webhooks/github
 * Receives GitHub push events and triggers automatic re-deployment (Phase 3 CI/CD).
 *
 * Setup: In your GitHub repo → Settings → Webhooks → Add webhook
 *   Payload URL: https://your-server/api/webhooks/github
 *   Content type: application/json
 *   Secret: GITHUB_WEBHOOK_SECRET value from your .env
 *   Events: Push events
 */
async function handleGithubWebhook(req, res) {
  try {
    // 1. Verify HMAC-SHA256 signature (if secret is configured)
    if (WEBHOOK_SECRET) {
      const signature = req.headers['x-hub-signature-256'];
      if (!signature) {
        return response.unauthorized(res, 'Missing X-Hub-Signature-256 header');
      }

      const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
      // Note: body must be the raw buffer for HMAC to match (bodyParser.raw is used in router)
      hmac.update(req.rawBody || JSON.stringify(req.body));
      const expectedSig = `sha256=${hmac.digest('hex')}`;

      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
        return response.unauthorized(res, 'Invalid webhook signature');
      }
    }

    // 2. Only handle 'push' events — ignore others gracefully
    const event = req.headers['x-github-event'];
    if (event !== 'push') {
      return response.success(res, null, `Event "${event}" acknowledged but ignored (not a push)`);
    }

    // 3. Extract repo info from payload
    const payload  = req.body;
    const repoFullName = payload.repository?.full_name;
    const branch       = payload.ref?.replace('refs/heads/', '');

    if (!repoFullName) {
      return response.badRequest(res, 'Missing repository info in webhook payload');
    }

    console.log(`[Webhook] Push received: ${repoFullName} (${branch})`);

    // 4. Find all deployments linked to this repo + branch
    const deployments = await Deployment.find({
      'githubRepo.fullName': repoFullName,
      ...(branch ? { 'githubRepo.branch': branch } : {})
    });

    if (deployments.length === 0) {
      return response.success(res, null, `No deployments linked to ${repoFullName}`);
    }

    console.log(`[Webhook] Triggering redeploy for ${deployments.length} deployment(s)`);

    // 5. Trigger re-deployment for each matched deployment (async)
    const { redeploy } = require('./deployController');
    const triggers = [];

    for (const dep of deployments) {
      dep.updateStatus('pending', `Auto-triggered by GitHub push on branch "${branch}"`);
      dep.lastTriggeredAt = new Date();
      await dep.save();

      // Reuse internal pipeline trigger (without the HTTP response object)
      triggers.push(
        _triggerRedeployInternal(dep).catch((err) =>
          console.error(`[Webhook] Redeploy failed for ${dep.name}:`, err.message)
        )
      );
    }

    // Run all in parallel
    Promise.all(triggers);

    return response.success(res, {
      triggered: deployments.map((d) => ({ id: d._id, name: d.name }))
    }, `Redeployment triggered for ${deployments.length} project(s)`);

  } catch (err) {
    console.error('[Webhook] Handler error:', err);
    return response.error(res, 'Webhook processing failed', 500, err.message);
  }
}

/**
 * Internal: trigger the deploy pipeline without an HTTP request (for webhook use).
 * Requires the deployController to export the internal pipeline.
 */
async function _triggerRedeployInternal(deployment) {
  // Circular — import lazily to avoid issues
  const deployService = require('../services/deployService');

  deployService.cleanupDir(deployment.localPath);

  deployment.buildLog = [];
  deployment.status = 'pending';
  await deployment.save();

  const { _runDeployPipelinePublic } = require('./deployController');
  if (typeof _runDeployPipelinePublic === 'function') {
    return _runDeployPipelinePublic(deployment);
  }

  console.warn('[Webhook] _runDeployPipelinePublic not exported — manual redeploy needed');
}

module.exports = { handleGithubWebhook };
