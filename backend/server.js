require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const deployRoutes = require('./routes/deploy');
const webhookRoutes = require('./routes/webhook');

app.use('/api/auth', authRoutes);
app.use('/api', deployRoutes);
app.use('/api/webhook', webhookRoutes);

// --- LEGACY COMPATIBILITY ---
// Redirects for old routes
app.post('/api/register', (req, res) => res.redirect(307, '/api/auth/signup'));
app.post('/api/login', (req, res) => res.redirect(307, '/api/auth/login'));

// Shared Work Directory for previews
const WORK_DIR = process.env.WORK_DIR || path.join(__dirname, '../workdir');

// Helper to find the ACTUAL site root (where index.html is)
function findEffectiveRoot(dir) {
    if (!fs.existsSync(dir)) return null;
    const files = fs.readdirSync(dir);
    if (files.includes('index.html')) return dir;
    for (const file of files) {
        const full = path.join(dir, file);
        if (fs.statSync(full).isDirectory()) {
            const found = findEffectiveRoot(full);
            if (found) return found;
        }
    }
    return null;
}

// Global Unified Engine (Linked)
app.get('/:projectName*', (req, res, next) => {
    const projectName = req.params.projectName;
    
    // Ignore API and reserved words
    const reserved = ['api', 'auth', 'deploy', 'preview', 'projects'];
    if (reserved.includes(projectName)) return next();

    const folders = fs.readdirSync(WORK_DIR);
    
    // Find the latest modification among matchers
    const matchingFolders = folders
        .filter(f => f.startsWith(projectName + '-'))
        .map(f => ({ name: f, time: fs.statSync(path.join(WORK_DIR, f)).mtime.getTime() }))
        .sort((a, b) => b.time - a.time);

    const zipRoot = matchingFolders.length > 0 ? matchingFolders[0].name : null;
    
    if (zipRoot) {
        // --- TRAILING SLASH FIX (Ensures relative assets work) ---
        if (!req.params[0] && !req.url.endsWith('/')) {
            return res.redirect(301, `/${projectName}/`);
        }

        const siteRoot = findEffectiveRoot(path.join(WORK_DIR, zipRoot)) || path.join(WORK_DIR, zipRoot);
        const subPath = req.params[0] ? req.params[0].replace(/^\//, '') : 'index.html';
        const finalPath = path.join(siteRoot, subPath || 'index.html');
        
        if (fs.existsSync(finalPath) && !fs.statSync(finalPath).isDirectory()) {
            return res.sendFile(finalPath);
        }
    }
    next();
});

app.get('/preview/:projectName*', (req, res) => {
    const projectName = req.params.projectName;
    const folders = fs.readdirSync(WORK_DIR);
    
    // Same dynamic lookup for preview linking
    const matchingFolders = folders
        .filter(f => f.startsWith(projectName + '-'))
        .map(f => ({ name: f, time: fs.statSync(path.join(WORK_DIR, f)).mtime.getTime() }))
        .sort((a, b) => b.time - a.time);

    const zipRoot = matchingFolders.length > 0 ? matchingFolders[0].name : null;
    if (!zipRoot) return res.status(404).send('Project folder missing');
    const siteRoot = findEffectiveRoot(path.join(WORK_DIR, zipRoot)) || path.join(WORK_DIR, zipRoot);
    const subPath = req.params[0] ? req.params[0].replace(/^\//, '') : 'index.html';
    const finalPath = path.join(siteRoot, subPath);
    if (fs.existsSync(finalPath) && !fs.statSync(finalPath).isDirectory()) return res.sendFile(finalPath);
    res.status(404).send('Asset not found');
});
// ----------------------------

// Health check
app.get('/api/health', (req, res) => res.json({ 
  status: 'OK', 
  engine: 'PERFECT-LINK Smart Engine',
  db: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
}));

// --- SERVE FRONTEND (Single Link Deployment) ---
const FRONTEND_DIR = path.join(__dirname, '../frontend');
app.use(express.static(FRONTEND_DIR));

// Fallback for SPA routing
app.get('*', (req, res) => {
  const indexPath = path.join(FRONTEND_DIR, 'index.html');
  if (fs.existsSync(indexPath)) res.sendFile(indexPath);
  else res.status(404).send('Frontend not found. Ensure frontend/ directory exists.');
});
// ------------------------------------------------

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 PERFECT-LINK Unified Platform on port ${PORT}`);
  console.log(`🌍 Single Link: http://localhost:${PORT}`);
});

// Database Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/devdeploy';
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('⚠️ Running in OFFLINE mode (DB features will fail)');
  });

