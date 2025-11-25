/**
 * Plugin Loader Module
 *
 * Handles loading and validation of plugins from various sources.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { PluginManifest, PluginInstance, PluginLoadOptions } from '../types.js';

// =============================================================================
// Constants
// =============================================================================

/**
 * Default plugin load timeout in milliseconds
 */
export const DEFAULT_LOAD_TIMEOUT = 10000;

/**
 * Required manifest fields
 */
export const REQUIRED_MANIFEST_FIELDS = ['name', 'version'] as const;

/**
 * Plugin file patterns
 */
export const PLUGIN_FILE_PATTERNS = [
  'plugin.json',
  'package.json',
  'manifest.json',
] as const;

// =============================================================================
// Types
// =============================================================================

export interface PluginLoadResult {
  success: boolean;
  manifest?: PluginManifest;
  instance?: PluginInstance;
  error?: Error;
}

export interface PluginSource {
  type: 'directory' | 'file' | 'npm' | 'url';
  path: string;
}

// =============================================================================
// Manifest Handling
// =============================================================================

/**
 * Reads and parses a plugin manifest file
 *
 * @param manifestPath - Path to the manifest file
 * @returns Parsed manifest
 */
export function readManifest(manifestPath: string): PluginManifest {
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest not found: ${manifestPath}`);
  }

  const content = fs.readFileSync(manifestPath, 'utf8');
  const manifest = JSON.parse(content) as PluginManifest;

  return manifest;
}

/**
 * Validates a plugin manifest
 *
 * @param manifest - Manifest to validate
 * @returns True if valid
 */
export function validateManifest(manifest: PluginManifest): boolean {
  for (const field of REQUIRED_MANIFEST_FIELDS) {
    if (!manifest[field]) {
      throw new Error(`Missing required manifest field: ${field}`);
    }
  }

  // Validate name format
  if (!/^[a-z0-9-_.]+$/i.test(manifest.name)) {
    throw new Error(
      `Invalid plugin name: ${manifest.name}. ` +
      `Names must contain only alphanumeric characters, hyphens, underscores, and dots.`
    );
  }

  // Validate version format (semver)
  if (!/^\d+\.\d+\.\d+/.test(manifest.version)) {
    throw new Error(
      `Invalid version format: ${manifest.version}. ` +
      `Versions must follow semver (e.g., 1.0.0).`
    );
  }

  return true;
}

/**
 * Finds the manifest file in a plugin directory
 *
 * @param pluginDir - Directory to search
 * @returns Path to manifest file or null
 */
export function findManifestFile(pluginDir: string): string | null {
  for (const pattern of PLUGIN_FILE_PATTERNS) {
    const manifestPath = path.join(pluginDir, pattern);
    if (fs.existsSync(manifestPath)) {
      return manifestPath;
    }
  }
  return null;
}

// =============================================================================
// Plugin Loading
// =============================================================================

/**
 * Loads a plugin from a directory
 *
 * @param pluginDir - Directory containing the plugin
 * @param options - Load options
 * @returns Load result
 */
export async function loadPluginFromDirectory(
  pluginDir: string,
  options: PluginLoadOptions = {}
): Promise<PluginLoadResult> {
  const timeout = options.timeout || DEFAULT_LOAD_TIMEOUT;

  try {
    // Find and read manifest
    const manifestPath = findManifestFile(pluginDir);
    if (!manifestPath) {
      return {
        success: false,
        error: new Error(`No manifest found in: ${pluginDir}`),
      };
    }

    const manifest = readManifest(manifestPath);
    validateManifest(manifest);

    // Determine entry point
    const entryPoint = manifest.main || 'index.js';
    const entryPath = path.join(pluginDir, entryPoint);

    if (!fs.existsSync(entryPath)) {
      return {
        success: false,
        manifest,
        error: new Error(`Entry point not found: ${entryPath}`),
      };
    }

    // Load the plugin with timeout
    const loadPromise = loadPluginModule(entryPath);
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Plugin load timeout')), timeout);
    });

    const instance = await Promise.race([loadPromise, timeoutPromise]);

    return {
      success: true,
      manifest,
      instance,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Loads a plugin module from a file
 *
 * @param entryPath - Path to the entry file
 * @returns Plugin instance
 */
async function loadPluginModule(entryPath: string): Promise<PluginInstance> {
  // Dynamic import for ESM compatibility
  const module = await import(entryPath);

  // Support both default export and named exports
  if (module.default) {
    if (typeof module.default === 'function') {
      // Constructor or factory function
      return new module.default();
    }
    return module.default;
  }

  // Return the module itself as the instance
  return module as PluginInstance;
}

/**
 * Loads a plugin from a file path
 *
 * @param filePath - Path to the plugin file
 * @param options - Load options
 * @returns Load result
 */
export async function loadPluginFromFile(
  filePath: string,
  options: PluginLoadOptions = {}
): Promise<PluginLoadResult> {
  const dir = path.dirname(filePath);
  return loadPluginFromDirectory(dir, options);
}

/**
 * Discovers plugins in a directory
 *
 * @param searchDir - Directory to search for plugins
 * @returns Array of plugin directories found
 */
export function discoverPlugins(searchDir: string): string[] {
  if (!fs.existsSync(searchDir)) {
    return [];
  }

  const plugins: string[] = [];
  const entries = fs.readdirSync(searchDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const pluginDir = path.join(searchDir, entry.name);
      if (findManifestFile(pluginDir)) {
        plugins.push(pluginDir);
      }
    }
  }

  return plugins;
}

/**
 * Resolves a plugin source to an absolute path
 *
 * @param source - Plugin source specification
 * @param baseDir - Base directory for relative paths
 * @returns Resolved absolute path
 */
export function resolvePluginSource(
  source: string | PluginSource,
  baseDir: string
): string {
  if (typeof source === 'string') {
    return path.isAbsolute(source) ? source : path.resolve(baseDir, source);
  }

  switch (source.type) {
    case 'directory':
    case 'file':
      return path.isAbsolute(source.path)
        ? source.path
        : path.resolve(baseDir, source.path);

    case 'npm':
      // For npm packages, return the path as-is (will be resolved by require)
      return source.path;

    case 'url':
      // URLs are not directly loadable
      throw new Error('URL plugin sources are not yet supported');

    default:
      throw new Error(`Unknown plugin source type`);
  }
}

/**
 * Gets default plugin directories for the current platform
 *
 * @returns Array of plugin directories
 */
export function getDefaultPluginDirs(): string[] {
  const dirs: string[] = [];

  // User plugins directory
  const homeDir = process.env.HOME || process.env.USERPROFILE;
  if (homeDir) {
    dirs.push(path.join(homeDir, '.claude', 'plugins'));
  }

  // Project plugins directory
  dirs.push(path.join(process.cwd(), '.claude', 'plugins'));

  return dirs;
}
