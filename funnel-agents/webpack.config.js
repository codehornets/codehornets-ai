const { composePlugins, withNx } = require('@nx/webpack');
const nodeExternals = require('webpack-node-externals');

module.exports = composePlugins(withNx(), (config) => {
  config.externals = [nodeExternals()];
  config.externalsPresets = { node: true };

  // Remove any TypeScript rootDir constraints
  if (config.module && config.module.rules) {
    config.module.rules.forEach(rule => {
      if (rule.use && rule.use.loader === 'ts-loader') {
        rule.use.options = rule.use.options || {};
        rule.use.options.compilerOptions = rule.use.options.compilerOptions || {};
        delete rule.use.options.compilerOptions.rootDir;
      }
    });
  }

  return config;
});
