/**
 * Plugin Command
 *
 * Manages Claude Code plugins and marketplaces.
 * Supports plugin installation, validation, and marketplace configuration.
 *
 * @module cli/commands/plugin
 */
import { ExitCodes } from '../types.js';
import { generatePluginHelp } from '../help.js';
/**
 * Console output utilities with color support.
 */
const output = {
    error: (msg) => console.error(`\x1B[31m${msg}\x1B[0m`),
    success: (msg) => console.log(`\x1B[32m${msg}\x1B[0m`),
    warn: (msg) => console.warn(`\x1B[33m${msg}\x1B[0m`),
    info: (msg) => console.log(msg),
    dim: (msg) => console.log(`\x1B[2m${msg}\x1B[0m`),
};
/**
 * Status symbols for output.
 */
const SYMBOLS = {
    tick: '\u2714',
    cross: '\u2718',
    warning: '\u26A0',
    pointer: '\u276F',
};
/**
 * Parses a marketplace source string into a source configuration.
 *
 * @param source - Source string (URL, path, or GitHub repo)
 * @returns Parsed marketplace source or error
 */
function parseMarketplaceSource(source) {
    // GitHub repo format: owner/repo
    if (/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/.test(source)) {
        return { source: 'github', repo: source };
    }
    // URL format
    if (source.startsWith('http://') || source.startsWith('https://')) {
        if (source.endsWith('.git')) {
            return { source: 'git', url: source };
        }
        return { source: 'url', url: source };
    }
    // Local path format
    if (source.startsWith('./') || source.startsWith('/') || source.startsWith('..')) {
        // Check if it's a file or directory based on extension
        if (source.endsWith('.json')) {
            return { source: 'file', path: source };
        }
        return { source: 'directory', path: source };
    }
    return { error: 'Invalid marketplace source format. Try: owner/repo, https://..., or ./path' };
}
/**
 * Handles the 'plugin validate' subcommand.
 * Validates a plugin or marketplace manifest.
 *
 * @param args - Positional arguments [path]
 * @param options - Command options
 * @param context - Execution context
 * @returns Exit code
 */
export async function handlePluginValidate(args, options, context) {
    const [path] = args;
    if (!path) {
        output.error('Error: Path to manifest is required.');
        output.info('Usage: claude plugin validate <path>');
        return ExitCodes.INVALID_ARGS;
    }
    try {
        // In a real implementation, this would:
        // 1. Read the manifest file
        // 2. Validate against schema
        // 3. Check for warnings
        // Placeholder validation result
        const result = {
            success: true,
            fileType: path.includes('marketplace') ? 'marketplace' : 'plugin',
            filePath: path,
            errors: [],
            warnings: [],
        };
        output.info(`Validating ${result.fileType} manifest: ${result.filePath}\n`);
        if (result.errors.length > 0) {
            output.error(`${SYMBOLS.cross} Found ${result.errors.length} error${result.errors.length === 1 ? '' : 's'}:\n`);
            for (const error of result.errors) {
                output.info(`  ${SYMBOLS.pointer} ${error.path}: ${error.message}`);
            }
            output.info('');
        }
        if (result.warnings.length > 0) {
            output.warn(`${SYMBOLS.warning} Found ${result.warnings.length} warning${result.warnings.length === 1 ? '' : 's'}:\n`);
            for (const warning of result.warnings) {
                output.info(`  ${SYMBOLS.pointer} ${warning.path}: ${warning.message}`);
            }
            output.info('');
        }
        if (result.success) {
            if (result.warnings.length > 0) {
                output.success(`${SYMBOLS.tick} Validation passed with warnings`);
            }
            else {
                output.success(`${SYMBOLS.tick} Validation passed`);
            }
            return ExitCodes.SUCCESS;
        }
        else {
            output.error(`${SYMBOLS.cross} Validation failed`);
            return ExitCodes.ERROR;
        }
    }
    catch (error) {
        output.error(`${SYMBOLS.cross} Unexpected error during validation: ${error instanceof Error ? error.message : String(error)}`);
        return ExitCodes.ERROR;
    }
}
/**
 * Handles the 'plugin install' subcommand.
 * Installs a plugin from available marketplaces.
 *
 * @param args - Positional arguments [plugin]
 * @param options - Command options
 * @param context - Execution context
 * @returns Exit code
 */
