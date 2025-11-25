/**
 * Plugin Manager Module
 *
 * Manages the lifecycle of plugins including loading, unloading,
 * initialization, and error handling.
 */
import { EventEmitter } from 'events';
import type { Plugin, PluginStatus, PluginLoadOptions, MCPToolDefinition } from '../types.js';
import { PluginSource } from './loader.js';
export interface PluginManagerOptions {
    pluginDirs?: string[];
    autoDiscover?: boolean;
    autoInitialize?: boolean;
}
export interface PluginManagerEvents {
    'plugin:loading': (name: string) => void;
    'plugin:loaded': (plugin: Plugin) => void;
    'plugin:unloading': (name: string) => void;
    'plugin:unloaded': (name: string) => void;
    'plugin:error': (name: string, error: Error) => void;
    'plugin:initialized': (name: string) => void;
}
/**
 * Manages plugin lifecycle and provides access to plugin functionality.
 */
export declare class PluginManager extends EventEmitter {
    private plugins;
    private pluginDirs;
    private autoInitialize;
    /**
     * Creates a new plugin manager
     *
     * @param options - Manager options
     */
    constructor(options?: PluginManagerOptions);
    /**
     * Gets a plugin by name
     *
     * @param name - Plugin name
     * @returns Plugin or undefined
     */
    get(name: string): Plugin | undefined;
    /**
     * Gets all loaded plugins
     *
     * @returns Array of plugins
     */
    getAll(): Plugin[];
    /**
     * Gets all plugins with a specific status
     *
     * @param status - Status to filter by
     * @returns Array of plugins with the given status
     */
    getByStatus(status: PluginStatus): Plugin[];
    /**
     * Checks if a plugin is loaded
     *
     * @param name - Plugin name
     * @returns True if loaded
     */
    has(name: string): boolean;
    /**
     * Loads a plugin from a source
     *
     * @param source - Plugin source (path or PluginSource)
     * @param options - Load options
     * @returns Loaded plugin
     */
    load(source: string | PluginSource, options?: PluginLoadOptions): Promise<Plugin>;
    /**
     * Unloads a plugin
     *
     * @param name - Plugin name
     * @returns True if successfully unloaded
     */
    unload(name: string): Promise<boolean>;
    /**
     * Initializes a loaded plugin
     *
     * @param name - Plugin name
     */
    initialize(name: string): Promise<void>;
    /**
     * Reloads a plugin
     *
     * @param name - Plugin name
     * @param options - Load options
     * @returns Reloaded plugin
     */
    reload(name: string, options?: PluginLoadOptions): Promise<Plugin | null>;
    /**
     * Disables a plugin without unloading it
     *
     * @param name - Plugin name
     */
    disable(name: string): void;
    /**
     * Enables a disabled plugin
     *
     * @param name - Plugin name
     */
    enable(name: string): void;
    /**
     * Discovers and loads all plugins from configured directories
     */
    discoverAndLoad(): Promise<Plugin[]>;
    /**
     * Unloads all plugins
     */
    unloadAll(): Promise<void>;
    /**
     * Gets all tools provided by loaded plugins
     *
     * @returns Array of tool definitions
     */
    getTools(): MCPToolDefinition[];
    /**
     * Executes a tool call on the appropriate plugin
     *
     * @param name - Tool name (may be prefixed with plugin name)
     * @param args - Tool arguments
     * @returns Tool result
     */
    callTool(name: string, args: Record<string, unknown>): Promise<unknown>;
    /**
     * Gets statistics about loaded plugins
     */
    getStats(): {
        total: number;
        loaded: number;
        error: number;
        disabled: number;
        unloaded: number;
    };
    /**
     * Gets all errors from plugins
     */
    getErrors(): Array<{
        plugin: string;
        error: Error;
    }>;
}
/**
 * Creates a new plugin manager with default settings
 *
 * @param options - Optional manager options
 * @returns Plugin manager instance
 */
export declare function createPluginManager(options?: PluginManagerOptions): PluginManager;
/**
 * Creates a plugin manager and auto-discovers plugins
 *
 * @param pluginDirs - Directories to search for plugins
 * @returns Plugin manager with discovered plugins
 */
export declare function createPluginManagerWithDiscovery(pluginDirs?: string[]): Promise<PluginManager>;
//# sourceMappingURL=manager.d.ts.map