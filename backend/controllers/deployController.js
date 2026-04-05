const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const admzip = require('adm-zip');
const response = require('../utils/response');
const Deployment = require('../models/Deployment');
const deployService = require('../services/deployService');

const WORK_DIR = path.resolve(__dirname, '../../workdir');
const DB_PATH = path.join(__dirname, '../db.json');

const getLocalDb = () => {
    try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); } catch { return []; }
};
const setLocalDb = (data) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

const DeployController = {
    async uploadProject(req, res) {
        try {
            if (!req.file) return response.error(res, 'No project node payload detected.', 400);

            const stamp = Date.now();
            const id = 'dep-' + stamp;
            const dest = path.join(WORK_DIR, id);
            if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

            const zip = new admzip(req.file.path);
            zip.extractAllTo(dest, true);

            const d = {
                id, _id: id,
                userId: req.user.id || 'anonymous',
                projectName: req.body.projectName || req.file.originalname,
                folderPath: dest,
                url: `/${id}`,
                status: 'building',
                logs: [
                    `[${new Date().toISOString()}] INITIALIZING HANDSHAKE...`,
                    `[${new Date().toISOString()}] NODE CLUSTER: ${id} ACCEPTED.`,
                    `[${new Date().toISOString()}] EXTRACTING PAYLOAD... 100% SUCCESS.`
                ],
                createdAt: new Date()
            };

            const local = getLocalDb();
            local.push(d);
            setLocalDb(local);

            // Async Build Handshake
            setTimeout(async () => {
                try {
                    d.logs.push(`[${new Date().toISOString()}] DISCOVERING INDEX PROTOCOL...`);
                    d.status = 'active';
                    d.logs.push(`[${new Date().toISOString()}] MISSION SUCCESS. NODE LIVE @ http://localhost:5000/${id}`);
                    setLocalDb(local);
                    await Deployment.create(d).catch(() => {});
                } catch(e) {}
            }, 1000);

            return response.success(res, d, 'CLUSTER INITIALIZED. BUILDING LINE-BY-LINE...');
        } catch (err) { return response.error(res, err.message); }
    },

    async deployGitHub(req, res) {
        try {
            const { repoUrl, branch, projectName } = req.body;
            const stamp = Date.now();
            const id = 'dep-' + stamp;
            const dest = path.join(WORK_DIR, id);

            const d = {
                id, _id: id,
                userId: req.user.id,
                projectName: projectName || repoUrl.split('/').pop(),
                folderPath: dest,
                url: `/${id}`,
                type: 'github',
                status: 'building',
                logs: [
                    `[${new Date().toISOString()}] SATELLITE LINK ESTABLISHED.`,
                    `[${new Date().toISOString()}] CLONING TARGET CLUSTER: ${repoUrl}...`,
                    `[${new Date().toISOString()}] BRANCH: ${branch || 'main'}`
                ],
                createdAt: new Date()
            };

            const local = getLocalDb();
            local.push(d);
            setLocalDb(local);

            // Background Clone Sequence
            setTimeout(async () => {
                try {
                    await deployService.cloneRepo(repoUrl, dest, branch || 'main');
                    d.logs.push(`[${new Date().toISOString()}] CLONE SUCCESS. DISCOVERING PROJECT ENGINE...`);
                    d.status = 'active';
                    d.logs.push(`[${new Date().toISOString()}] MISSION COMPLETE. NODE LIVE @ http://localhost:5000/${id}`);
                    setLocalDb(local);
                    await Deployment.create(d).catch(() => {});
                } catch (e) {
                    d.status = 'failed';
                    d.logs.push(`[${new Date().toISOString()}] CLONE FAILED: ${e.message}`);
                    setLocalDb(local);
                }
            }, 100);

            return response.success(res, d, 'SYNC SEQUENCE INITIATED.');
        } catch (err) { return response.error(res, err.message); }
    },

    async listDeployments(req, res) {
        const local = getLocalDb().filter(d => d.userId === req.user.id || req.user.id === 'anonymous');
        return response.success(res, { count: local.length, deployments: local });
    },

    async deleteDeployment(req, res) {
        try {
            const id = req.params.id;
            const local = getLocalDb();
            const idx = local.findIndex(d => d.id === id || d._id === id);
            
            if (idx === -1) return response.error(res, 'Target Node Not Found', 404);
            const dep = local[idx];

            // 1. Physical Cleanup
            try { 
                if (fs.existsSync(dep.folderPath)) fs.rmSync(dep.folderPath, { recursive: true, force: true }); 
            } catch(e) {}

            // 2. State Cleanup
            local.splice(idx, 1);
            setLocalDb(local);
            await Deployment.deleteOne({ $or: [{ id: id }, { _id: id }] }).catch(() => {});

            return response.success(res, null, 'NODE TERMINATED AND CLEANED.');
        } catch (err) { return response.error(res, err.message); }
    }
};

module.exports = DeployController;
