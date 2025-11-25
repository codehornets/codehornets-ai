/**
 * Session state management module
 * Manages session ID, costs, usage tracking, and model selection
 */
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as process from 'process';
import { bashMaxOutputLengthValidator, maxOutputTokensValidator, getContextWindow, DEFAULT_ALLOWED_SETTING_SOURCES, } from './config.js';
/**
 * Creates the initial session state
 * @returns Fresh session state object
 */
export function createInitialState() {
    let cwd = '';
    // Get real path of current working directory
    if (typeof process !== 'undefined' && typeof process.cwd === 'function') {
        try {
            cwd = fs.realpathSync(process.cwd());
        }
        catch {
            cwd = process.cwd();
        }
    }
    return {
        originalCwd: cwd,
        cwd,
        totalCostUSD: 0,
        totalAPIDuration: 0,
        totalAPIDurationWithoutRetries: 0,
        totalToolDuration: 0,
        startTime: Date.now(),
        lastInteractionTime: Date.now(),
        totalLinesAdded: 0,
        totalLinesRemoved: 0,
        hasUnknownModelCost: false,
        modelUsage: {},
        mainLoopModelOverride: undefined,
        maxRateLimitFallbackActive: false,
        initialMainLoopModel: null,
        modelStrings: null,
        isNonInteractiveSession: true,
        isInteractive: false,
        clientType: 'cli',
        sessionIngressToken: undefined,
        oauthTokenFromFd: undefined,
        apiKeyFromFd: undefined,
        flagSettingsPath: undefined,
        allowedSettingSources: [...DEFAULT_ALLOWED_SETTING_SOURCES],
        meter: null,
        sessionCounter: null,
        locCounter: null,
        prCounter: null,
        commitCounter: null,
        costCounter: null,
        tokenCounter: null,
        codeEditToolDecisionCounter: null,
        activeTimeCounter: null,
        sessionId: randomUUID(),
        loggerProvider: null,
        eventLogger: null,
        meterProvider: null,
        tracerProvider: null,
        agentColorMap: new Map(),
        agentColorIndex: 0,
        envVarValidators: [bashMaxOutputLengthValidator, maxOutputTokensValidator],
        lastAPIRequest: null,
        inMemoryErrorLog: [],
        inlinePlugins: [],
    };
}
// Global session state
let sessionState = createInitialState();
// ============================================================================
// Session ID Management
// ============================================================================
/**
 * Gets the current session ID
 * @returns Current session ID
 */
export function getSessionId() {
    return sessionState.sessionId;
}
/**
 * Generates a new session ID
 * @returns New session ID
 */
export function generateNewSessionId() {
    sessionState.sessionId = randomUUID();
    return sessionState.sessionId;
}
/**
 * Sets the session ID explicitly
 * @param id - Session ID to set
 */
export function setSessionId(id) {
    sessionState.sessionId = id;
}
// ============================================================================
// Working Directory Management
// ============================================================================
/**
 * Gets the original working directory at session start
 * @returns Original working directory path
 */
export function getOriginalCwd() {
    return sessionState.originalCwd;
}
/**
 * Gets the current working directory
 * @returns Current working directory path
 */
export function getCwd() {
    return sessionState.cwd;
}
/**
 * Sets the current working directory
 * @param cwd - New working directory path
 */
export function setCwd(cwd) {
    sessionState.cwd = cwd;
}
// ============================================================================
// Cost and Duration Tracking
// ============================================================================
/**
 * Adds API duration to the totals
 * @param duration - Total duration in ms
 * @param durationWithoutRetries - Duration excluding retries in ms
 */
export function addApiDuration(duration, durationWithoutRetries) {
    sessionState.totalAPIDuration += duration;
    sessionState.totalAPIDurationWithoutRetries += durationWithoutRetries;
}
/**
 * Records API usage and cost
 * @param costUSD - Cost in USD
 * @param usage - Token usage statistics
 * @param modelString - Model identifier
 */
