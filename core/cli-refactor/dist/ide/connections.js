/**
 * IDE Connection Management
 *
 * Handles discovering and managing connections to running IDEs.
 * Supports both HTTP/SSE and WebSocket connections.
 */
import { resolve, sep } from 'node:path';
import { getIdeLockFiles, parseLockFile, getIdeHost, cleanStaleLockFiles, } from './lock-files.js';
import { getPlatform, getIdeDisplayName, isRunningInIdeTerminal, isAncestorProcess, } from './detector.js';
import { WslPathConverter, isPathForDistro } from './wsl.js';
/**
 * Gets the current working directory.
 *
 * @returns The current working directory path
 */
function getCwd() {
    return process.cwd();
}
/**
 * Abort controller for connection waiting operations
 */
let connectionWaitAbortController = null;
/**
 * Creates a new abort controller for async operations.
 *
 * @returns A new AbortController instance
 */
function createAbortController() {
    return new AbortController();
}
/**
 * Gets all valid IDE connections for the current workspace.
 *
 * Scans lock files and filters connections based on:
 * - Workspace folder matching
 * - Process ancestry (in IDE terminals)
 * - Port matching (for specific SSE port)
 *
 * @param includeInvalid - If true, include connections that don't match the current workspace
 * @returns Promise resolving to array of IDE connections
 *
 * @example
 * ```typescript
 * const connections = await getIdeConnections();
 * // Returns: [{ url: 'http://127.0.0.1:3000/sse', name: 'VS Code', ... }]
 * ```
 */
export async function getIdeConnections(includeInvalid = false) {
    const connections = [];
    try {
        const ssePortEnv = process.env.CLAUDE_CODE_SSE_PORT;
        const ssePort = ssePortEnv ? parseInt(ssePortEnv, 10) : null;
        const cwd = getCwd();
        const platform = getPlatform();
        const lockFiles = getIdeLockFiles();
        for (const lockFileInfo of lockFiles) {
            const parsed = parseLockFile(lockFileInfo.path);
            if (!parsed) {
                continue;
            }
            // In IDE terminals, check process ancestry
            const inIdeTerminal = isRunningInIdeTerminal();
            if (platform !== 'wsl' && inIdeTerminal) {
                if (!parsed.pid || !isAncestorProcess(parsed.pid)) {
                    continue;
                }
            }
            // Check if this connection is valid for the current workspace
            let isValid = false;
            // Skip validation check if explicitly disabled
            if (process.env.CLAUDE_CODE_IDE_SKIP_VALID_CHECK === 'true') {
                isValid = true;
            }
            else if (parsed.port === ssePort) {
                // Direct port match
                isValid = true;
            }
            else {
                // Check workspace folder matching
                isValid = parsed.workspaceFolders.some((folder) => {
                    if (!folder) {
                        return false;
                    }
                    let resolvedFolder = folder;
                    // Handle WSL path conversion
                    if (platform === 'wsl' &&
                        parsed.runningInWindows &&
                        process.env.WSL_DISTRO_NAME) {
                        // Check if path is for this WSL distro
                        if (!isPathForDistro(folder, process.env.WSL_DISTRO_NAME)) {
                            return false;
                        }
                        // Try direct path comparison first
                        const directResolved = resolve(resolvedFolder);
                        if (cwd === directResolved ||
                            cwd.startsWith(directResolved + sep)) {
                            return true;
                        }
                        // Convert Windows path to WSL path
                        const converter = new WslPathConverter(process.env.WSL_DISTRO_NAME);
                        const convertedPath = converter.toLocalPath(folder);
                        if (convertedPath) {
                            resolvedFolder = convertedPath;
                        }
                    }
                    const resolved = resolve(resolvedFolder);
                    // Case-insensitive comparison on Windows
                    if (platform === 'windows') {
                        const cwdNormalized = cwd.replace(/^[a-zA-Z]:/, (match) => match.toUpperCase());
                        const resolvedNormalized = resolved.replace(/^[a-zA-Z]:/, (match) => match.toUpperCase());
                        return (cwdNormalized === resolvedNormalized ||
                            cwdNormalized.startsWith(resolvedNormalized + sep));
                    }
                    return cwd === resolved || cwd.startsWith(resolved + sep);
                });
            }
            // Skip invalid connections unless requested
            if (!isValid && !includeInvalid) {
                continue;
            }
            // Get IDE display name
            const terminalType = inIdeTerminal
                ? process.env.TERM_PROGRAM
                : undefined;
            const ideName = parsed.ideName ?? (inIdeTerminal ? getIdeDisplayName(terminalType ?? null) : 'IDE');
            // Get host address
            const host = await getIdeHost(parsed.runningInWindows, parsed.port);
            // Build connection URL
            let url;
            if (parsed.useWebSocket) {
                url = `ws://${host}:${parsed.port}`;
            }
            else {
                url = `http://${host}:${parsed.port}/sse`;
            }
            connections.push({
                url,
                name: ideName,
                workspaceFolders: parsed.workspaceFolders,
                port: parsed.port,
                isValid,
                authToken: parsed.authToken,
                ideRunningInWindows: parsed.runningInWindows,
            });
        }
        // If we have a specific SSE port, prioritize that connection
        if (!includeInvalid && ssePort) {
            const portMatch = connections.filter((conn) => conn.isValid && conn.port === ssePort);
            if (portMatch.length === 1) {
                return portMatch;
            }
        }
    }
    catch {
        // Return empty array on error
    }
    return connections;
}
/**
 * Waits for an IDE connection to become available.
 *
 * Polls for connections at regular intervals until one is found
 * or the timeout is reached.
 *
 * @param timeoutMs - Maximum time to wait in milliseconds (default: 30000)
 * @param pollIntervalMs - Interval between polls in milliseconds (default: 1000)
 * @returns Promise resolving to the first available connection or null
 *
 * @example
 * ```typescript
 * const connection = await waitForIdeConnection(10000);
 * if (connection) {
 *   console.log('Connected to:', connection.name);
 * }
 * ```
 */
