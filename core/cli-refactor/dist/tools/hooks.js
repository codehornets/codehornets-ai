/**
 * Hooks Module
 *
 * Provides a hook system for registering and executing lifecycle callbacks
 * for various tool and session events.
 */
import { spawn } from 'child_process';
// =============================================================================
// Constants
// =============================================================================
/**
 * Default hook execution timeout in milliseconds
 */
export const DEFAULT_HOOK_TIMEOUT = 60000;
/**
 * Maximum output size from hook commands in bytes
 */
export const MAX_HOOK_OUTPUT_SIZE = 1024 * 1024; // 1MB
/**
 * Hook event type names
 */
export const HOOK_EVENT_TYPES = [
    'PreToolExecution',
    'PostToolExecution',
    'Notification',
    'Stop',
    'SessionStart',
    'SessionEnd',
    'PreCompact',
    'UserPromptSubmit',
];
// =============================================================================
// Hook Registry
// =============================================================================
/**
 * Global hook settings storage
 */
let hookSettings = {};
/**
 * Registered callback functions
 */
const callbackRegistry = new Map();
// =============================================================================
// Hook Registration
// =============================================================================
/**
 * Registers hooks from a settings object
 *
 * @param settings - Hook settings to register
 */
export function registerHooks(settings) {
    hookSettings = { ...hookSettings, ...settings };
}
/**
 * Registers a single hook for an event type
 *
 * @param eventType - Event type to register for
 * @param config - Hook configuration
 */
export function registerHook(eventType, config) {
    if (!hookSettings[eventType]) {
        hookSettings[eventType] = [];
    }
    hookSettings[eventType].push(config);
}
/**
 * Registers a callback function that can be referenced by callback hooks
 *
 * @param name - Callback name
 * @param callback - Callback function
 */
export function registerCallback(name, callback) {
    callbackRegistry.set(name, callback);
}
/**
 * Unregisters a callback function
 *
 * @param name - Callback name to unregister
 */
export function unregisterCallback(name) {
    callbackRegistry.delete(name);
}
/**
 * Clears all registered hooks
 */
export function clearHooks() {
    hookSettings = {};
}
/**
 * Clears all registered callbacks
 */
export function clearCallbacks() {
    callbackRegistry.clear();
}
/**
 * Gets all hooks registered for an event type
 *
 * @param eventType - Event type to get hooks for
 * @returns Array of hook configurations
 */
export function getHooksForEvent(eventType) {
    return hookSettings[eventType] || [];
}
// =============================================================================
// Hook Matching
// =============================================================================
/**
 * Checks if a hook matches the given input based on its matcher pattern
 *
 * @param hook - Hook to check
 * @param input - Input to match against
 * @returns True if hook matches
 */
export function matchesHook(hook, input) {
    if (!hook.matcher) {
        return true; // No matcher means match all
    }
    // For tool hooks, match against tool name
    if ('tool_name' in input) {
        const pattern = new RegExp(hook.matcher);
        return pattern.test(input.tool_name);
    }
    // For notification hooks, match against notification type
    if ('notification_type' in input) {
        const pattern = new RegExp(hook.matcher);
        return pattern.test(input.notification_type);
    }
    return true;
}
/**
 * Gets matching hooks for an event and input
 *
 * @param eventType - Event type
 * @param input - Input to match
 * @returns Matching hooks
 */
export function getMatchingHooks(eventType, input) {
    const configs = getHooksForEvent(eventType);
    const matchingHooks = [];
    for (const config of configs) {
        // Check if config-level matcher matches
        if (config.matcher) {
            if ('tool_name' in input) {
                const pattern = new RegExp(config.matcher);
                if (!pattern.test(input.tool_name)) {
                    continue;
                }
            }
        }
        // Add all hooks from this config
        for (const hook of config.hooks) {
            if (matchesHook(hook, input)) {
                matchingHooks.push(hook);
            }
        }
    }
    return matchingHooks;
}
// =============================================================================
// Hook Execution
// =============================================================================
/**
 * Executes a command hook
 *
 * @param hook - Command hook to execute
 * @param input - Input data
 * @returns Execution result
 */