export function recordApiUsage(costUSD, usage, modelString) {
    sessionState.totalCostUSD += costUSD;
    const existing = sessionState.modelUsage[modelString] ?? {
        inputTokens: 0,
        outputTokens: 0,
        cacheReadInputTokens: 0,
        cacheCreationInputTokens: 0,
        webSearchRequests: 0,
        costUSD: 0,
        contextWindow: 0,
    };
    existing.inputTokens += usage.input_tokens;
    existing.outputTokens += usage.output_tokens;
    existing.cacheReadInputTokens += usage.cache_read_input_tokens ?? 0;
    existing.cacheCreationInputTokens += usage.cache_creation_input_tokens ?? 0;
    existing.webSearchRequests += usage.server_tool_use?.web_search_requests ?? 0;
    existing.costUSD += costUSD;
    existing.contextWindow = getContextWindow(modelString);
    sessionState.modelUsage[modelString] = existing;
}
/**
 * Gets the total cost in USD
 * @returns Total cost
 */
export function getTotalCost() {
    return sessionState.totalCostUSD;
}
/**
 * Gets the total API duration in ms
 * @returns Total API duration
 */
export function getTotalApiDuration() {
    return sessionState.totalAPIDuration;
}
/**
 * Gets the session elapsed time in ms
 * @returns Elapsed time since session start
 */
export function getSessionElapsedTime() {
    return Date.now() - sessionState.startTime;
}
/**
 * Gets the total tool duration in ms
 * @returns Total tool execution duration
 */
export function getTotalToolDuration() {
    return sessionState.totalToolDuration;
}
/**
 * Adds to the total tool duration
 * @param duration - Duration to add in ms
 */
export function addToolDuration(duration) {
    sessionState.totalToolDuration += duration;
}
/**
 * Updates the last interaction time to now
 */
export function updateLastInteractionTime() {
    sessionState.lastInteractionTime = Date.now();
}
/**
 * Gets the last interaction timestamp
 * @returns Last interaction time
 */
export function getLastInteractionTime() {
    return sessionState.lastInteractionTime;
}
// ============================================================================
// Line Count Tracking
// ============================================================================
/**
 * Adds to line counts
 * @param added - Lines added
 * @param removed - Lines removed
 */
export function addLineChanges(added, removed) {
    sessionState.totalLinesAdded += added;
    sessionState.totalLinesRemoved += removed;
}
/**
 * Gets total lines added
 * @returns Lines added count
 */
export function getTotalLinesAdded() {
    return sessionState.totalLinesAdded;
}
/**
 * Gets total lines removed
 * @returns Lines removed count
 */
export function getTotalLinesRemoved() {
    return sessionState.totalLinesRemoved;
}
// ============================================================================
// Token Usage Statistics
// ============================================================================
/**
 * Gets total input tokens across all models
 * @returns Total input tokens
 */
export function getTotalInputTokens() {
    return Object.values(sessionState.modelUsage).reduce((sum, usage) => sum + usage.inputTokens, 0);
}
/**
 * Gets total output tokens across all models
 * @returns Total output tokens
 */
export function getTotalOutputTokens() {
    return Object.values(sessionState.modelUsage).reduce((sum, usage) => sum + usage.outputTokens, 0);
}
/**
 * Gets total cache read input tokens
 * @returns Total cache read tokens
 */
export function getTotalCacheReadTokens() {
    return Object.values(sessionState.modelUsage).reduce((sum, usage) => sum + usage.cacheReadInputTokens, 0);
}
/**
 * Gets total cache creation input tokens
 * @returns Total cache creation tokens
 */
export function getTotalCacheCreationTokens() {
    return Object.values(sessionState.modelUsage).reduce((sum, usage) => sum + usage.cacheCreationInputTokens, 0);
}
/**
 * Gets total web search requests
 * @returns Total web search count
 */
