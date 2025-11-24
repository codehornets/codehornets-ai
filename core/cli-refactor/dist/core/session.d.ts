/**
 * Session state management module
 * Manages session ID, costs, usage tracking, and model selection
 */
import { EnvVarValidator, SettingSource } from './config.js';
/** Token usage for a specific model */
export interface ModelUsage {
    inputTokens: number;
    outputTokens: number;
    cacheReadInputTokens: number;
    cacheCreationInputTokens: number;
    webSearchRequests: number;
    costUSD: number;
    contextWindow: number;
}
/** API usage response structure */
export interface ApiUsage {
    input_tokens: number;
    output_tokens: number;
    cache_read_input_tokens?: number;
    cache_creation_input_tokens?: number;
    server_tool_use?: {
        web_search_requests?: number;
    };
}
/** Client type for the session */
export type ClientType = 'cli' | 'claude-vscode' | 'api';
/** In-memory error log entry */
export interface ErrorLogEntry {
    timestamp: number;
    message: string;
    stack?: string;
}
/** Counter interface for metrics */
export interface Counter {
    add(value: number, attributes?: Record<string, unknown>): void;
}
/** Plugin definition */
export interface InlinePlugin {
    name: string;
    [key: string]: unknown;
}
/** Session state interface */
export interface SessionState {
    /** Original working directory at session start */
    originalCwd: string;
    /** Current working directory */
    cwd: string;
    /** Total cost in USD */
    totalCostUSD: number;
    /** Total API request duration in ms */
    totalAPIDuration: number;
    /** Total API duration excluding retries */
    totalAPIDurationWithoutRetries: number;
    /** Total tool execution duration in ms */
    totalToolDuration: number;
    /** Session start timestamp */
    startTime: number;
    /** Last user interaction timestamp */
    lastInteractionTime: number;
    /** Total lines added during session */
    totalLinesAdded: number;
    /** Total lines removed during session */
    totalLinesRemoved: number;
    /** Whether any model cost is unknown */
    hasUnknownModelCost: boolean;
    /** Per-model usage statistics */
    modelUsage: Record<string, ModelUsage>;
    /** Override model for main loop */
    mainLoopModelOverride: string | undefined;
    /** Whether rate limit fallback is active */
    maxRateLimitFallbackActive: boolean;
    /** Initial main loop model */
    initialMainLoopModel: string | null;
    /** Model strings configuration */
    modelStrings: unknown;
    /** Whether session is non-interactive */
    isNonInteractiveSession: boolean;
    /** Whether session is interactive */
    isInteractive: boolean;
    /** Client type */
    clientType: ClientType;
    /** Session ingress token */
    sessionIngressToken: string | undefined;
    /** OAuth token from file descriptor */
    oauthTokenFromFd: string | undefined;
    /** API key from file descriptor */
    apiKeyFromFd: string | undefined;
    /** Path to flag settings file */
    flagSettingsPath: string | undefined;
    /** Allowed setting sources */
    allowedSettingSources: SettingSource[];
    /** Meter instance for metrics */
    meter: unknown;
    /** Session counter metric */
    sessionCounter: Counter | null;
    /** Lines of code counter metric */
    locCounter: Counter | null;
    /** Pull request counter metric */
    prCounter: Counter | null;
    /** Commit counter metric */
    commitCounter: Counter | null;
    /** Cost counter metric */
    costCounter: Counter | null;
    /** Token counter metric */
    tokenCounter: Counter | null;
    /** Code edit tool decision counter */
    codeEditToolDecisionCounter: Counter | null;
    /** Active time counter */
    activeTimeCounter: Counter | null;
    /** Session ID */
    sessionId: string;
    /** Logger provider */
    loggerProvider: unknown;
    /** Event logger */
    eventLogger: unknown;
    /** Meter provider */
    meterProvider: unknown;
    /** Tracer provider */
    tracerProvider: unknown;
    /** Map of agent colors */
    agentColorMap: Map<string, string>;
    /** Agent color index */
    agentColorIndex: number;
    /** Environment variable validators */
    envVarValidators: EnvVarValidator[];
    /** Last API request details */
    lastAPIRequest: unknown;
    /** In-memory error log */
    inMemoryErrorLog: ErrorLogEntry[];
    /** Inline plugins */
    inlinePlugins: InlinePlugin[];
}
/**
 * Creates the initial session state
 * @returns Fresh session state object
 */
export declare function createInitialState(): SessionState;
/**
 * Gets the current session ID
 * @returns Current session ID
 */
export declare function getSessionId(): string;
/**
 * Generates a new session ID
 * @returns New session ID
 */
export declare function generateNewSessionId(): string;
/**
 * Sets the session ID explicitly
 * @param id - Session ID to set
 */
export declare function setSessionId(id: string): void;
/**
 * Gets the original working directory at session start
 * @returns Original working directory path
 */
export declare function getOriginalCwd(): string;
/**
 * Gets the current working directory
 * @returns Current working directory path
 */
export declare function getCwd(): string;
/**
 * Sets the current working directory
 * @param cwd - New working directory path
 */
