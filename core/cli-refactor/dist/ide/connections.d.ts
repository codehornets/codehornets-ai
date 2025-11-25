/**
 * IDE Connection Management
 *
 * Handles discovering and managing connections to running IDEs.
 * Supports both HTTP/SSE and WebSocket connections.
 */
import type { ConnectionState, IdeConnection, McpClientState } from './types.js';
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
export declare function getIdeConnections(includeInvalid?: boolean): Promise<IdeConnection[]>;
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
export declare function waitForIdeConnection(timeoutMs?: number, pollIntervalMs?: number): Promise<IdeConnection | null>;
/**
 * Cancels any pending waitForIdeConnection operation.
 */
export declare function cancelConnectionWait(): void;
/**
 * Sends a notification to the IDE that we've connected.
 *
 * @param client - The connected MCP client
 * @returns Promise that resolves when notification is sent
 */
export declare function notifyIdeConnected(client: {
    notification(params: {
        method: string;
        params: unknown;
    }): Promise<void>;
}): Promise<void>;
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
export declare function hasIdeConnection(connectionStates: ConnectionState[]): boolean;
/**
 * Finds the IDE connection from a list of connection states.
 *
 * @param connectionStates - Array of connection states to search
 * @returns The IDE connection state or undefined
 */
export declare function findIdeConnection(connectionStates: ConnectionState[] | undefined): (ConnectionState & {
    type: 'connected';
}) | undefined;
/**
 * Gets the IDE name from the connection state.
 *
 * @param connectionState - The connection state to extract IDE name from
 * @returns The IDE name or null
 */
export declare function getIdeNameFromConnection(connectionState: McpClientState | undefined): string | null;
/**
 * Gets the IDE name from a list of connection states.
 *
 * @param connectionStates - Array of connection states
 * @returns The IDE name or null
 */
export declare function getIdeNameFromConnections(connectionStates: ConnectionState[]): string | null;
//# sourceMappingURL=connections.d.ts.map