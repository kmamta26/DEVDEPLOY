const net = require('net');

const PORT_RANGE_START = 3100;
const PORT_RANGE_END   = 3999;

/**
 * Check if a given port is free on localhost.
 * @param {number} port
 * @returns {Promise<boolean>}
 */
function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port, '127.0.0.1');
  });
}

/**
 * Find the next available port in the deployment range.
 * @returns {Promise<number>} An available port number
 */
async function getNextFreePort() {
  for (let port = PORT_RANGE_START; port <= PORT_RANGE_END; port++) {
    if (await isPortFree(port)) return port;
  }
  throw new Error(`No free port available in range ${PORT_RANGE_START}–${PORT_RANGE_END}`);
}

module.exports = { getNextFreePort, isPortFree };