export declare function setCwd(cwd: string): void;
/**
 * Adds API duration to the totals
 * @param duration - Total duration in ms
 * @param durationWithoutRetries - Duration excluding retries in ms
 */
export declare function addApiDuration(duration: number, durationWithoutRetries: number): void;
/**
 * Records API usage and cost
 * @param costUSD - Cost in USD
 * @param usage - Token usage statistics
 * @param modelString - Model identifier
 */
export declare function recordApiUsage(costUSD: number, usage: ApiUsage, modelString: string): void;
/**
 * Gets the total cost in USD
 * @returns Total cost
 */
export declare function getTotalCost(): number;
/**
 * Gets the total API duration in ms
 * @returns Total API duration
 */
export declare function getTotalApiDuration(): number;
/**
 * Gets the session elapsed time in ms
 * @returns Elapsed time since session start
 */
export declare function getSessionElapsedTime(): number;
/**
 * Gets the total tool duration in ms
 * @returns Total tool execution duration
 */
export declare function getTotalToolDuration(): number;
/**
 * Adds to the total tool duration
 * @param duration - Duration to add in ms
 */
export declare function addToolDuration(duration: number): void;
/**
 * Updates the last interaction time to now
 */
export declare function updateLastInteractionTime(): void;
/**
 * Gets the last interaction timestamp
 * @returns Last interaction time
 */
export declare function getLastInteractionTime(): number;
/**
 * Adds to line counts
 * @param added - Lines added
 * @param removed - Lines removed
 */
export declare function addLineChanges(added: number, removed: number): void;
/**
 * Gets total lines added
 * @returns Lines added count
 */
export declare function getTotalLinesAdded(): number;
/**
 * Gets total lines removed
 * @returns Lines removed count
 */
export declare function getTotalLinesRemoved(): number;
/**
 * Gets total input tokens across all models
 * @returns Total input tokens
 */
export declare function getTotalInputTokens(): number;
/**
 * Gets total output tokens across all models
 * @returns Total output tokens
 */
export declare function getTotalOutputTokens(): number;
/**
 * Gets total cache read input tokens
 * @returns Total cache read tokens
 */
export declare function getTotalCacheReadTokens(): number;
/**
 * Gets total cache creation input tokens
 * @returns Total cache creation tokens
 */
export declare function getTotalCacheCreationTokens(): number;
/**
 * Gets total web search requests
 * @returns Total web search count
 */
export declare function getTotalWebSearchRequests(): number;
/**
 * Gets model usage statistics
 * @returns Map of model strings to usage
 */
export declare function getModelUsage(): Record<string, ModelUsage>;
/**
 * Marks that unknown model cost was encountered
 */
export declare function markUnknownModelCost(): void;
/**
 * Checks if any model had unknown cost
 * @returns True if unknown cost was encountered
 */
export declare function hasUnknownModelCost(): boolean;
/**
 * Gets the main loop model override
 * @returns Override model string or undefined
 */
export declare function getMainLoopModelOverride(): string | undefined;
/**
 * Gets the initial main loop model
 * @returns Initial model string or null
 */
export declare function getInitialMainLoopModel(): string | null;
/**
 * Sets the main loop model override
 * @param model - Model string to override with
 */
export declare function setMainLoopModelOverride(model: string | undefined): void;
/**
 * Sets the initial main loop model
 * @param model - Initial model string
 */
export declare function setInitialMainLoopModel(model: string): void;
/**
 * Checks if rate limit fallback is active
 * @returns True if fallback is active
 */
export declare function isRateLimitFallbackActive(): boolean;
/**
 * Sets the rate limit fallback state
 * @param active - Whether fallback is active
 */
export declare function setRateLimitFallbackActive(active: boolean): void;
/**
 * Gets the model strings configuration
 * @returns Model strings object
 */
export declare function getModelStrings(): unknown;
/**
 * Sets the model strings configuration
 * @param modelStrings - Model strings to set
 */
export declare function setModelStrings(modelStrings: unknown): void;
/**
 * Checks if session is non-interactive
 * @returns True if non-interactive
 */
export declare function isNonInteractive(): boolean;
/**
 * Sets the non-interactive session flag
 * @param nonInteractive - Whether session is non-interactive
 */
export declare function setNonInteractive(nonInteractive: boolean): void;
/**
 * Checks if session is interactive
 * @returns True if interactive
 */
export declare function isInteractive(): boolean;
/**
 * Sets the interactive session flag
 * @param interactive - Whether session is interactive
 */
export declare function setInteractive(interactive: boolean): void;
/**
 * Gets the client type
 * @returns Client type string
 */
export declare function getClientType(): ClientType;
/**
 * Sets the client type
 * @param clientType - Client type to set
 */
export declare function setClientType(clientType: ClientType): void;
/**
 * Checks if running in headless mode
 * @returns True if headless (non-interactive and not vscode)
 */
export declare function isHeadless(): boolean;
/**
 * Sets up metrics counters
 * @param meter - Meter instance
 * @param createCounter - Function to create counters
 */
