/**
 * Plugin Loader Module
 *
 * Handles loading and validation of plugins from various sources.
 */
import type { PluginManifest, PluginInstance, PluginLoadOptions } from '../types.js';
/**
 * Default plugin load timeout in milliseconds
 */
export declare const DEFAULT_LOAD_TIMEOUT = 10000;
/**
 * Required manifest fields
 */
export declare const REQUIRED_MANIFEST_FIELDS: readonly ["name", "version"];
/**
 * Plugin file patterns
 */
export declare const PLUGIN_FILE_PATTERNS: readonly ["plugin.json", "package.json", "manifest.json"];
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
/**
 * Reads and parses a plugin manifest file
 *
 * @param manifestPath - Path to the manifest file
 * @returns Parsed manifest
 */
export declare function readManifest(manifestPath: string): PluginManifest;
/**
 * Validates a plugin manifest
 *
 * @param manifest - Manifest to validate
 * @returns True if valid
 */
export declare function validateManifest(manifest: PluginManifest): boolean;
/**
 * Finds the manifest file in a plugin directory
 *
 * @param pluginDir - Directory to search
 * @returns Path to manifest file or null
 */
export declare function findManifestFile(pluginDir: string): string | null;
/**
 * Loads a plugin from a directory
 *
 * @param pluginDir - Directory containing the plugin
 * @param options - Load options
 * @returns Load result
 */
export declare function loadPluginFromDirectory(pluginDir: string, options?: PluginLoadOptions): Promise<PluginLoadResult>;
/**
 * Loads a plugin from a file path
 *
 * @param filePath - Path to the plugin file
 * @param options - Load options
 * @returns Load result
 */
export declare function loadPluginFromFile(filePath: string, options?: PluginLoadOptions): Promise<PluginLoadResult>;
/**
 * Discovers plugins in a directory
 *
 * @param searchDir - Directory to search for plugins
 * @returns Array of plugin directories found
 */
export declare function discoverPlugins(searchDir: string): string[];
/**
 * Resolves a plugin source to an absolute path
 *
 * @param source - Plugin source specification
 * @param baseDir - Base directory for relative paths
 * @returns Resolved absolute path
 */
export declare function resolvePluginSource(source: string | PluginSource, baseDir: string): string;
/**
 * Gets default plugin directories for the current platform
 *
 * @returns Array of plugin directories
 */
export declare function getDefaultPluginDirs(): string[];
//# sourceMappingURL=loader.d.ts.map