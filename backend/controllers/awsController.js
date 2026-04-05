const User       = require('../models/User');
const Deployment = require('../models/Deployment');
const { encrypt }   = require('../utils/crypto');
const awsService    = require('../services/awsService');
const response      = require('../utils/response');

/**
 * POST /api/aws/connect
 * Validate AWS credentials against the real AWS API, then save encrypted.
 * Body: { accessKeyId, secretAccessKey, region }
 */
async function connectAws(req, res) {
  try {
    const { accessKeyId, secretAccessKey, region = 'us-east-1' } = req.body;

    if (!accessKeyId || !secretAccessKey) {
      return response.badRequest(res, 'AWS Access Key ID and Secret Access Key are required');
    }
    if (typeof accessKeyId !== 'string' || accessKeyId.length < 16) {
      return response.badRequest(res, 'Invalid AWS Access Key ID format');
    }

    // Validate credentials against real AWS API before storing
    try {
      await awsService.validateCredentials({ accessKeyId, secretAccessKey, region });
    } catch (err) {
      // Surface auth errors clearly
      const isAuthErr = err.name === 'InvalidClientTokenId'
        || err.name === 'AuthFailure'
        || err.message?.includes('credentials');
      return response.badRequest(
        res,
        isAuthErr
          ? 'AWS credentials are invalid. Check your Access Key ID and Secret.'
          : `AWS validation failed: ${err.message}`
      );
    }

    // Encrypt and persist
    await User.findByIdAndUpdate(req.user.id, {
      'aws.accessKeyId':     encrypt(accessKeyId),
      'aws.secretAccessKey': encrypt(secretAccessKey),
      'aws.region':          region,
      'aws.connectedAt':     new Date()
    });

    return response.success(res, {
      region,
      connectedAt: new Date()
    }, 'AWS credentials connected and verified successfully');
  } catch (err) {
    return response.error(res, 'Failed to connect AWS', 500, err.message);
  }
}

/**
 * GET /api/aws/status
 * Check if AWS is connected for the current user.
 */
async function getAwsStatus(req, res) {
  try {
    const user = await User.findById(req.user.id);
    if (!user?.isAwsConnected()) {
      return response.success(res, { connected: false });
    }
    return response.success(res, {
      connected:   true,
      region:      user.aws.region,
      connectedAt: user.aws.connectedAt
    });
  } catch (err) {
    return response.error(res, 'Failed to fetch AWS status', 500, err.message);
  }
}

/**
 * GET /api/aws/instances
 * List all EC2 instances for this account.
 */
async function listInstances(req, res) {
  try {
    const user = await User.findById(req.user.id).select('+aws.accessKeyId +aws.secretAccessKey');
    if (!user?.isAwsConnected()) {
      return response.badRequest(res, 'AWS is not connected. Connect first via POST /api/aws/connect');
    }

    const instances = await awsService.listInstances(user.aws);

    return response.success(res, { count: instances.length, instances });
  } catch (err) {
    return response.error(res, 'Failed to fetch EC2 instances', 500, err.message);
  }
}

/**
 * POST /api/aws/instances
 * Create (launch) a new EC2 instance.
 * Body: { instanceType?, ami?, name?, keyName?, securityGroupIds? }
 */
async function createInstance(req, res) {
  try {
    const user = await User.findById(req.user.id).select('+aws.accessKeyId +aws.secretAccessKey');
    if (!user?.isAwsConnected()) {
      return response.badRequest(res, 'AWS is not connected');
    }

    const { instanceType, ami, name, keyName, securityGroupIds } = req.body;

    const instance = await awsService.createInstance(user.aws, {
      instanceType,
      ami,
      name: name || `devdeploy-${Date.now()}`,
      keyName,
      securityGroupIds
    });

    return response.created(res, { instance }, 'EC2 instance launch initiated');
  } catch (err) {
    return response.error(res, 'Failed to create EC2 instance', 500, err.message);
  }
}

/**
 * POST /api/aws/instances/:instanceId/start
 */
async function startInstance(req, res) {
  try {
    const user = await User.findById(req.user.id).select('+aws.accessKeyId +aws.secretAccessKey');
    if (!user?.isAwsConnected()) return response.badRequest(res, 'AWS not connected');

    const result = await awsService.startInstance(user.aws, req.params.instanceId);
    return response.success(res, result, 'Instance start initiated');
  } catch (err) {
    return response.error(res, 'Failed to start instance', 500, err.message);
  }
}

/**
 * POST /api/aws/instances/:instanceId/stop
 */
async function stopInstance(req, res) {
  try {
    const user = await User.findById(req.user.id).select('+aws.accessKeyId +aws.secretAccessKey');
    if (!user?.isAwsConnected()) return response.badRequest(res, 'AWS not connected');

    const result = await awsService.stopInstance(user.aws, req.params.instanceId);
    return response.success(res, result, 'Instance stop initiated');
  } catch (err) {
    return response.error(res, 'Failed to stop instance', 500, err.message);
  }
}

/**
 * DELETE /api/aws/instances/:instanceId
 */
async function terminateInstance(req, res) {
  try {
    const user = await User.findById(req.user.id).select('+aws.accessKeyId +aws.secretAccessKey');
    if (!user?.isAwsConnected()) return response.badRequest(res, 'AWS not connected');

    const result = await awsService.terminateInstance(user.aws, req.params.instanceId);
    return response.success(res, result, 'Instance termination initiated');
  } catch (err) {
    return response.error(res, 'Failed to terminate instance', 500, err.message);
  }
}

/**
 * DELETE /api/aws/disconnect
 * Remove stored AWS credentials.
 */
async function disconnectAws(req, res) {
  try {
    await User.findByIdAndUpdate(req.user.id, { $unset: { aws: '' } });
    return response.success(res, null, 'AWS credentials removed');
  } catch (err) {
    return response.error(res, 'Failed to disconnect AWS', 500, err.message);
  }
}

module.exports = {
  connectAws,
  getAwsStatus,
  listInstances,
  createInstance,
  startInstance,
  stopInstance,
  terminateInstance,
  disconnectAws
};