export declare function setupMetrics(meter: unknown, createCounter: (name: string, options: {
    description: string;
    unit?: string;
}) => Counter): void;
/**
 * Gets the session counter
 * @returns Session counter or null
 */
export declare function getSessionCounter(): Counter | null;
/**
 * Gets the lines of code counter
 * @returns LOC counter or null
 */
export declare function getLocCounter(): Counter | null;
/**
 * Gets the pull request counter
 * @returns PR counter or null
 */
export declare function getPrCounter(): Counter | null;
/**
 * Gets the commit counter
 * @returns Commit counter or null
 */
export declare function getCommitCounter(): Counter | null;
/**
 * Gets the cost counter
 * @returns Cost counter or null
 */
export declare function getCostCounter(): Counter | null;
/**
 * Gets the token counter
 * @returns Token counter or null
 */
export declare function getTokenCounter(): Counter | null;
/**
 * Gets the code edit tool decision counter
 * @returns Decision counter or null
 */
export declare function getCodeEditToolDecisionCounter(): Counter | null;
/**
 * Gets the active time counter
 * @returns Active time counter or null
 */
export declare function getActiveTimeCounter(): Counter | null;
/**
 * Gets the logger provider
 * @returns Logger provider or null
 */
export declare function getLoggerProvider(): unknown;
/**
 * Sets the logger provider
 * @param provider - Logger provider to set
 */
export declare function setLoggerProvider(provider: unknown): void;
/**
 * Gets the event logger
 * @returns Event logger or null
 */
export declare function getEventLogger(): unknown;
/**
 * Sets the event logger
 * @param logger - Event logger to set
 */
export declare function setEventLogger(logger: unknown): void;
/**
 * Gets the meter provider
 * @returns Meter provider or null
 */
export declare function getMeterProvider(): unknown;
/**
 * Sets the meter provider
 * @param provider - Meter provider to set
 */
export declare function setMeterProvider(provider: unknown): void;
/**
 * Gets the tracer provider
 * @returns Tracer provider or null
 */
export declare function getTracerProvider(): unknown;
/**
 * Sets the tracer provider
 * @param provider - Tracer provider to set
 */
export declare function setTracerProvider(provider: unknown): void;
/**
 * Gets the agent color map
 * @returns Map of agent names to colors
 */
export declare function getAgentColorMap(): Map<string, string>;
/**
 * Gets the flag settings path
 * @returns Path to flag settings or undefined
 */
export declare function getFlagSettingsPath(): string | undefined;
/**
 * Sets the flag settings path
 * @param path - Path to set
 */
export declare function setFlagSettingsPath(settingsPath: string | undefined): void;
/**
 * Gets the session ingress token
 * @returns Ingress token or undefined
 */
export declare function getSessionIngressToken(): string | undefined;
/**
 * Sets the session ingress token
 * @param token - Token to set
 */
export declare function setSessionIngressToken(token: string | undefined): void;
/**
 * Gets the OAuth token from file descriptor
 * @returns OAuth token or undefined
 */
export declare function getOauthTokenFromFd(): string | undefined;
/**
 * Sets the OAuth token from file descriptor
 * @param token - Token to set
 */
export declare function setOauthTokenFromFd(token: string | undefined): void;
/**
 * Gets the API key from file descriptor
 * @returns API key or undefined
 */
export declare function getApiKeyFromFd(): string | undefined;
/**
 * Sets the API key from file descriptor
 * @param key - API key to set
 */
export declare function setApiKeyFromFd(key: string | undefined): void;
/**
 * Gets allowed setting sources
 * @returns Array of allowed setting sources
 */
export declare function getAllowedSettingSources(): SettingSource[];
/**
 * Sets allowed setting sources
 * @param sources - Sources to allow
 */
export declare function setAllowedSettingSources(sources: SettingSource[]): void;
/**
 * Gets the in-memory error log
 * @returns Copy of error log entries
 */
export declare function getInMemoryErrorLog(): ErrorLogEntry[];
/**
 * Adds an error to the in-memory log
 * @param entry - Error entry to add
 */
export declare function addErrorLogEntry(entry: ErrorLogEntry): void;
/**
 * Sets inline plugins
 * @param plugins - Plugins to set
 */
export declare function setInlinePlugins(plugins: InlinePlugin[]): void;
/**
 * Gets inline plugins
 * @returns Current inline plugins
 */
export declare function getInlinePlugins(): InlinePlugin[];
/**
 * Gets environment variable validators
 * @returns Array of validators
 */
export declare function getEnvVarValidators(): EnvVarValidator[];
/**
 * Sets the last API request details
 * @param request - Request details
 */
export declare function setLastApiRequest(request: unknown): void;
/**
 * Gets the last API request details
 * @returns Last request or null
 */
export declare function getLastApiRequest(): unknown;
/**
 * Resets session statistics (costs, duration, line counts)
 */
export declare function resetSessionStats(): void;
/**
 * Resets the entire session state to initial values
 */
export declare function resetSessionState(): void;
/**
 * Gets the full session state (for debugging/testing)
 * @returns Current session state
 */
export declare function getSessionState(): SessionState;
//# sourceMappingURL=session.d.ts.map