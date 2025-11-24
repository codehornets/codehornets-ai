/**
 * Plugin Manager Module
 *
 * Manages the lifecycle of plugins including loading, unloading,
 * initialization, and error handling.
 */
import { EventEmitter } from 'events';
import { loadPluginFromDirectory, discoverPlugins, getDefaultPluginDirs, resolvePluginSource, } from './loader.js';
// =============================================================================
// Plugin Manager Class
// =============================================================================
/**
 * Manages plugin lifecycle and provides access to plugin functionality.
 */
export class PluginManager extends EventEmitter {
    plugins = new Map();
    pluginDirs;
    autoInitialize;
    /**
     * Creates a new plugin manager
     *
     * @param options - Manager options
     */
    constructor(options = {}) {
        super();
        this.pluginDirs = options.pluginDirs || getDefaultPluginDirs();
        this.autoInitialize = options.autoInitialize ?? true;
        if (options.autoDiscover) {
            this.discoverAndLoad();
        }
    }
    // ===========================================================================
    // Public API
    // ===========================================================================
    /**
     * Gets a plugin by name
     *
     * @param name - Plugin name
     * @returns Plugin or undefined
     */
    get(name) {
        return this.plugins.get(name);
    }
    /**
     * Gets all loaded plugins
     *
     * @returns Array of plugins
     */
    getAll() {
        return Array.from(this.plugins.values());
    }
    /**
     * Gets all plugins with a specific status
     *
     * @param status - Status to filter by
     * @returns Array of plugins with the given status
     */
    getByStatus(status) {
        return this.getAll().filter((p) => p.status === status);
    }
    /**
     * Checks if a plugin is loaded
     *
     * @param name - Plugin name
     * @returns True if loaded
     */
    has(name) {
        return this.plugins.has(name);
    }
    /**
     * Loads a plugin from a source
     *
     * @param source - Plugin source (path or PluginSource)
     * @param options - Load options
     * @returns Loaded plugin
     */
    async load(source, options = {}) {
        const resolvedPath = resolvePluginSource(source, process.cwd());
        this.emit('plugin:loading', resolvedPath);
        const result = await loadPluginFromDirectory(resolvedPath, options);
        if (!result.success || !result.manifest) {
            const error = result.error || new Error('Unknown load error');
            const plugin = {
                manifest: result.manifest || {
                    name: resolvedPath,
                    version: 'unknown',
                },
                status: 'error',
                error,
            };
            this.emit('plugin:error', resolvedPath, error);
            return plugin;
        }
        const plugin = {
            manifest: result.manifest,
            status: 'loaded',
            instance: result.instance,
            loadedAt: new Date(),
        };
        this.plugins.set(result.manifest.name, plugin);
        this.emit('plugin:loaded', plugin);
        // Auto-initialize if enabled
        if (this.autoInitialize && result.instance?.initialize) {
            await this.initialize(result.manifest.name);
        }
        return plugin;
    }
    /**
     * Unloads a plugin
     *
     * @param name - Plugin name
     * @returns True if successfully unloaded
     */
    async unload(name) {
        const plugin = this.plugins.get(name);
        if (!plugin) {
            return false;
        }
        this.emit('plugin:unloading', name);
        try {
            // Call destroy if available
            if (plugin.instance?.destroy) {
                await plugin.instance.destroy();
            }
            plugin.status = 'unloaded';
            plugin.instance = undefined;
            this.plugins.delete(name);
            this.emit('plugin:unloaded', name);
            return true;
        }
        catch (error) {
            plugin.status = 'error';
            plugin.error = error instanceof Error ? error : new Error(String(error));
            this.emit('plugin:error', name, plugin.error);
            return false;
        }
    }
    /**
     * Initializes a loaded plugin
     *
     * @param name - Plugin name
     */
    async initialize(name) {
        const plugin = this.plugins.get(name);
        if (!plugin) {
            throw new Error(`Plugin not found: ${name}`);
        }
        if (plugin.status !== 'loaded') {
            throw new Error(`Plugin not in loadable state: ${plugin.status}`);
        }
        try {
            if (plugin.instance?.initialize) {
                await plugin.instance.initialize();
            }
            this.emit('plugin:initialized', name);
        }
        catch (error) {
            plugin.status = 'error';
            plugin.error = error instanceof Error ? error : new Error(String(error));
            this.emit('plugin:error', name, plugin.error);
            throw error;
        }
    }
    /**
     * Reloads a plugin
     *
     * @param name - Plugin name
     * @param options - Load options
     * @returns Reloaded plugin
     */
    async reload(name, options = {}) {
        const plugin = this.plugins.get(name);
        if (!plugin) {
            return null;
        }
        // Get the source from manifest or use name as path
        const source = name;
        await this.unload(name);
        return this.load(source, { ...options, force: true });
    }
    /**
     * Disables a plugin without unloading it
     *
     * @param name - Plugin name
     */
    disable(name) {
        const plugin = this.plugins.get(name);
        if (plugin) {
            plugin.status = 'disabled';
        }
    }
    /**
     * Enables a disabled plugin
     *
     * @param name - Plugin name
     */
    enable(name) {
        const plugin = this.plugins.get(name);
        if (plugin && plugin.status === 'disabled') {
            plugin.status = plugin.instance ? 'loaded' : 'error';
        }
    }
    /**
     * Discovers and loads all plugins from configured directories
     */
    async discoverAndLoad() {
        const loadedPlugins = [];
        for (const dir of this.pluginDirs) {
            const pluginPaths = discoverPlugins(dir);
            for (const pluginPath of pluginPaths) {
                try {
                    const plugin = await this.load(pluginPath);
                    loadedPlugins.push(plugin);
                }
                catch (error) {
                    console.warn(`Failed to load plugin from ${pluginPath}:`, error);
                }
            }
        }
        return loadedPlugins;
    }
    /**
     * Unloads all plugins
     */
    async unloadAll() {
        const names = Array.from(this.plugins.keys());
        for (const name of names) {
            await this.unload(name);
        }
    }
    // ===========================================================================
    // Tool Integration
    // ===========================================================================
    /**
     * Gets all tools provided by loaded plugins
     *
     * @returns Array of tool definitions
     */
    getTools() {
        const tools = [];
        for (const plugin of this.plugins.values()) {
            if (plugin.status === 'loaded' && plugin.instance?.getTools) {
                const pluginTools = plugin.instance.getTools();
                tools.push(...pluginTools);
            }
        }
        return tools;
    }
    /**
     * Executes a tool call on the appropriate plugin
     *
     * @param name - Tool name (may be prefixed with plugin name)
     * @param args - Tool arguments
     * @returns Tool result
     */
    async callTool(name, args) {
        // Check if tool name is prefixed with plugin name (e.g., "myplugin__mytool")
        const parts = name.split('__');
        const pluginName = parts.length > 1 ? parts[0] : null;
        const toolName = parts.length > 1 ? parts.slice(1).join('__') : name;
        // If plugin name is specified, use that plugin
        if (pluginName) {
            const plugin = this.plugins.get(pluginName);
            if (!plugin || plugin.status !== 'loaded' || !plugin.instance?.handleToolCall) {
                throw new Error(`Plugin not available: ${pluginName}`);
            }
            return plugin.instance.handleToolCall(toolName, args);
        }
        // Otherwise, search all plugins for the tool
        for (const plugin of this.plugins.values()) {
            if (plugin.status !== 'loaded' || !plugin.instance?.handleToolCall) {
                continue;
            }
            const tools = plugin.instance.getTools?.() || [];
            if (tools.some((t) => t.name === toolName)) {
                return plugin.instance.handleToolCall(toolName, args);
            }
        }
        throw new Error(`Tool not found: ${name}`);
    }
    // ===========================================================================
    // Statistics
    // ===========================================================================
    /**
     * Gets statistics about loaded plugins
     */
    getStats() {
        const all = this.getAll();
        return {
            total: all.length,
            loaded: all.filter((p) => p.status === 'loaded').length,
            error: all.filter((p) => p.status === 'error').length,
            disabled: all.filter((p) => p.status === 'disabled').length,
            unloaded: all.filter((p) => p.status === 'unloaded').length,
        };
    }
    /**
     * Gets all errors from plugins
     */
    getErrors() {
        return this.getAll()
            .filter((p) => p.error)
            .map((p) => ({
            plugin: p.manifest.name,
            error: p.error,
        }));
    }
}
// =============================================================================
// Factory Functions
// =============================================================================
/**
 * Creates a new plugin manager with default settings
 *
 * @param options - Optional manager options
 * @returns Plugin manager instance
 */
export function createPluginManager(options = {}) {
    return new PluginManager(options);
}
/**
 * Creates a plugin manager and auto-discovers plugins
 *
 * @param pluginDirs - Directories to search for plugins
 * @returns Plugin manager with discovered plugins
 */
export async function createPluginManagerWithDiscovery(pluginDirs) {
    const manager = new PluginManager({
        pluginDirs,
        autoDiscover: false,
        autoInitialize: true,
    });
    await manager.discoverAndLoad();
    return manager;
}
//# sourceMappingURL=manager.js.map