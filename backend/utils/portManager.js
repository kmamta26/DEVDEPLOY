const Project = require('../models/Project');
const net = require('net');

const PORT_RANGE_START = 8001;
const PORT_RANGE_END   = 9999;

/**
 * Check if a TCP port is available on localhost.
 */
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, '127.0.0.1');
    server.on('listening', () => {
      server.close();
      resolve(true);
    });
    server.on('error', () => resolve(false));
  });
}

/**
 * Find the next free port that is:
 *  1. Not already used by a project in the DB
 *  2. Not currently bound on the host
 * @returns {Promise<number>}
 */
async function getNextFreePort() {
  // Collect all ports already allocated in DB
  let dbPorts = [];
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState === 1) {
    dbPorts = (await Project.find({}, 'port').lean()).map(p => p.port);
  } else {
    // Legacy offline port check
    const fs = require('fs');
    const path = require('path');
    const DB_FILE = path.join(__dirname, '../db.json');
    if (fs.existsSync(DB_FILE)) {
      const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      dbPorts = db.projects?.map(p => p.port) || [];
    }
  }
  const usedPorts = new Set(dbPorts);

  for (let port = PORT_RANGE_START; port <= PORT_RANGE_END; port++) {
    if (usedPorts.has(port)) continue;

    const available = await isPortAvailable(port);
    if (available) return port;
  }

  throw new Error('No free ports available in the configured range.');
}

module.exports = { getNextFreePort };