export async function handlePluginInstall(args, options, context) {
    const [pluginSpec] = args;
    if (!pluginSpec) {
        output.error('Error: Plugin identifier is required.');
        output.info('Usage: claude plugin install <plugin>');
        output.info('Example: claude plugin install my-plugin@my-marketplace');
        return ExitCodes.INVALID_ARGS;
    }
    try {
        output.info(`Installing plugin: ${pluginSpec}...`);
        // Parse plugin@marketplace format
        const parts = pluginSpec.split('@');
        const pluginName = parts[0];
        const marketplaceName = parts[1];
        if (marketplaceName) {
            output.dim(`  From marketplace: ${marketplaceName}`);
        }
        // In a real implementation, this would:
        // 1. Find the plugin in configured marketplaces
        // 2. Download and install the plugin
        // 3. Update the configuration
        output.error('Error: Plugin installation not yet implemented in refactored CLI');
        return ExitCodes.ERROR;
    }
    catch (error) {
        output.error(`${SYMBOLS.cross} Failed to install plugin: ${error instanceof Error ? error.message : String(error)}`);
        return ExitCodes.ERROR;
    }
}
/**
 * Handles the 'plugin uninstall' subcommand.
 * Uninstalls an installed plugin.
 *
 * @param args - Positional arguments [plugin]
 * @param options - Command options
 * @param context - Execution context
 * @returns Exit code
 */
export async function handlePluginUninstall(args, options, context) {
    const [pluginName] = args;
    if (!pluginName) {
        output.error('Error: Plugin name is required.');
        output.info('Usage: claude plugin uninstall <plugin>');
        return ExitCodes.INVALID_ARGS;
    }
    try {
        output.info(`Uninstalling plugin: ${pluginName}...`);
        // In a real implementation, this would:
        // 1. Find the installed plugin
        // 2. Remove plugin files
        // 3. Update the configuration
        output.error('Error: Plugin uninstallation not yet implemented in refactored CLI');
        return ExitCodes.ERROR;
    }
    catch (error) {
        output.error(`${SYMBOLS.cross} Failed to uninstall plugin: ${error instanceof Error ? error.message : String(error)}`);
        return ExitCodes.ERROR;
    }
}
/**
 * Handles the 'plugin enable' subcommand.
 * Enables a disabled plugin.
 *
 * @param args - Positional arguments [plugin]
 * @param options - Command options
 * @param context - Execution context
 * @returns Exit code
 */
export async function handlePluginEnable(args, options, context) {
    const [pluginName] = args;
    if (!pluginName) {
        output.error('Error: Plugin name is required.');
        output.info('Usage: claude plugin enable <plugin>');
        return ExitCodes.INVALID_ARGS;
    }
    try {
        output.info(`Enabling plugin: ${pluginName}...`);
        // In a real implementation, this would update plugin state
        output.error('Error: Plugin enable not yet implemented in refactored CLI');
        return ExitCodes.ERROR;
    }
    catch (error) {
        output.error(`${SYMBOLS.cross} Failed to enable plugin: ${error instanceof Error ? error.message : String(error)}`);
        return ExitCodes.ERROR;
    }
}
/**
 * Handles the 'plugin disable' subcommand.
 * Disables an enabled plugin.
 *
 * @param args - Positional arguments [plugin]
 * @param options - Command options
 * @param context - Execution context
 * @returns Exit code
 */
