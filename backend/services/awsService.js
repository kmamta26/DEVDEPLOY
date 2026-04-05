const {
  EC2Client,
  RunInstancesCommand,
  DescribeInstancesCommand,
  StartInstancesCommand,
  StopInstancesCommand,
  TerminateInstancesCommand,
  DescribeInstanceStatusCommand
} = require('@aws-sdk/client-ec2');
const { decrypt } = require('../utils/crypto');

// Safe defaults
const DEFAULT_REGION = 'us-east-1';
// Amazon Linux 2023 AMI (us-east-1) — update per region if needed
const DEFAULT_AMI    = 'ami-0c101f26f147fa7fd';
const DEFAULT_TYPE   = 't2.micro';

/**
 * Build a live EC2Client from an encrypted credential object.
 * The credential object can be a Mongoose document or a plain object.
 * @param {object} creds - { accessKeyId (encrypted), secretAccessKey (encrypted), region }
 * @returns {EC2Client}
 */
function buildEC2Client(creds) {
  const region = creds.region || DEFAULT_REGION;
  return new EC2Client({
    region,
    credentials: {
      accessKeyId:     decrypt(creds.accessKeyId),
      secretAccessKey: decrypt(creds.secretAccessKey)
    }
  });
}

/**
 * Validate AWS credentials by attempting a lightweight describe call.
 * @param {object} rawCreds - { accessKeyId, secretAccessKey, region } — all plain-text
 * @returns {Promise<void>} Throws if credentials are invalid
 */
async function validateCredentials(rawCreds) {
  const client = new EC2Client({
    region: rawCreds.region || DEFAULT_REGION,
    credentials: {
      accessKeyId:     rawCreds.accessKeyId,
      secretAccessKey: rawCreds.secretAccessKey
    }
  });

  // The cheapest EC2 API call — describe status (no instances = empty result, not an error)
  await client.send(new DescribeInstanceStatusCommand({ MaxResults: 5 }));
}

/**
 * List all EC2 instances for this AWS account.
 * @param {object} encryptedCreds
 * @returns {Promise<Array>}
 */
async function listInstances(encryptedCreds) {
  const client = buildEC2Client(encryptedCreds);
  const result = await client.send(new DescribeInstancesCommand({}));

  const instances = [];
  for (const reservation of result.Reservations || []) {
    for (const inst of reservation.Instances || []) {
      instances.push({
        instanceId:   inst.InstanceId,
        instanceType: inst.InstanceType,
        state:        inst.State?.Name,
        publicIp:     inst.PublicIpAddress || null,
        privateIp:    inst.PrivateIpAddress || null,
        launchTime:   inst.LaunchTime,
        name:         inst.Tags?.find((t) => t.Key === 'Name')?.Value || '(unnamed)',
        az:           inst.Placement?.AvailabilityZone
      });
    }
  }
  return instances;
}

/**
 * Launch a new EC2 instance.
 * @param {object} encryptedCreds
 * @param {object} opts
 * @param {string} [opts.instanceType]
 * @param {string} [opts.ami]
 * @param {string} [opts.name]
 * @param {string} [opts.keyName]   - EC2 KeyPair name (optional)
 * @param {string[]} [opts.securityGroupIds]
 * @returns {Promise<object>} Basic info about the launched instance
 */
async function createInstance(encryptedCreds, opts = {}) {
  const client = buildEC2Client(encryptedCreds);

  const tagSpec = [{
    ResourceType: 'instance',
    Tags: [{ Key: 'Name', Value: opts.name || `devdeploy-${Date.now()}` }]
  }];

  const params = {
    MinCount: 1,
    MaxCount: 1,
    ImageId:      opts.ami          || DEFAULT_AMI,
    InstanceType: opts.instanceType || DEFAULT_TYPE,
    TagSpecifications: tagSpec
  };

  if (opts.keyName)          params.KeyName          = opts.keyName;
  if (opts.securityGroupIds) params.SecurityGroupIds = opts.securityGroupIds;

  const result = await client.send(new RunInstancesCommand(params));
  const inst = result.Instances[0];

  return {
    instanceId:   inst.InstanceId,
    instanceType: inst.InstanceType,
    state:        inst.State?.Name,
    launchTime:   inst.LaunchTime
  };
}

/**
 * Start a stopped EC2 instance.
 */
async function startInstance(encryptedCreds, instanceId) {
  const client = buildEC2Client(encryptedCreds);
  const result = await client.send(new StartInstancesCommand({ InstanceIds: [instanceId] }));
  return result.StartingInstances[0];
}

/**
 * Stop a running EC2 instance.
 */
async function stopInstance(encryptedCreds, instanceId) {
  const client = buildEC2Client(encryptedCreds);
  const result = await client.send(new StopInstancesCommand({ InstanceIds: [instanceId] }));
  return result.StoppingInstances[0];
}

/**
 * Terminate (permanently delete) an EC2 instance.
 */
async function terminateInstance(encryptedCreds, instanceId) {
  const client = buildEC2Client(encryptedCreds);
  const result = await client.send(new TerminateInstancesCommand({ InstanceIds: [instanceId] }));
  return result.TerminatingInstances[0];
}

module.exports = {
  validateCredentials,
  listInstances,
  createInstance,
  startInstance,
  stopInstance,
  terminateInstance
};
