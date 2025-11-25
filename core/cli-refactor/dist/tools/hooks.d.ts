/**
 * Hooks Module
 *
 * Provides a hook system for registering and executing lifecycle callbacks
 * for various tool and session events.
 */
import type { HookEventType, Hook, HookConfig, HookSettings, HookInput, HookExecutionResult, HookJsonOutput, PreToolExecutionInput, PostToolExecutionInput, NotificationHookInput, StopHookInput } from './types.js';
/**
 * Default hook execution timeout in milliseconds
 */
export declare const DEFAULT_HOOK_TIMEOUT = 60000;
/**
 * Maximum output size from hook commands in bytes
 */
export declare const MAX_HOOK_OUTPUT_SIZE: number;
/**
 * Hook event type names
 */
export declare const HOOK_EVENT_TYPES: HookEventType[];
/**
 * Registers hooks from a settings object
 *
 * @param settings - Hook settings to register
 */
export declare function registerHooks(settings: HookSettings): void;
/**
 * Registers a single hook for an event type
 *
 * @param eventType - Event type to register for
 * @param config - Hook configuration
 */
export declare function registerHook(eventType: HookEventType, config: HookConfig): void;
/**
 * Registers a callback function that can be referenced by callback hooks
 *
 * @param name - Callback name
 * @param callback - Callback function
 */
export declare function registerCallback(name: string, callback: (input: HookInput) => Promise<HookJsonOutput>): void;
/**
 * Unregisters a callback function
 *
 * @param name - Callback name to unregister
 */
export declare function unregisterCallback(name: string): void;
/**
 * Clears all registered hooks
 */
export declare function clearHooks(): void;
/**
 * Clears all registered callbacks
 */
export declare function clearCallbacks(): void;
/**
 * Gets all hooks registered for an event type
 *
 * @param eventType - Event type to get hooks for
 * @returns Array of hook configurations
 */
export declare function getHooksForEvent(eventType: HookEventType): HookConfig[];
/**
 * Checks if a hook matches the given input based on its matcher pattern
 *
 * @param hook - Hook to check
 * @param input - Input to match against
 * @returns True if hook matches
 */
export declare function matchesHook(hook: Hook, input: HookInput): boolean;
/**
 * Gets matching hooks for an event and input
 *
 * @param eventType - Event type
 * @param input - Input to match
 * @returns Matching hooks
 */
export declare function getMatchingHooks(eventType: HookEventType, input: HookInput): Hook[];
/**
 * Executes a single hook
 *
 * @param hook - Hook to execute
 * @param input - Input data
 * @returns Execution result
 */
export declare function executeHookSingle(hook: Hook, input: HookInput): Promise<HookExecutionResult>;
/**
 * Executes all hooks for an event
 *
 * @param eventType - Event type
 * @param input - Input data
 * @returns Array of execution results
 */
export declare function executeHooks(eventType: HookEventType, input: HookInput): Promise<HookExecutionResult[]>;
/**
 * Creates a PreToolExecution input
 */
export declare function createPreToolInput(toolName: string, toolInput: Record<string, unknown>, sessionId: string, cwd: string): PreToolExecutionInput;
/**
 * Creates a PostToolExecution input
 */
export declare function createPostToolInput(toolName: string, toolInput: Record<string, unknown>, toolOutput: unknown, sessionId: string, cwd: string): PostToolExecutionInput;
/**
 * Creates a Notification input
 */
export declare function createNotificationInput(notificationType: string, message: string, sessionId: string, cwd: string): NotificationHookInput;
/**
 * Creates a Stop input
 */
export declare function createStopInput(reason: string, sessionId: string, cwd: string): StopHookInput;
/**
 * Checks if any hook result is blocking
 */
export declare function hasBlockingResult(results: HookExecutionResult[]): boolean;
/**
 * Gets the blocking error from results
 */
export declare function getBlockingError(results: HookExecutionResult[]): string | undefined;
/**
 * Gets all additional context from hook results
 */
export declare function getAdditionalContext(results: HookExecutionResult[]): string[];
//# sourceMappingURL=hooks.d.ts.map