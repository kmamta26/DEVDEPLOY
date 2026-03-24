const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const AdmZip = require('adm-zip');

const auth = require('../middleware/auth');
const Project = require('../models/Project');
const { validateZip } = require('../utils/zipValidator');
const { getNextFreePort } = require('../utils/portManager');
const { buildImage, runContainer, removeContainer } = require('../utils/dockerManager');
const nginxManager = require('../utils/nginxManager');

const WORK_DIR = process.env.WORK_DIR || path.join(__dirname, '../../workdir');

// Ensure work directory exists
if (!fs.existsSync(WORK_DIR)) fs.mkdirSync(WORK_DIR, { recursive: true });

// Multer config — 100 MB max
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, WORK_DIR),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/zip' || file.mimetype === 'application/x-zip-compressed' || file.originalname.endsWith('.zip')) {
      cb(null, true);
    } else {
      cb(new Error('Only .zip files are allowed'), false);
    }
  }
});

/**
 * POST /api/deploy
 * Upload a ZIP and start an asynchronous deployment.
 */
router.post('/deploy', auth, upload.single('projectFile'), async (req, res) => {
  try {
    const { projectName, githubUrl } = req.body;

    if (!req.file) {
      return res.status(400).json({ msg: 'Please upload a .zip file' });
    }
    if (!projectName) {
      return res.status(400).json({ msg: 'Project name is required' });
    }

    const safeProjectName = projectName.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase();
    if (!safeProjectName || safeProjectName.length < 2) {
      return res.status(400).json({ msg: 'Project name must be at least 2 alphanumeric characters' });
    }

    // Extract repo name if valid githubUrl is provided
    let githubRepo = null;
    if (githubUrl) {
      const match = githubUrl.match(/github\.com\/([^/]+\/[^/.]+)/);
      if (match) githubRepo = match[1].toLowerCase();
    }

    // Uniqueness check
    if (mongoose.connection.readyState === 1) {
      const existing = await Project.findOne({ name: safeProjectName });
      if (existing) {
        return res.status(400).json({ msg: 'Project name already in use. Choose another.' });
      }
    } else {
      // Legacy uniqueness check
      const DB_FILE = path.join(__dirname, '../db.json');
      if (fs.existsSync(DB_FILE)) {
        const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
        const existing = db.projects?.find(p => p.name === safeProjectName);
        if (existing) return res.status(400).json({ msg: 'Project name already in use. Choose another.' });
      }
    }

    // Validate ZIP contents
    const validation = validateZip(req.file.path);
    if (!validation.valid) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ msg: `Invalid ZIP: ${validation.error}` });
    }

    // Extract
    const projId = crypto.randomBytes(6).toString('hex');
    const extractDir = path.join(WORK_DIR, `${safeProjectName}-${projId}`);
    const zip = new AdmZip(req.file.path);
    zip.extractAllTo(extractDir, true);

    // Clean up zip file
    fs.unlinkSync(req.file.path);

    // Allocate port (for future docker use)
    const port = await getNextFreePort();
    const hostIp = process.env.HOST_IP || 'localhost';
    
    // Link to the local preview engine on port 5000 for the demo
    const url = `http://${hostIp}:5000/${safeProjectName}/`;

    // Save project record
    if (mongoose.connection.readyState === 1) {
      const project = new Project({
        name: safeProjectName,
        userId: req.user.id,
        port,
        url,
        githubRepo,
        githubUrl,
        status: 'deploying'
      });
      await project.save();
      // Kick off async deploy pipeline
      deployPipeline(project, extractDir, safeProjectName, port)
        .catch(err => console.error('[Deploy] Pipeline error:', err));
      return res.json({ msg: 'Deployment started (Mongo)', project });
    } else {
      // --- LEGACY OFFLINE SAVE (Linked) ---
      const DB_FILE = path.join(__dirname, '../db.json');
      let db = { projects: [], nextPort: 8000 };
      if (fs.existsSync(DB_FILE)) db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      
      const project = {
        _id: Date.now().toString(),
        name: safeProjectName,
        userId: req.user.id,
        port,
        url,
        githubRepo,
        githubUrl,
        status: 'deploying'
      };
      db.projects.push(project);
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));

      // Kick off async deploy pipeline (Linked)
      deployPipeline(project, extractDir, safeProjectName, port)
        .catch(err => console.error('[Deploy] Offline Pipeline error:', err));

      return res.json({ msg: 'Deployment started (Offline Mode)', project });
    }
  } catch (err) {
    console.error('[Deploy] Error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

/**
 * GET /api/projects
 * List all projects for the authenticated user.
 */
router.get('/projects', auth, async (req, res) => {
  try {
    // If MongoDB is available, use it
    if (mongoose.connection.readyState === 1) {
      const projects = await Project.find({ userId: req.user.id }).sort('-createdAt');
      return res.json(projects);
    }

    // --- LEGACY FALLBACK (Linked mode) ---
    const DB_FILE = path.join(__dirname, '../db.json');
    if (fs.existsSync(DB_FILE)) {
      const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      const projects = db.projects || [];
      
      // Self-healing: If folder exists, it is "running" (Linked)
      const folders = fs.readdirSync(WORK_DIR);
      projects.forEach(p => {
          const exists = folders.some(f => f.startsWith(p.name + '-'));
          if (exists) p.status = 'running';
      });
      
      return res.json(projects);
    }
    
    res.json([]);
  } catch (err) {
    console.error('[Projects] Fetch error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * DELETE /api/projects/:id
 * Remove a deployed project: stop container, delete NGINX config, delete DB record.
 */
router.delete('/projects/:id', auth, async (req, res) => {
  try {
    let projectName = '';

    // If MongoDB is available, use it
    if (mongoose.connection.readyState === 1) {
      const project = await Project.findOne({ _id: req.params.id, userId: req.user.id });
      if (project) {
        projectName = project.name;
        // Tear down containers (if any)
        try { await removeContainer(`container-${projectName}`); } catch (_) {}
        nginxManager.removeProjectConfig(projectName);
        await Project.deleteOne({ _id: project._id });
      }
    } else {
      // --- LEGACY FALLBACK DELETE (Linked) ---
      const DB_FILE = path.join(__dirname, '../db.json');
      if (fs.existsSync(DB_FILE)) {
        const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
        const idx = db.projects?.findIndex(p => {
          const pid = p._id || p.id;
          return pid && pid.toString() === req.params.id.toString();
        });
        if (idx !== -1) {
          projectName = db.projects[idx].name;
          db.projects.splice(idx, 1);
          fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
          // Still try to cleanup configs
          nginxManager.removeProjectConfig(projectName);
          console.log(`[Delete] Found and removed ${projectName} from db.json`);
        } else {
          console.warn(`[Delete] Project with ID ${req.params.id} not found in db.json`);
        }
      }
    }

    // Cleanup physical files (The 'Unified' cleanup)
    if (projectName) {
      const folders = fs.readdirSync(WORK_DIR);
      const projectFolders = folders.filter(f => f.startsWith(projectName + '-'));
      projectFolders.forEach(f => {
        try { fs.rmSync(path.join(WORK_DIR, f), { recursive: true, force: true }); } catch (_) {}
      });
    }

    res.json({ msg: 'Project deleted and files wiped clean.' });
  } catch (err) {
    console.error('[Projects] Delete error:', err);
    res.status(500).json({ msg: 'Server error during deletion.' });
  }
});

// ---- Internal deployment pipeline ----
async function deployPipeline(project, projectDir, name, port) {
  try {
    // 1. Detect project type
    const hasPackageJson = fs.existsSync(path.join(projectDir, 'package.json'));
    const containerPort = hasPackageJson ? 3000 : 80;

    // 2. Generate Dockerfile
    let dockerfile;
    if (hasPackageJson) {
      dockerfile = `FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]`;
    } else {
      dockerfile = `FROM nginx:alpine
RUN rm -rf /usr/share/nginx/html/*
COPY . /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]`;
    }
    fs.writeFileSync(path.join(projectDir, 'Dockerfile'), dockerfile);

    // 3. Build Docker image
    const imageName = `devdeploy-${name}`;
    await buildImage(imageName, projectDir);

    // 4. Run container
    const containerName = `container-${name}`;
    await runContainer(containerName, imageName, port, containerPort);

    // 5. Write NGINX config
    nginxManager.writeProjectConfig(name, port);

    // 6. Reload NGINX (only on Linux w/ systemd)
    try { await nginxManager.reload(); } catch (_) {
      console.log('[Deploy] NGINX reload skipped (may not be on Linux).');
    }

    // 5. Cleanup
    fs.rmSync(extractDir, { recursive: true, force: true });

    // 6. Update status (Linked)
    project.status = 'running';
    if (mongoose.connection.readyState === 1 && typeof project.save === 'function') {
      await project.save();
    } else {
      // Offline fallback update
      const DB_FILE = path.join(__dirname, '../db.json');
      const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      const idx = db.projects.findIndex(p => p._id === (project._id || project._id.toString()));
      if (idx !== -1) {
        db.projects[idx].status = 'running';
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
      }
    }
    console.log(`[Deploy] ✅ ${name} is live at ${project.url}`);
  } catch (err) {
    console.error('[DeployPipeline] Fatal:', err);
    project.status = 'failed';
    if (mongoose.connection.readyState === 1 && typeof project.save === 'function') {
      await project.save();
    } else {
       // Offline fallback failure
       const DB_FILE = path.join(__dirname, '../db.json');
       const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
       const idx = db.projects.findIndex(p => p._id === (project._id || project._id.toString()));
       if (idx !== -1) {
         db.projects[idx].status = 'failed';
         fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
       }
    }
  }
}

module.exports = router;