export async function waitForIdeConnection(timeoutMs = 30000, pollIntervalMs = 1000) {
    // Abort any previous wait operation
    if (connectionWaitAbortController) {
        connectionWaitAbortController.abort();
    }
    connectionWaitAbortController = createAbortController();
    const signal = connectionWaitAbortController.signal;
    // Clean up stale lock files first
    await cleanStaleLockFiles();
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs && !signal.aborted) {
        const connections = await getIdeConnections(false);
        if (signal.aborted) {
            return null;
        }
        if (connections.length === 1) {
            return connections[0] ?? null;
        }
        // Wait before next poll
        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
    return null;
}
/**
 * Cancels any pending waitForIdeConnection operation.
 */
export function cancelConnectionWait() {
    if (connectionWaitAbortController) {
        connectionWaitAbortController.abort();
        connectionWaitAbortController = null;
    }
}
/**
 * Sends a notification to the IDE that we've connected.
 *
 * @param client - The connected MCP client
 * @returns Promise that resolves when notification is sent
 */
export async function notifyIdeConnected(client) {
    await client.notification({
        method: 'ide_connected',
        params: {
            pid: process.pid,
        },
    });
}
/**
 * Checks if any connection state includes an IDE connection.
 *
 * @param connectionStates - Array of connection states to check
 * @returns True if an IDE connection is present
 *
 * @example
 * ```typescript
 * const hasIde = hasIdeConnection(states);
 * // Returns: true if IDE is connected
 * ```
 */
export function hasIdeConnection(connectionStates) {
    return connectionStates.some((state) => state.type === 'connected' && state.name === 'ide');
}
/**
 * Finds the IDE connection from a list of connection states.
 *
 * @param connectionStates - Array of connection states to search
 * @returns The IDE connection state or undefined
 */
export function findIdeConnection(connectionStates) {
    if (!connectionStates) {
        return undefined;
    }
    const ideConnection = connectionStates.find((state) => state.type === 'connected' && state.name === 'ide');
    return ideConnection?.type === 'connected'
        ? ideConnection
        : undefined;
}
/**
 * Gets the IDE name from the connection state.
 *
 * @param connectionState - The connection state to extract IDE name from
 * @returns The IDE name or null
 */
export function getIdeNameFromConnection(connectionState) {
    const config = connectionState?.config;
    if (config?.type === 'sse-ide' || config?.type === 'ws-ide') {
        return config.ideName ?? null;
    }
    // Fallback to terminal-based detection
    if (isRunningInIdeTerminal()) {
        const terminalType = process.env.TERM_PROGRAM;
        return getIdeDisplayName(terminalType ?? null);
    }
    return null;
}
/**
 * Gets the IDE name from a list of connection states.
 *
 * @param connectionStates - Array of connection states
 * @returns The IDE name or null
 */
export function getIdeNameFromConnections(connectionStates) {
    const ideConnection = connectionStates.find((state) => state.type === 'connected' && state.name === 'ide');
    return getIdeNameFromConnection(ideConnection);
}
//# sourceMappingURL=connections.js.map