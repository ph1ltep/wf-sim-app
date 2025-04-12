// backend/server.js
const app = require('./app');
const PORT = process.env.PORT || 5000;

console.log('Starting server with configuration:');
console.log(`- PORT: ${PORT}`);
console.log(`- NODE_ENV: ${process.env.NODE_ENV}`);

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running at http://0.0.0.0:${PORT}`);
  console.log('Available routes:');

  // Print registered routes
  function print(path, layer) {
    if (layer.route) {
      layer.route.stack.forEach(print.bind(null, path.concat(layer.route.path)));
    } else if (layer.name === 'router' && layer.handle.stack) {
      layer.handle.stack.forEach(print.bind(null, path.concat(cleanPath(layer.regexp))));
    } else if (layer.method) {
      const segments = path.concat(cleanPath(layer.regexp)).filter(Boolean);
      const fullPath = segments.length ? segments.join('/') : '';
      console.log('%s /%s', layer.method.toUpperCase(), fullPath.replace(/\/+/g, '/'));
    }
  }

  // Helper function to clean regex paths
  function cleanPath(regex) {
    if (!regex) return '';
    // Convert regex to string and remove artifacts
    let path = regex.toString()
      .replace(/^\/\^\\\/|\\\//g, '')      // Remove regex start/end
      .replace(/\?.*$/, '')                // Remove optional markers
      .replace(/\/\.*$/, '')               // Remove trailing regex
      .replace(/\\\(.*\\\)/g, ':id');      // Convert params to :id
    // Remove remaining regex characters and normalize slashes
    path = path.replace(/[\\^$*+?.()|[\]{}]/g, '');
    // Trim leading/trailing slashes and prevent empty segments
    path = path.replace(/^\/+|\/+$/g, '');
    // Replace internal multiple slashes
    return path.replace(/\/+/g, '/');
  }

  app._router.stack.forEach(print.bind(null, []));
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please use a different port.`);
  } else {
    console.error('Server error:', error);
  }
});

