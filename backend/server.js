const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const admzip = require('adm-zip');
const { execSync } = require('child_process');
const multer = require('multer');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const WORK_DIR = path.resolve(__dirname, '../workdir');
const UPLOADS_DIR = path.resolve(__dirname, 'uploads');
const DB_PATH = path.join(__dirname, 'db.json');
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_64';

if (!fs.existsSync(WORK_DIR)) fs.mkdirSync(WORK_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const getDb = () => {
    try {
        const raw = fs.readFileSync(DB_PATH, 'utf8');
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
};
const setDb = (data) => fs.writeFileSync(DB_PATH, JSON.stringify(Array.isArray(data) ? data : [], null, 2));

const findDeepIndex = (dir) => {
    try {
        const files = fs.readdirSync(dir);
        if (files.includes('index.html')) return dir;
        const outDirs = ['dist', 'build', 'public', 'out', 'web-build'];
        for (const out of outDirs) {
            const p = path.join(dir, out);
            if (fs.existsSync(p) && fs.existsSync(path.join(p, 'index.html'))) return p;
        }
        const scan = (d, depth = 0) => {
            if (depth > 6) return null;
            const items = fs.readdirSync(d);
            if (items.includes('index.html')) return d;
            for (const item of items) {
                const full = path.join(d, item);
                if (fs.statSync(full).isDirectory()) {
                    const f = scan(full, depth + 1);
                    if (f) return f;
                }
            }
            return null;
        };
        return scan(dir) || dir;
    } catch(e) { return dir; }
};

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// --- Gateway Auth ---
const auth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (token === 'mock_token') { req.user = { id: 'dev-node' }; return next(); }
    try { req.user = jwt.verify(token, JWT_SECRET); next(); } 
    catch(e) { res.status(401).json({ message: 'REJECTED' }); }
};

// --- Deployment API ---
const upload = multer({ dest: 'uploads/' });
app.post('/api/deploy/upload', auth, upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ success: false });
    const id = 'node-' + Date.now();
    const dest = path.join(WORK_DIR, id);
    fs.mkdirSync(dest, { recursive: true });
    try {
        new admzip(req.file.path).extractAllTo(dest, true);
        fs.unlinkSync(req.file.path);
        const d = { id, _id: id, projectName: req.body.projectName || req.file.originalname, folderPath: dest, url: `/${id}`, status: 'active', userId: req.user.id };
        const db = getDb(); db.push(d); setDb(db);
        res.json({ success: true, data: d });
    } catch(err) { res.status(500).json({ success: false }); }
});

app.get('/api/deploy', auth, (req, res) => {
    const list = getDb().filter(x => x.userId === req.user.id || req.user.id === 'dev-node');
    res.json({ success: true, data: { count: list.length, deployments: list } });
});

app.post('/api/auth/login', (req, res) => {
    const token = jwt.sign({ id: req.body.username }, JWT_SECRET);
    res.json({ success: true, data: { token, user: { id: req.body.username } } });
});

// --- High-Resolution Mission Control (Frontend UI) ---
const front = path.resolve(__dirname, '../frontend');
app.get(['/login', '/dashboard', '/projects', '/upload', '/github', '/aws'], (req, res) => {
    const p = req.path.split('/').pop() || 'index';
    res.sendFile(path.join(front, `${p}.html`));
});
app.use(express.static(front));

// --- Sticky Node Proxy Hub v6.0 (Enterprise Live Host) ---
app.use('/:nodeId*', (req, res, next) => {
    const nodeId = req.params.nodeId;
    const skip = ['api', 'uploads', 'login', 'dashboard', 'projects', 'upload', 'github', 'aws', 'favicon.ico'];
    if (skip.includes(nodeId.toLowerCase())) return next();

    const db = getDb();
    const match = db.find(d => d.id === nodeId || d.projectName.toLowerCase() === nodeId.toLowerCase());
    
    // Check Sticky Cookie session for deep asset resolution
    const activeNode = match ? nodeId : req.cookies.devdeploy_active_node;
    const activeMatch = match || db.find(d => d.id === activeNode);

    if (activeMatch) {
        // Set Sticky Cookie for asset/link stability
        if (match) res.cookie('devdeploy_active_node', nodeId, { maxAge: 900000, httpOnly: false });

        const root = findDeepIndex(activeMatch.folderPath);
        const subPath = match ? req.params[0] : req.originalUrl;
        const target = path.join(root, subPath === '' || subPath === '/' ? 'index.html' : subPath);

        if (fs.existsSync(target) && !fs.statSync(target).isDirectory()) {
            return res.sendFile(target);
        } else if (fs.existsSync(path.join(target, 'index.html'))) {
            return res.sendFile(path.join(target, 'index.html'));
        }
    }
    next();
});

app.get('/', (req, res) => res.sendFile(path.join(front, 'index.html')));

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 DevDeploy Universal Live Station @ ${PORT}`));