async function executeCommandHook(hook, input) {
    const timeout = hook.timeout || DEFAULT_HOOK_TIMEOUT;
    return new Promise((resolve) => {
        let stdout = '';
        let stderr = '';
        let killed = false;
        // Spawn the command
        const child = spawn(hook.command, [], {
            shell: true,
            env: {
                ...process.env,
                HOOK_INPUT: JSON.stringify(input),
            },
        });
        // Set timeout
        const timeoutId = setTimeout(() => {
            killed = true;
            child.kill('SIGTERM');
            resolve({
                outcome: 'non_blocking_error',
                hook,
                message: {
                    type: 'hook_non_blocking_error',
                    hookName: hook.command,
                    hookEvent: input.hook_event_name,
                    stderr: 'Hook execution timed out',
                    stdout,
                    exitCode: -1,
                },
            });
        }, timeout);
        // Collect output
        child.stdout?.on('data', (data) => {
            stdout += data.toString();
            if (stdout.length > MAX_HOOK_OUTPUT_SIZE) {
                stdout = stdout.slice(-MAX_HOOK_OUTPUT_SIZE);
            }
        });
        child.stderr?.on('data', (data) => {
            stderr += data.toString();
            if (stderr.length > MAX_HOOK_OUTPUT_SIZE) {
                stderr = stderr.slice(-MAX_HOOK_OUTPUT_SIZE);
            }
        });
        // Handle completion
        child.on('close', (code) => {
            clearTimeout(timeoutId);
            if (killed)
                return;
            const exitCode = code ?? 0;
            // Try to parse JSON output
            let jsonOutput = null;
            try {
                const trimmedStdout = stdout.trim();
                if (trimmedStdout.startsWith('{')) {
                    jsonOutput = JSON.parse(trimmedStdout);
                }
            }
            catch {
                // Not JSON output, that's fine
            }
            // Check for blocking errors (non-zero exit code)
            if (exitCode !== 0) {
                // Check if it's a blocking error
                if (jsonOutput?.continue === false) {
                    resolve({
                        outcome: 'blocking',
                        hook,
                        blockingError: {
                            blockingError: stderr || jsonOutput.stopReason || 'Hook blocked execution',
                            command: hook.command,
                        },
                        preventContinuation: true,
                        stopReason: jsonOutput.stopReason,
                    });
                }
                else {
                    resolve({
                        outcome: 'non_blocking_error',
                        hook,
                        message: {
                            type: 'hook_non_blocking_error',
                            hookName: hook.command,
                            hookEvent: input.hook_event_name,
                            stderr,
                            stdout,
                            exitCode,
                        },
                    });
                }
                return;
            }
            // Success
            resolve({
                outcome: 'success',
                hook,
                message: {
                    type: 'hook_success',
                    hookName: hook.command,
                    hookEvent: input.hook_event_name,
                    stdout,
                    stderr,
                    exitCode,
                    content: jsonOutput?.systemMessage,
                },
                permissionBehavior: jsonOutput?.permissionDecision,
                updatedInput: jsonOutput?.hookSpecificOutput?.updatedInput,
                additionalContext: jsonOutput?.hookSpecificOutput?.additionalContext,
            });
        });
        child.on('error', (error) => {
            clearTimeout(timeoutId);
            if (killed)
                return;
            resolve({
                outcome: 'non_blocking_error',
                hook,
                message: {
                    type: 'hook_non_blocking_error',
                    hookName: hook.command,
                    hookEvent: input.hook_event_name,
                    stderr: error.message,
                    stdout: '',
                    exitCode: -1,
                },
            });
        });
    });
}
/**
 * Executes a callback hook
 *
 * @param hook - Callback hook to execute
 * @param input - Input data
 * @returns Execution result
 */
