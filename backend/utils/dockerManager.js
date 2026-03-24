const { exec } = require('child_process');

/**
 * Execute a shell command and return stdout.
 * @param {string} cmd - The command to run.
 * @param {string} cwd - Working directory.
 * @returns {Promise<string>}
 */
function run(cmd, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    exec(cmd, { cwd, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        console.error(`[CMD ERROR] ${cmd}\n  stderr: ${stderr}`);
        return reject(new Error(stderr || error.message));
      }
      resolve(stdout.trim());
    });
  });
}

/**
 * Build a Docker image from a Dockerfile in the given directory.
 */
async function buildImage(imageName, projectDir) {
  console.log(`[Docker] Building image "${imageName}" from ${projectDir}`);
  await run(`docker build -t ${imageName} .`, projectDir);
  console.log(`[Docker] Image "${imageName}" built successfully.`);
}

/**
 * Remove an existing container (if any) and run a new one.
 * @param {string} containerName
 * @param {string} imageName
 * @param {number} hostPort
 * @param {number} containerPort - 80 for static, 3000 for node
 */
async function runContainer(containerName, imageName, hostPort, containerPort) {
  // Stop & remove old container silently
  await run(`docker rm -f ${containerName} || true`);

  console.log(`[Docker] Starting container "${containerName}" on port ${hostPort}->${containerPort}`);
  await run(
    `docker run -d --name ${containerName} --restart unless-stopped -p ${hostPort}:${containerPort} ${imageName}`
  );
  console.log(`[Docker] Container "${containerName}" is running.`);
}

/**
 * Stop and remove a container.
 */
async function removeContainer(containerName) {
  await run(`docker rm -f ${containerName} || true`);
  console.log(`[Docker] Container "${containerName}" removed.`);
}

module.exports = { buildImage, runContainer, removeContainer, run };
