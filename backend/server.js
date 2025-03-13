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
      layer.handle.stack.forEach(print.bind(null, path.concat(layer.regexp)));
    } else if (layer.method) {
      console.log('%s /%s', layer.method.toUpperCase(), path.concat(layer.regexp).filter(Boolean).join('/'));
    }
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