const net = require('net');

function getNextPort(port, offset = 0) {
  return port + offset;
}

function checkPortAvailability(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(false);
      }
    });

    server.once('listening', () => {
      server.close(() => resolve(true));
    });

    server.listen(port);
  });
}

async function resolvePort(startPort) {
  let port = startPort;
  let attempt = 0;

  while (attempt < 10) {
    const available = await checkPortAvailability(port);
    if (available) {
      return port;
    }

    attempt += 1;
    port = getNextPort(startPort, attempt);
  }

  return startPort;
}

module.exports = { getNextPort, checkPortAvailability, resolvePort };