export function getTotalWebSearchRequests() {
    return Object.values(sessionState.modelUsage).reduce((sum, usage) => sum + usage.webSearchRequests, 0);
}
/**
 * Gets model usage statistics
 * @returns Map of model strings to usage
 */
export function getModelUsage() {
    return sessionState.modelUsage;
}
// ============================================================================
// Model Management
// ============================================================================
/**
 * Marks that unknown model cost was encountered
 */
export function markUnknownModelCost() {
    sessionState.hasUnknownModelCost = true;
}
/**
 * Checks if any model had unknown cost
 * @returns True if unknown cost was encountered
 */
export function hasUnknownModelCost() {
    return sessionState.hasUnknownModelCost;
}
/**
 * Gets the main loop model override
 * @returns Override model string or undefined
 */
export function getMainLoopModelOverride() {
    return sessionState.mainLoopModelOverride;
}
/**
 * Gets the initial main loop model
 * @returns Initial model string or null
 */
export function getInitialMainLoopModel() {
    return sessionState.initialMainLoopModel;
}
/**
 * Sets the main loop model override
 * @param model - Model string to override with
 */
export function setMainLoopModelOverride(model) {
    sessionState.mainLoopModelOverride = model;
}
/**
 * Sets the initial main loop model
 * @param model - Initial model string
 */
export function setInitialMainLoopModel(model) {
    sessionState.initialMainLoopModel = model;
}
/**
 * Checks if rate limit fallback is active
 * @returns True if fallback is active
 */
export function isRateLimitFallbackActive() {
    return sessionState.maxRateLimitFallbackActive;
}
/**
 * Sets the rate limit fallback state
 * @param active - Whether fallback is active
 */
export function setRateLimitFallbackActive(active) {
    sessionState.maxRateLimitFallbackActive = active;
}
/**
 * Gets the model strings configuration
 * @returns Model strings object
 */
export function getModelStrings() {
    return sessionState.modelStrings;
}
/**
 * Sets the model strings configuration
 * @param modelStrings - Model strings to set
 */
export function setModelStrings(modelStrings) {
    sessionState.modelStrings = modelStrings;
}
// ============================================================================
// Session Mode and Client
// ============================================================================
/**
 * Checks if session is non-interactive
 * @returns True if non-interactive
 */
export function isNonInteractive() {
    return sessionState.isNonInteractiveSession;
}
/**
 * Sets the non-interactive session flag
 * @param nonInteractive - Whether session is non-interactive
 */
export function setNonInteractive(nonInteractive) {
    sessionState.isNonInteractiveSession = nonInteractive;
}
/**
 * Checks if session is interactive
 * @returns True if interactive
 */
export function isInteractive() {
    return sessionState.isInteractive;
}
/**
 * Sets the interactive session flag
 * @param interactive - Whether session is interactive
 */
export function setInteractive(interactive) {
    sessionState.isInteractive = interactive;
}
/**
 * Gets the client type
 * @returns Client type string
 */
export function getClientType() {
    return sessionState.clientType;
}
/**
 * Sets the client type
 * @param clientType - Client type to set
 */
export function setClientType(clientType) {
    sessionState.clientType = clientType;
}
/**
 * Checks if running in headless mode
 * @returns True if headless (non-interactive and not vscode)
 */
export function isHeadless() {
    return sessionState.isNonInteractiveSession && sessionState.clientType !== 'claude-vscode';
}
// ============================================================================
// Metrics and Providers
// ============================================================================
/**
 * Sets up metrics counters
 * @param meter - Meter instance
 * @param createCounter - Function to create counters
 */
