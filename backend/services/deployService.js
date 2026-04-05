const path = require('path');
const fs   = require('fs');
const { exec } = require('child_process');
const { promisify } = require('util');
const simpleGit = require('simple-git');

const execAsync = promisify(exec);

const WORK_DIR = process.env.WORK_DIR || path.join(__dirname, '../../workdir');

// Ensure work directory exists at startup
if (!fs.existsSync(WORK_DIR)) {
  fs.mkdirSync(WORK_DIR, { recursive: true });
}

/**
 * Clone a GitHub repository to a local directory.
 * @param {string} cloneUrl    - HTTPS clone URL (may include token for private repos)
 * @param {string} destDir     - Absolute path where the repo should be cloned
 * @param {string} [branch]    - Branch to checkout after clone
 * @param {Function} [onLog]   - Callback to receive log lines
 */
async function cloneRepo(cloneUrl, destDir, branch = 'main', onLog = () => {}) {
  onLog(`Cloning ${cloneUrl} (branch: ${branch})...`);
  fs.mkdirSync(destDir, { recursive: true });

  const git = simpleGit();
  await git.clone(cloneUrl, destDir, ['--depth', '1', '--branch', branch]);
  onLog('✅ Clone complete');
}

/**
 * Install npm dependencies inside a project directory.
 * @param {string} projectDir
 * @param {Function} [onLog]
 */
async function installDependencies(projectDir, onLog = () => {}) {
  const pkgPath = path.join(projectDir, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    onLog('ℹ️  No package.json found — skipping npm install');
    return;
  }

  onLog('📦 Running npm install...');
  const { stdout, stderr } = await execAsync('npm install --prefer-offline --no-audit', {
    cwd: projectDir,
    timeout: 120_000 // 2-minute timeout
  });
  if (stdout) onLog(stdout.trim());
  if (stderr) onLog(`[stderr] ${stderr.trim()}`);
  onLog('✅ Dependencies installed');
}

/**
 * Run the build command from package.json scripts (if it exists).
 * @param {string} projectDir
 * @param {Function} [onLog]
 */
async function runBuild(projectDir, onLog = () => {}) {
  const pkgPath = path.join(projectDir, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    onLog('ℹ️  No package.json — skipping build step');
    return;
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  if (!pkg.scripts?.build) {
    onLog('ℹ️  No build script found in package.json — skipping');
    return;
  }

  onLog('🔨 Running npm run build...');
  const { stdout, stderr } = await execAsync('npm run build', {
    cwd: projectDir,
    timeout: 300_000 // 5-minute timeout for larger builds
  });
  if (stdout) onLog(stdout.trim());
  if (stderr) onLog(`[stderr] ${stderr.trim()}`);
  onLog('✅ Build completed');
}

/**
 * Determine what kind of project this is and return the serve root.
 * Priority: dist/ → build/ → public/ → project root
 * @param {string} projectDir
 * @returns {{ type: 'static'|'node', serveRoot: string }}
 */
function detectProjectType(projectDir) {
  const staticDirs = ['dist', 'build', 'public', 'out'];
  for (const dir of staticDirs) {
    const candidate = path.join(projectDir, dir);
    if (fs.existsSync(candidate) && fs.existsSync(path.join(candidate, 'index.html'))) {
      return { type: 'static', serveRoot: candidate };
    }
  }

  const hasIndex = fs.existsSync(path.join(projectDir, 'index.html'));
  if (hasIndex) return { type: 'static', serveRoot: projectDir };

  const hasPkg = fs.existsSync(path.join(projectDir, 'package.json'));
  if (hasPkg) return { type: 'node', serveRoot: projectDir };

  return { type: 'static', serveRoot: projectDir };
}

/**
 * Serve a static project directory using a lightweight express server.
 * Keeps the server reference so it can be stopped later.
 * @param {string} serveRoot - Directory to serve
 * @param {number} port      - Port to listen on
 * @returns {Promise<import('http').Server>}
 */
async function serveStatic(serveRoot, port) {
  const express = require('express');
  const app = express();

  // Security: prevent path traversal
  app.use((req, res, next) => {
    const cleanPath = path.normalize(req.path);
    if (cleanPath.includes('..')) return res.status(403).send('Forbidden');
    next();
  });

  app.use(express.static(serveRoot));

  // SPA fallback
  app.get('*', (req, res) => {
    const indexFile = path.join(serveRoot, 'index.html');
    if (fs.existsSync(indexFile)) {
      res.sendFile(indexFile);
    } else {
      res.status(404).send('Index not found');
    }
  });

  return new Promise((resolve, reject) => {
    const server = app.listen(port, '0.0.0.0', () => resolve(server));
    server.once('error', reject);
  });
}

/**
 * Stop a running HTTP server (from serveStatic).
 * @param {import('http').Server} server
 */
function stopServer(server) {
  return new Promise((resolve) => server.close(resolve));
}

/**
 * Delete a project directory from disk.
 * @param {string} dirPath
 */
function cleanupDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}

