const mongoose = require('mongoose');

const DeploymentSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    id: { type: String, required: true, unique: true }, // Custom dep-XXXX id
    projectName: { type: String, required: true },
    folderPath: { type: String, required: true },
    url: { type: String },
    type: { type: String, enum: ['static', 'node', 'github'], default: 'static' },
    status: { type: String, enum: ['active', 'building', 'failed'], default: 'active' },
    logs: [{ type: String }], // Line-by-line build logs
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Deployment', DeploymentSchema);