export function setupMetrics(meter, createCounter) {
    sessionState.meter = meter;
    sessionState.sessionCounter = createCounter('claude_code.session.count', {
        description: 'Count of CLI sessions started',
    });
    sessionState.locCounter = createCounter('claude_code.lines_of_code.count', {
        description: 'Count of lines of code modified, with the \'type\' attribute indicating whether lines were added or removed',
    });
    sessionState.prCounter = createCounter('claude_code.pull_request.count', {
        description: 'Number of pull requests created',
    });
    sessionState.commitCounter = createCounter('claude_code.commit.count', {
        description: 'Number of git commits created',
    });
    sessionState.costCounter = createCounter('claude_code.cost.usage', {
        description: 'Cost of the Claude Code session',
        unit: 'USD',
    });
    sessionState.tokenCounter = createCounter('claude_code.token.usage', {
        description: 'Number of tokens used',
        unit: 'tokens',
    });
    sessionState.codeEditToolDecisionCounter = createCounter('claude_code.code_edit_tool.decision', {
        description: 'Count of code editing tool permission decisions (accept/reject) for Edit, Write, and NotebookEdit tools',
    });
    sessionState.activeTimeCounter = createCounter('claude_code.active_time.total', {
        description: 'Total active time in seconds',
        unit: 's',
    });
}
/**
 * Gets the session counter
 * @returns Session counter or null
 */
export function getSessionCounter() {
    return sessionState.sessionCounter;
}
/**
 * Gets the lines of code counter
 * @returns LOC counter or null
 */
export function getLocCounter() {
    return sessionState.locCounter;
}
/**
 * Gets the pull request counter
 * @returns PR counter or null
 */
export function getPrCounter() {
    return sessionState.prCounter;
}
/**
 * Gets the commit counter
 * @returns Commit counter or null
 */
export function getCommitCounter() {
    return sessionState.commitCounter;
}
/**
 * Gets the cost counter
 * @returns Cost counter or null
 */
export function getCostCounter() {
    return sessionState.costCounter;
}
/**
 * Gets the token counter
 * @returns Token counter or null
 */
export function getTokenCounter() {
    return sessionState.tokenCounter;
}
/**
 * Gets the code edit tool decision counter
 * @returns Decision counter or null
 */
export function getCodeEditToolDecisionCounter() {
    return sessionState.codeEditToolDecisionCounter;
}
/**
 * Gets the active time counter
 * @returns Active time counter or null
 */
export function getActiveTimeCounter() {
    return sessionState.activeTimeCounter;
}
// ============================================================================
// Provider Management
// ============================================================================
/**
 * Gets the logger provider
 * @returns Logger provider or null
 */
export function getLoggerProvider() {
    return sessionState.loggerProvider;
}
/**
 * Sets the logger provider
 * @param provider - Logger provider to set
 */
export function setLoggerProvider(provider) {
    sessionState.loggerProvider = provider;
}
/**
 * Gets the event logger
 * @returns Event logger or null
 */
export function getEventLogger() {
    return sessionState.eventLogger;
}
/**
 * Sets the event logger
 * @param logger - Event logger to set
 */
export function setEventLogger(logger) {
    sessionState.eventLogger = logger;
}
/**
 * Gets the meter provider
 * @returns Meter provider or null
 */
export function getMeterProvider() {
    return sessionState.meterProvider;
}
/**
 * Sets the meter provider
 * @param provider - Meter provider to set
 */
export function setMeterProvider(provider) {
    sessionState.meterProvider = provider;
}
/**
 * Gets the tracer provider
 * @returns Tracer provider or null
 */
export function getTracerProvider() {
    return sessionState.tracerProvider;
}
/**
 * Sets the tracer provider
 * @param provider - Tracer provider to set
 */
export function setTracerProvider(provider) {
    sessionState.tracerProvider = provider;
}
// ============================================================================
// Agent Color Management
// ============================================================================
/**
 * Gets the agent color map
 * @returns Map of agent names to colors
 */
export function getAgentColorMap() {
    return sessionState.agentColorMap;
}
// ============================================================================
// Settings and Auth
// ============================================================================
/**
 * Gets the flag settings path
 * @returns Path to flag settings or undefined
 */
export function getFlagSettingsPath() {
    return sessionState.flagSettingsPath;
}
/**
 * Sets the flag settings path
 * @param path - Path to set
 */
