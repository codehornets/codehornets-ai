/**
 * Plugins Module Index
 *
 * Re-exports all plugin-related functionality.
 */

// Manager
export {
  PluginManager,
  PluginManagerOptions,
  PluginManagerEvents,
  createPluginManager,
  createPluginManagerWithDiscovery,
} from './manager.js';

// Loader
export {
  DEFAULT_LOAD_TIMEOUT,
  REQUIRED_MANIFEST_FIELDS,
  PLUGIN_FILE_PATTERNS,
  PluginLoadResult,
  PluginSource,
  readManifest,
  validateManifest,
  findManifestFile,
  loadPluginFromDirectory,
  loadPluginFromFile,
  discoverPlugins,
  resolvePluginSource,
  getDefaultPluginDirs,
} from './loader.js';
