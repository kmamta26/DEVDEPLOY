const mongoose = require('mongoose');

const awsConfigSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  accessKeyId: { type: String, required: true }, // Encrypted
  secretAccessKey: { type: String, required: true }, // Encrypted
  region: { type: String, default: 'us-east-1' },
  status: { type: String, enum: ['connected', 'failed', 'not-connected'], default: 'not-connected' },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AWSConfig', awsConfigSchema);
