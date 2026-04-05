const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Model
 * Stores user credentials + linked integrations
 */
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
    },
    email: {
      type: String,
      unique: true, // Ensured unique for auto-register mode
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false // Never returned in queries by default
    },
    // Phase 1: GitHub integration
    github: {
      token: { type: String, select: false }, // encrypted PAT
      username: { type: String },
      connectedAt: { type: Date }
    },
    // Phase 4: AWS integration
    aws: {
      accessKeyId: { type: String, select: false }, // encrypted
      secretAccessKey: { type: String, select: false }, // encrypted
      region: { type: String, default: 'us-east-1' },
      connectedAt: { type: Date }
    }
  },
  {
    timestamps: true // adds createdAt + updatedAt automatically
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method: compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method: check if GitHub is connected
userSchema.methods.isGithubConnected = function () {
  return !!(this.github && this.github.token);
};

// Instance method: check if AWS is connected
userSchema.methods.isAwsConnected = function () {
  return !!(this.aws && this.aws.accessKeyId && this.aws.secretAccessKey);
};

module.exports = mongoose.model('User', userSchema);