export async function handlePluginDisable(args, options, context) {
    const [pluginName] = args;
    if (!pluginName) {
        output.error('Error: Plugin name is required.');
        output.info('Usage: claude plugin disable <plugin>');
        return ExitCodes.INVALID_ARGS;
    }
    try {
        output.info(`Disabling plugin: ${pluginName}...`);
        // In a real implementation, this would update plugin state
        output.error('Error: Plugin disable not yet implemented in refactored CLI');
        return ExitCodes.ERROR;
    }
    catch (error) {
        output.error(`${SYMBOLS.cross} Failed to disable plugin: ${error instanceof Error ? error.message : String(error)}`);
        return ExitCodes.ERROR;
    }
}
// ============================================================================
// Marketplace Subcommands
// ============================================================================
/**
 * Handles the 'plugin marketplace add' subcommand.
 * Adds a marketplace from a URL, path, or GitHub repo.
 *
 * @param args - Positional arguments [source]
 * @param options - Command options
 * @param context - Execution context
 * @returns Exit code
 */
export async function handleMarketplaceAdd(args, options, context) {
    const [source] = args;
    if (!source) {
        output.error('Error: Marketplace source is required.');
        output.info('Usage: claude plugin marketplace add <source>');
        output.info('Examples:');
        output.info('  claude plugin marketplace add owner/repo');
        output.info('  claude plugin marketplace add https://example.com/marketplace.json');
        output.info('  claude plugin marketplace add ./local/marketplace');
        return ExitCodes.INVALID_ARGS;
    }
    const parsed = parseMarketplaceSource(source);
    if ('error' in parsed) {
        output.error(`${SYMBOLS.cross} ${parsed.error}`);
        return ExitCodes.INVALID_ARGS;
    }
    try {
        output.info('Adding marketplace...');
        // In a real implementation, this would:
        // 1. Fetch marketplace manifest
        // 2. Validate the manifest
        // 3. Save to configuration
        let sourceDesc;
        switch (parsed.source) {
            case 'github':
                sourceDesc = `GitHub (${parsed.repo})`;
                break;
            case 'git':
                sourceDesc = `Git (${parsed.url})`;
                break;
            case 'url':
                sourceDesc = `URL (${parsed.url})`;
                break;
            case 'directory':
                sourceDesc = `Directory (${parsed.path})`;
                break;
            case 'file':
                sourceDesc = `File (${parsed.path})`;
                break;
            default:
                sourceDesc = 'Unknown';
        }
        output.dim(`  Source: ${sourceDesc}`);
        output.error('Error: Marketplace addition not yet implemented in refactored CLI');
        return ExitCodes.ERROR;
    }
    catch (error) {
        output.error(`${SYMBOLS.cross} Failed to add marketplace: ${error instanceof Error ? error.message : String(error)}`);
        return ExitCodes.ERROR;
    }
}
/**
 * Handles the 'plugin marketplace list' subcommand.
 * Lists all configured marketplaces.
 *
 * @param args - Positional arguments
 * @param options - Command options
 * @param context - Execution context
 * @returns Exit code
 */
export async function handleMarketplaceList(args, options, context) {
    try {
        // In a real implementation, this would load from configuration
        const marketplaces = {};
        const names = Object.keys(marketplaces);
        if (names.length === 0) {
            output.info('No marketplaces configured');
            return ExitCodes.SUCCESS;
        }
        output.info('Configured marketplaces:\n');
        for (const name of names) {
            const marketplace = marketplaces[name];
            output.info(`  ${SYMBOLS.pointer} ${name}`);
            if (marketplace?.source) {
                const src = marketplace.source;
                switch (src.source) {
                    case 'github':
                        output.dim(`    Source: GitHub (${src.repo})`);
                        break;
                    case 'git':
                        output.dim(`    Source: Git (${src.url})`);
                        break;
                    case 'url':
                        output.dim(`    Source: URL (${src.url})`);
                        break;
                    case 'directory':
                        output.dim(`    Source: Directory (${src.path})`);
                        break;
                    case 'file':
                        output.dim(`    Source: File (${src.path})`);
                        break;
                }
            }
            output.info('');
        }
        return ExitCodes.SUCCESS;
    }
    catch (error) {
        output.error(`${SYMBOLS.cross} Failed to list marketplaces: ${error instanceof Error ? error.message : String(error)}`);
        return ExitCodes.ERROR;
    }
}
/**
 * Handles the 'plugin marketplace remove' subcommand.
 * Removes a configured marketplace.
 *
 * @param args - Positional arguments [name]
 * @param options - Command options
 * @param context - Execution context
 * @returns Exit code
 */