const AdmZip = require('adm-zip');
const { S3Client, PutObjectCommand, CreateBucketCommand, PutBucketPolicyCommand, PutBucketWebsiteCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');

/**
 * Extract a ZIP archive to a destination directory.
 */
async function extractZip(zipPath, destDir) {
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  const zip = new AdmZip(zipPath);
  zip.extractAllTo(destDir, true);
  return destDir;
}

/**
 * Upload a project folder to an AWS S3 bucket.
 * For static sites, this uploads each file with correct Content-Type.
 */
async function uploadFolderToS3(localDir, bucketName, credentials, region) {
  const s3 = new S3Client({
    region,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey
    }
  });

  // 1. Create Bucket
  try {
    await s3.send(new CreateBucketCommand({ Bucket: bucketName }));
    console.log(`[AWS] Bucket created: ${bucketName}`);
    
    // 2. Set Public Access & Static Hosting Policy
    // NOTE: This requires the AWS user to have PutBucketPolicy permission.
    const policy = {
      Version: "2012-10-17",
      Statement: [{
        Sid: "PublicRead",
        Effect: "Allow",
        Principal: "*",
        Action: "s3:GetObject",
        Resource: `arn:aws:s3:::${bucketName}/*`
      }]
    };
    await s3.send(new PutBucketPolicyCommand({
      Bucket: bucketName,
      Policy: JSON.stringify(policy)
    }));

    await s3.send(new PutBucketWebsiteCommand({
      Bucket: bucketName,
      WebsiteConfiguration: {
        IndexDocument: { Suffix: "index.html" },
        ErrorDocument: { Key: "index.html" }
      }
    }));
  } catch (err) {
    console.warn(`[AWS] Bucket setup warning (might already exist): ${err.message}`);
  }

  const getFiles = (dir) => {
    let results = [];
    fs.readdirSync(dir).forEach(file => {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        results = results.concat(getFiles(fullPath));
      } else {
        results.push(fullPath);
      }
    });
    return results;
  };

  const files = getFiles(localDir);
  const uploadPromises = files.map(async (file) => {
    const relativePath = path.relative(localDir, file).replace(/\\/g, '/');
    const fileStream = fs.createReadStream(file);
    
    // Basic type mapping
    const ext = path.extname(file).toLowerCase();
    const contentTypeMap = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.json': 'application/json'
    };

    const parallelUploads3 = new Upload({
      client: s3,
      params: {
        Bucket: bucketName,
        Key: relativePath,
        Body: fileStream,
        ContentType: contentTypeMap[ext] || 'application/octet-stream'
      }
    });

    return parallelUploads3.done();
  });

  await Promise.all(uploadPromises);
  // Correct S3 Website Endpoint Format: http://{bucket}.s3-website-{region}.amazonaws.com/
  return `http://${bucketName}.s3-website-${region}.amazonaws.com/`;
}


module.exports = {
  WORK_DIR,
  cloneRepo,
  installDependencies,
  runBuild,
  detectProjectType,
  serveStatic,
  stopServer,
  cleanupDir,
  extractZip,
  uploadFolderToS3
};
