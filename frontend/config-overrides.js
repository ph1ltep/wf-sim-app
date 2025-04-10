const path = require('path');

module.exports = function override(config) {
    // Add the root directory to the module resolution paths
    config.resolve = {
        ...config.resolve,
        modules: [
            path.resolve(__dirname, '..'), // Root directory (../ from /frontend)
            path.resolve(__dirname, 'src'), // Keep src resolution
            'node_modules'                 // Keep node_modules resolution
        ],
        // Optional: Add extensions if needed
        extensions: ['.js', '.jsx', '.json']
    };

    return config;
};