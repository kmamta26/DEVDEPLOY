const CryptoJS = require('crypto-js');
const { EC2Client, RunInstancesCommand, DescribeInstancesCommand, StartInstancesCommand, StopInstancesCommand, TerminateInstancesCommand } = require('@aws-sdk/client-ec2');
const { S3Client, CreateBucketCommand, ListBucketsCommand } = require('@aws-sdk/client-s3');

// Encryption Logic
const SECRET_KEY = process.env.JWT_SECRET || 'devdeploy_super_secret_key_2024';

function encrypt(text) {
  return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
}

function decrypt(ciphertext) {
  const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

// AWS Client Factory
function getEC2Client(credentials, region = 'us-east-1') {
  return new EC2Client({
    region,
    credentials: {
      accessKeyId: decrypt(credentials.accessKeyId),
      secretAccessKey: decrypt(credentials.secretAccessKey)
    }
  });
}

function getS3Client(credentials, region = 'us-east-1') {
  return new S3Client({
    region,
    credentials: {
      accessKeyId: decrypt(credentials.accessKeyId),
      secretAccessKey: decrypt(credentials.secretAccessKey)
    }
  });
}

/**
 * --- EC2 CONTROL HELPERS ---
 */

async function listInstances(credentials, region) {
  const client = getEC2Client(credentials, region);
  const command = new DescribeInstancesCommand({});
  const result = await client.send(command);
  
  const instances = [];
  result.Reservations.forEach(res => {
    res.Instances.forEach(ins => {
      instances.push({
        InstanceId: ins.InstanceId,
        InstanceType: ins.InstanceType,
        PublicIp: ins.PublicIpAddress,
        State: ins.State.Name,
        Name: ins.Tags?.find(t => t.Key === 'Name')?.Value || '-',
        LaunchTime: ins.LaunchTime
      });
    });
  });
  return instances;
}

async function createInstance(credentials, region, { type, ami, name }) {
  const client = getEC2Client(credentials, region);
  const command = new RunInstancesCommand({
    MaxCount: 1,
    MinCount: 1,
    ImageId: ami || 'ami-0c55b159cbfafe1f0', // Amazon Linux 2 (example)
    InstanceType: type || 't2.micro',
    TagSpecifications: [{
      ResourceType: 'instance',
      Tags: [{ Key: 'Name', Value: name || `devdeploy-${Date.now()}` }]
    }]
  });
  const result = await client.send(command);
  return result.Instances[0];
}

async function startInstance(credentials, region, instanceId) {
  const client = getEC2Client(credentials, region);
  const command = new StartInstancesCommand({ InstanceIds: [instanceId] });
  return await client.send(command);
}

async function stopInstance(credentials, region, instanceId) {
  const client = getEC2Client(credentials, region);
  const command = new StopInstancesCommand({ InstanceIds: [instanceId] });
  return await client.send(command);
}

async function terminateInstance(credentials, region, instanceId) {
  const client = getEC2Client(credentials, region);
  const command = new TerminateInstancesCommand({ InstanceIds: [instanceId] });
  return await client.send(command);
}

module.exports = {
  encrypt,
  decrypt,
  listInstances,
  createInstance,
  startInstance,
  stopInstance,
  terminateInstance,
  // S3 (placeholder)
  getS3Client
};
