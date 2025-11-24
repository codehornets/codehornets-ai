/**
 * Core module - Re-exports all core utilities
 *
 * This module provides the foundational utilities for the CLI:
 * - utils: Lodash-style utilities (clone, isEqual, memoize, etc.)
 * - logger: Logging infrastructure
 * - filesystem: File system abstraction
 * - config: Configuration management
 * - session: Session state management
 * - terminal: ANSI formatting and text utilities
 */
// ============================================================================
// Utils - Lodash-style utilities
// ============================================================================
export { clone, cloneDeep, isEqual, memoize, mapValues, reject, sample, setWith, sumBy, uniqBy, zipObject, identity, constant, noop, isPlainObject, isFunction, isObject, isObjectLike, get, has, } from './utils.js';
// ============================================================================
// Logger - Logging infrastructure
// ============================================================================
export { 
// Functions
setDebugMode, isDebugMode, writeStdout, writeStderr, extractLogTags, parseLogFilter, matchesLogFilter, shouldLogMessage, getDebugLogPath, log, createLogger, debug, info, warn, error, clearLogFilterCache, } from './logger.js';
// ============================================================================
// Filesystem - File system abstraction
// ============================================================================
export { 
// Functions
getFileSystem, setFileSystem, resetFileSystem, resolveSymlink, getAllPaths, readLinesReverse, isDirectory, isFile, ensureDir, readJsonSync, writeJsonSync, normalizePath, joinPath, dirname, basename, extname, } from './filesystem.js';
// ============================================================================
// Config - Configuration management
// ============================================================================
export { 
// Constants
bashMaxOutputLengthValidator, maxOutputTokensValidator, defaultValidators, DEFAULT_CONVERSATION_TOKEN_LIMIT, DEFAULT_ALLOWED_SETTING_SOURCES, 
// Functions
getConfigDir, parseBooleanEnv, isExplicitlyFalse, parseEnvArgs, getAwsRegion, getCloudMlRegion, getVertexRegion, shouldMaintainWorkingDir, getContextWindow, getConfig, validateEnvVar, getEffectiveValue, validateAllEnvVars, } from './config.js';
// ============================================================================
// Session - Session state management
// ============================================================================
export { 
// Session ID
getSessionId, generateNewSessionId, setSessionId, 
// Working Directory
getOriginalCwd, getCwd, setCwd, 
// Cost and Duration
addApiDuration, recordApiUsage, getTotalCost, getTotalApiDuration, getSessionElapsedTime, getTotalToolDuration, addToolDuration, updateLastInteractionTime, getLastInteractionTime, 
// Line Counts
addLineChanges, getTotalLinesAdded, getTotalLinesRemoved, 
// Token Usage
getTotalInputTokens, getTotalOutputTokens, getTotalCacheReadTokens, getTotalCacheCreationTokens, getTotalWebSearchRequests, getModelUsage, 
// Model Management
markUnknownModelCost, hasUnknownModelCost, getMainLoopModelOverride, getInitialMainLoopModel, setMainLoopModelOverride, setInitialMainLoopModel, isRateLimitFallbackActive, setRateLimitFallbackActive, getModelStrings, setModelStrings, 
// Session Mode
isNonInteractive, setNonInteractive, isInteractive, setInteractive, getClientType, setClientType, isHeadless, 
// Metrics
setupMetrics, getSessionCounter, getLocCounter, getPrCounter, getCommitCounter, getCostCounter, getTokenCounter, getCodeEditToolDecisionCounter, getActiveTimeCounter, 
// Providers
getLoggerProvider, setLoggerProvider, getEventLogger, setEventLogger, getMeterProvider, setMeterProvider, getTracerProvider, setTracerProvider, 
// Agent Colors
getAgentColorMap, 
// Settings and Auth
getFlagSettingsPath, setFlagSettingsPath, getSessionIngressToken, setSessionIngressToken, getOauthTokenFromFd, setOauthTokenFromFd, getApiKeyFromFd, setApiKeyFromFd, getAllowedSettingSources, setAllowedSettingSources, 
// Error Logging
getInMemoryErrorLog, addErrorLogEntry, 
// Plugins
setInlinePlugins, getInlinePlugins, 
// Validators
getEnvVarValidators, 
// API Tracking
setLastApiRequest, getLastApiRequest, 
// Reset
resetSessionStats, resetSessionState, getSessionState, createInitialState, } from './session.js';
// ============================================================================
// Terminal - ANSI formatting and text utilities
// ============================================================================
export { 
// Enums
ColorLevel, 
// Constants
ANSI_CODES, BOX_CHARS, 
// Color Detection
detectColorLevel, getColorSupport, getStdoutColorSupport, getStderrColorSupport, resetColorSupportCache, 
// Style Functions
reset, bold, dim, italic, underline, inverse, hidden, strikethrough, 
// Foreground Colors
black, red, green, yellow, blue, magenta, cyan, white, gray, grey, blackBright, redBright, greenBright, yellowBright, blueBright, magentaBright, cyanBright, whiteBright, 
// Background Colors
bgBlack, bgRed, bgGreen, bgYellow, bgBlue, bgMagenta, bgCyan, bgWhite, 
// RGB/Hex Colors
rgbToAnsi256, hexToRgb, rgb, bgRgb, hex, bgHex, ansi256, bgAnsi256, 
// Text Utilities
stripAnsi, visibleLength, padEnd, padStart, center, wordWrap, truncate, 
// Box Drawing
box, 
// Terminal Size
getTerminalWidth, getTerminalHeight, getTerminalSize, 
// Cursor Control
cursorUp, cursorDown, cursorForward, cursorBackward, cursorHide, cursorShow, cursorSave, cursorRestore, 
// Screen Control
clearScreen, clearScreenDown, clearScreenUp, clearLine, clearLineEnd, clearLineStart, } from './terminal.js';
// ============================================================================
// Auth - OAuth authentication
// ============================================================================
export { 
// Constants
PRODUCTION_CONFIG, LOCAL_CONFIG, DEFAULT_CALLBACK_PORT, TOKEN_EXPIRATION_BUFFER_MS, OAUTH_SCOPES, 
// Config Functions
getConfigDir as getAuthConfigDir, getConfigPath, getOAuthConfig, 
// PKCE
generatePKCE, generateState, 
// Credential Storage
readCredentials, saveCredentials, clearTokens, 
// Token Management
isTokenExpiring, getAccessToken, isAuthenticated, 
// OAuth Flow
buildAuthorizationUrl, exchangeCodeForTokens, refreshAccessToken, createApiKeyFromToken, startCallbackServer, authenticate, logout, } from './auth.js';
//# sourceMappingURL=index.js.map