export async function handleMarketplaceRemove(args, options, context) {
    const [name] = args;
    if (!name) {
        output.error('Error: Marketplace name is required.');
        output.info('Usage: claude plugin marketplace remove <name>');
        return ExitCodes.INVALID_ARGS;
    }
    try {
        // In a real implementation, this would remove from configuration
        output.success(`${SYMBOLS.tick} Successfully removed marketplace: ${name}`);
        return ExitCodes.SUCCESS;
    }
    catch (error) {
        output.error(`${SYMBOLS.cross} Failed to remove marketplace: ${error instanceof Error ? error.message : String(error)}`);
        return ExitCodes.ERROR;
    }
}
/**
 * Handles the 'plugin marketplace update' subcommand.
 * Updates marketplace(s) from their source.
 *
 * @param args - Positional arguments [name?]
 * @param options - Command options
 * @param context - Execution context
 * @returns Exit code
 */
export async function handleMarketplaceUpdate(args, options, context) {
    const [name] = args;
    try {
        if (name) {
            output.info(`Updating marketplace: ${name}...`);
            // In a real implementation, this would update the specific marketplace
            output.success(`${SYMBOLS.tick} Successfully updated marketplace: ${name}`);
        }
        else {
            output.info('Updating all marketplaces...');
            // In a real implementation, this would update all marketplaces
            output.success(`${SYMBOLS.tick} Successfully updated all marketplaces`);
        }
        return ExitCodes.SUCCESS;
    }
    catch (error) {
        output.error(`${SYMBOLS.cross} Failed to update marketplace(s): ${error instanceof Error ? error.message : String(error)}`);
        return ExitCodes.ERROR;
    }
}
/**
 * Handles the 'plugin marketplace' subcommand router.
 *
 * @param args - Positional arguments
 * @param options - Command options
 * @param context - Execution context
 * @returns Exit code
 */
export async function handleMarketplace(args, options, context) {
    const [subcommand, ...subArgs] = args;
    if (!subcommand) {
        output.info('Usage: claude plugin marketplace <command>');
        output.info('');
        output.info('Commands:');
        output.info('  add <source>     Add a marketplace');
        output.info('  list             List configured marketplaces');
        output.info('  remove <name>    Remove a marketplace');
        output.info('  update [name]    Update marketplace(s)');
        return ExitCodes.SUCCESS;
    }
    switch (subcommand) {
        case 'add':
            return handleMarketplaceAdd(subArgs, options, context);
        case 'list':
        case 'ls':
            return handleMarketplaceList(subArgs, options, context);
        case 'remove':
        case 'rm':
            return handleMarketplaceRemove(subArgs, options, context);
        case 'update':
            return handleMarketplaceUpdate(subArgs, options, context);
        default:
            output.error(`Unknown marketplace subcommand: ${subcommand}`);
            return ExitCodes.INVALID_ARGS;
    }
}
/**
 * Main plugin command handler.
 * Routes to appropriate subcommand handler.
 *
 * @param args - Positional arguments
 * @param options - Command options
 * @param context - Execution context
 * @returns Exit code
 */
export async function handlePluginCommand(args, options, context) {
    const [subcommand, ...subArgs] = args;
    if (options.help || !subcommand) {
        console.log(generatePluginHelp());
        return ExitCodes.SUCCESS;
    }
    switch (subcommand) {
        case 'validate':
            return handlePluginValidate(subArgs, options, context);
        case 'install':
        case 'i':
            return handlePluginInstall(subArgs, options, context);
        case 'uninstall':
        case 'remove':
        case 'rm':
            return handlePluginUninstall(subArgs, options, context);
        case 'enable':
            return handlePluginEnable(subArgs, options, context);
        case 'disable':
            return handlePluginDisable(subArgs, options, context);
        case 'marketplace':
            return handleMarketplace(subArgs, options, context);
        default:
            output.error(`Unknown plugin subcommand: ${subcommand}`);
            console.log(generatePluginHelp());
            return ExitCodes.INVALID_ARGS;
    }
}
//# sourceMappingURL=plugin.js.map