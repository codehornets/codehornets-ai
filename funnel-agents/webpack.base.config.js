const { composePlugins, withNx } = require('@nx/webpack');

/**
 * Base webpack configuration for all NestJS microservices.
 * Bundles workspace libraries (@funnelagents/*) while keeping
 * node_modules external for faster builds and smaller bundles.
 */
module.exports = composePlugins(withNx(), (config) => {
  // Node.js backend configuration
  config.target = 'node';

  // Ensure proper handling of node modules
  config.externalsPresets = { node: true };

  // Don't bundle node_modules - use them at runtime
  config.externals = [
    function ({ request }, callback) {
      // Bundle workspace libraries
      if (request && request.startsWith('@funnelagents/')) {
        return callback();
      }
      // Keep other node_modules external
      if (request && /^[a-z@][a-z0-9\-/@]*$/.test(request)) {
        return callback(null, 'commonjs ' + request);
      }
      callback();
    },
  ];

  return config;
});