export function setFlagSettingsPath(settingsPath) {
    sessionState.flagSettingsPath = settingsPath;
}
/**
 * Gets the session ingress token
 * @returns Ingress token or undefined
 */
export function getSessionIngressToken() {
    return sessionState.sessionIngressToken;
}
/**
 * Sets the session ingress token
 * @param token - Token to set
 */
export function setSessionIngressToken(token) {
    sessionState.sessionIngressToken = token;
}
/**
 * Gets the OAuth token from file descriptor
 * @returns OAuth token or undefined
 */
export function getOauthTokenFromFd() {
    return sessionState.oauthTokenFromFd;
}
/**
 * Sets the OAuth token from file descriptor
 * @param token - Token to set
 */
export function setOauthTokenFromFd(token) {
    sessionState.oauthTokenFromFd = token;
}
/**
 * Gets the API key from file descriptor
 * @returns API key or undefined
 */
export function getApiKeyFromFd() {
    return sessionState.apiKeyFromFd;
}
/**
 * Sets the API key from file descriptor
 * @param key - API key to set
 */
export function setApiKeyFromFd(key) {
    sessionState.apiKeyFromFd = key;
}
/**
 * Gets allowed setting sources
 * @returns Array of allowed setting sources
 */
export function getAllowedSettingSources() {
    return sessionState.allowedSettingSources;
}
/**
 * Sets allowed setting sources
 * @param sources - Sources to allow
 */
export function setAllowedSettingSources(sources) {
    sessionState.allowedSettingSources = sources;
}
// ============================================================================
// Error Logging
// ============================================================================
/**
 * Gets the in-memory error log
 * @returns Copy of error log entries
 */
export function getInMemoryErrorLog() {
    return [...sessionState.inMemoryErrorLog];
}
/**
 * Adds an error to the in-memory log
 * @param entry - Error entry to add
 */
export function addErrorLogEntry(entry) {
    // Keep last 100 entries
    if (sessionState.inMemoryErrorLog.length >= 100) {
        sessionState.inMemoryErrorLog.shift();
    }
    sessionState.inMemoryErrorLog.push(entry);
}
// ============================================================================
// Plugins
// ============================================================================
/**
 * Sets inline plugins
 * @param plugins - Plugins to set
 */
export function setInlinePlugins(plugins) {
    sessionState.inlinePlugins = plugins;
}
/**
 * Gets inline plugins
 * @returns Current inline plugins
 */
export function getInlinePlugins() {
    return sessionState.inlinePlugins;
}
// ============================================================================
// Environment Validators
// ============================================================================
/**
 * Gets environment variable validators
 * @returns Array of validators
 */
export function getEnvVarValidators() {
    return sessionState.envVarValidators;
}
// ============================================================================
// API Request Tracking
// ============================================================================
/**
 * Sets the last API request details
 * @param request - Request details
 */
export function setLastApiRequest(request) {
    sessionState.lastAPIRequest = request;
}
/**
 * Gets the last API request details
 * @returns Last request or null
 */
export function getLastApiRequest() {
    return sessionState.lastAPIRequest;
}
// ============================================================================
// Session Reset
// ============================================================================
/**
 * Resets session statistics (costs, duration, line counts)
 */
export function resetSessionStats() {
    sessionState.totalCostUSD = 0;
    sessionState.totalAPIDuration = 0;
    sessionState.totalAPIDurationWithoutRetries = 0;
    sessionState.totalToolDuration = 0;
    sessionState.startTime = Date.now();
    sessionState.totalLinesAdded = 0;
    sessionState.totalLinesRemoved = 0;
    sessionState.hasUnknownModelCost = false;
    sessionState.modelUsage = {};
}
/**
 * Resets the entire session state to initial values
 */
export function resetSessionState() {
    sessionState = createInitialState();
}
/**
 * Gets the full session state (for debugging/testing)
 * @returns Current session state
 */
export function getSessionState() {
    return sessionState;
}
//# sourceMappingURL=session.js.map