const { composePlugins, withNx } = require('@nx/webpack');
const nodeExternals = require('webpack-node-externals');
const path = require('path');

module.exports = composePlugins(withNx(), (config) => {
  config.externals = [nodeExternals()];
  config.externalsPresets = { node: true };

  // Override TypeScript options to allow files from entire workspace
  if (config.module && config.module.rules) {
    config.module.rules.forEach(rule => {
      if (rule.use) {
        if (Array.isArray(rule.use)) {
          rule.use.forEach(useEntry => {
            if (useEntry.loader && (useEntry.loader.includes('ts-loader') || useEntry.loader.includes('swc-loader'))) {
              useEntry.options = useEntry.options || {};
              useEntry.options.compilerOptions = useEntry.options.compilerOptions || {};
              // Set rootDir to workspace root to allow all files
              useEntry.options.compilerOptions.rootDir = path.join(__dirname);
            }
          });
        } else if (rule.use.loader && (rule.use.loader.includes('ts-loader') || rule.use.loader.includes('swc-loader'))) {
          rule.use.options = rule.use.options || {};
          rule.use.options.compilerOptions = rule.use.options.compilerOptions || {};
          // Set rootDir to workspace root to allow all files
          rule.use.options.compilerOptions.rootDir = path.join(__dirname);
        }
      }
    });
  }

  return config;
});