async function executeCallbackHook(hook, input) {
    const callback = callbackRegistry.get(hook.callback);
    if (!callback) {
        return {
            outcome: 'non_blocking_error',
            hook,
            message: {
                type: 'hook_non_blocking_error',
                hookName: hook.callback,
                hookEvent: input.hook_event_name,
                stderr: `Callback not found: ${hook.callback}`,
                stdout: '',
                exitCode: -1,
            },
        };
    }
    try {
        const result = await callback(input);
        if (result.continue === false) {
            return {
                outcome: 'blocking',
                hook,
                blockingError: {
                    blockingError: result.stopReason || 'Callback blocked execution',
                    command: hook.callback,
                },
                preventContinuation: true,
                stopReason: result.stopReason,
            };
        }
        return {
            outcome: 'success',
            hook,
            message: {
                type: 'hook_success',
                hookName: hook.callback,
                hookEvent: input.hook_event_name,
                content: result.systemMessage,
            },
            permissionBehavior: result.permissionDecision,
            additionalContext: result.hookSpecificOutput?.additionalContext,
        };
    }
    catch (error) {
        return {
            outcome: 'non_blocking_error',
            hook,
            message: {
                type: 'hook_non_blocking_error',
                hookName: hook.callback,
                hookEvent: input.hook_event_name,
                stderr: error instanceof Error ? error.message : String(error),
                stdout: '',
                exitCode: -1,
            },
        };
    }
}
/**
 * Executes a single hook
 *
 * @param hook - Hook to execute
 * @param input - Input data
 * @returns Execution result
 */
export async function executeHookSingle(hook, input) {
    switch (hook.type) {
        case 'command':
            return executeCommandHook(hook, input);
        case 'callback':
            return executeCallbackHook(hook, input);
        case 'prompt':
            // Prompt hooks are handled differently (sent to LLM)
            return {
                outcome: 'success',
                hook,
                message: {
                    type: 'hook_success',
                    hookName: 'prompt',
                    hookEvent: input.hook_event_name,
                },
            };
        default:
            return {
                outcome: 'non_blocking_error',
                hook,
                message: {
                    type: 'hook_non_blocking_error',
                    hookName: 'unknown',
                    hookEvent: input.hook_event_name,
                    stderr: `Unknown hook type: ${hook.type}`,
                    stdout: '',
                    exitCode: -1,
                },
            };
    }
}
/**
 * Executes all hooks for an event
 *
 * @param eventType - Event type
 * @param input - Input data
 * @returns Array of execution results
 */
export async function executeHooks(eventType, input) {
    const hooks = getMatchingHooks(eventType, input);
    const results = [];
    for (const hook of hooks) {
        const result = await executeHookSingle(hook, input);
        results.push(result);
        // Stop on blocking error
        if (result.outcome === 'blocking' && result.preventContinuation) {
            break;
        }
    }
    return results;
}
// =============================================================================
// Helper Functions
// =============================================================================
/**
 * Creates a PreToolExecution input
 */
export function createPreToolInput(toolName, toolInput, sessionId, cwd) {
    return {
        hook_event_name: 'PreToolUse',
        tool_name: toolName,
        tool_input: toolInput,
        session_id: sessionId,
        cwd,
    };
}
/**
 * Creates a PostToolExecution input
 */
export function createPostToolInput(toolName, toolInput, toolOutput, sessionId, cwd) {
    return {
        hook_event_name: 'PostToolUse',
        tool_name: toolName,
        tool_input: toolInput,
        tool_output: toolOutput,
        session_id: sessionId,
        cwd,
    };
}
/**
 * Creates a Notification input
 */
export function createNotificationInput(notificationType, message, sessionId, cwd) {
    return {
        hook_event_name: 'Notification',
        notification_type: notificationType,
        message,
        session_id: sessionId,
        cwd,
    };
}
/**
 * Creates a Stop input
 */
export function createStopInput(reason, sessionId, cwd) {
    return {
        hook_event_name: 'Stop',
        reason,
        session_id: sessionId,
        cwd,
    };
}
/**
 * Checks if any hook result is blocking
 */
export function hasBlockingResult(results) {
    return results.some((r) => r.outcome === 'blocking' && r.preventContinuation);
}
/**
 * Gets the blocking error from results
 */
export function getBlockingError(results) {
    const blocking = results.find((r) => r.outcome === 'blocking' && r.preventContinuation);
    return blocking?.outcome === 'blocking'
        ? blocking.blockingError.blockingError
        : undefined;
}
/**
 * Gets all additional context from hook results
 */
export function getAdditionalContext(results) {
    return results
        .filter((r) => r.outcome === 'success' && !!r.additionalContext)
        .map((r) => r.additionalContext);
}
//# sourceMappingURL=hooks.js.map