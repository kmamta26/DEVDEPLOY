const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const admzip = require('adm-zip');
const multer = require('multer');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const WORK_DIR = path.resolve(__dirname, '../workdir');
const UPLOADS_DIR = path.resolve(__dirname, 'uploads');
const DB_PATH = path.join(__dirname, 'db.json');
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_64';
const CLIENT_DIST = path.resolve(__dirname, '../client/dist');

if (!fs.existsSync(WORK_DIR)) fs.mkdirSync(WORK_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const getDb = () => {
    try {
        const raw = fs.readFileSync(DB_PATH, 'utf8');
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
};

const setDb = (data) => {
    fs.writeFileSync(DB_PATH, JSON.stringify(Array.isArray(data) ? data : [], null, 2));
};

app.use(cors());
app.use(express.json());
app.use(cookieParser());
const upload = multer({ dest: UPLOADS_DIR });

// --- Auth Middleware ---
const auth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    try { 
        req.user = jwt.verify(token, JWT_SECRET); 
        next(); 
    } catch(e) { 
        res.status(401).json({ error: 'Invalid token' }); 
    }
};

// --- AUTH API ---
app.post('/api/auth/login', (req, res) => {
    const username = req.body.username || req.body.email;
    if (!username) return res.status(400).json({ error: 'Email required' });
    const token = jwt.sign({ id: username }, JWT_SECRET);
    res.json({ token, user: { id: username, username, email: username } });
});

app.post('/api/auth/register', (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email) return res.status(400).json({ error: 'Username and email required' });
    const db = getDb();
    if (db.find(u => u.email === email)) {
        return res.status(400).json({ error: 'User exists' });
    }
    const user = { id: email, username, email, password: password || '', createdAt: new Date() };
    db.push(user);
    setDb(db);
    const token = jwt.sign({ id: email }, JWT_SECRET);
    res.status(201).json({ token, user });
});

// --- PROJECTS API ---
app.get('/api/projects', auth, (req, res) => {
    const db = getDb();
    const projects = db.filter(p => p.id && p.id.startsWith('proj-') && p.userId === req.user.id);
    res.json({ projects });
});

app.post('/api/projects/upload', auth, upload.single('zipFile'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    const projectId = 'proj-' + Date.now();
    const dest = path.join(WORK_DIR, projectId);
    fs.mkdirSync(dest, { recursive: true });
    try {
        new admzip(req.file.path).extractAllTo(dest, true);
        fs.unlinkSync(req.file.path);
        const project = {
            id: projectId,
            name: req.body.projectName || req.file.originalname.replace('.zip', ''),
            url: `http://localhost:${PORT}/${projectId}`,
            status: 'deployed',
            userId: req.user.id,
            createdAt: new Date()
        };
        const db = getDb();
        db.push(project);
        setDb(db);
        res.json({ project });
    } catch(err) {
        res.status(500).json({ error: 'Upload failed' });
    }
});

// --- SERVE BUILT FRONTEND (from client/dist) ---
app.use(express.static(CLIENT_DIST));

// --- SPA FALLBACK (all routes to index.html) ---
app.get('*', (req, res) => {
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 DevDeploy - http://localhost:${PORT}`);
});
