/**
 * CLI Refactor - Main Entry Point
 *
 * This module re-exports all refactored CLI components extracted from
 * the bundled cli.js (421k lines) into clean, modular TypeScript.
 *
 * @module cli-refactor
 */

// =============================================================================
// Core Module - Utilities, Config, Session, Terminal
// =============================================================================
export * as core from './core/index.js';
export {
  // Utilities
  clone,
  cloneDeep,
  isEqual,
  memoize,
  mapValues,
  get,
  has,
  // Logger
  log,
  debug,
  info,
  warn,
  error,
  createLogger,
  // Config
  getConfigDir,
  getConfig,
  // Session
  getSessionId,
  getCwd,
  // Terminal
  bold,
  red,
  green,
  yellow,
  cyan,
  stripAnsi,
  wordWrap,
  box,
} from './core/index.js';

// =============================================================================
// AWS Module - Credentials, STS, Auth, Endpoints
// =============================================================================
export * as aws from './aws/index.js';
export {
  // Credential providers
  defaultProvider,
  fromEnv,
  fromIni,
  fromProcess,
  fromTokenFile,
  fromContainerMetadata,
  fromInstanceMetadata,
  fromSSO,
  // STS
  STSClient,
  AssumeRoleCommand,
  AssumeRoleWithWebIdentityCommand,
  getDefaultRoleAssumer,
  getDefaultRoleAssumerWithWebIdentity,
  // Encoding
  fromBase64,
  toBase64,
  fromUtf8,
  toUtf8,
  // Types
  type AWSCredentials,
  type CredentialProvider,
} from './aws/index.js';

// =============================================================================
// Network Module - HTTP Client, Proxy, URL, Punycode
// =============================================================================
export * as network from './network/index.js';
export {
  // HTTP Client
  HttpClient,
  get as httpGet,
  post as httpPost,
  fetchJson,
  // Proxy
  HttpsProxyAgent,
  createProxyAgent,
  // URL utilities
  parseUrl,
  serializeUrl,
  // Punycode
  toASCII,
  toUnicode,
  // Errors
  NetworkError,
} from './network/index.js';

// =============================================================================
// IDE Module - Detection, Connections, Extensions, Diagnostics
// =============================================================================
export * as ide from './ide/index.js';
export {
  // Detection
  detectRunningIdes,
  isVsCodeIde,
  isJetBrainsIde,
  getIdeDisplayName,
  // Connections
  getIdeConnections,
  // Lock files
  getIdeLockFiles,
  cleanStaleLockFiles,
  // Extensions
  installIdeExtension,
  // Diagnostics
  DiagnosticsManager,
  // WSL
  WslPathConverter,
} from './ide/index.js';

// =============================================================================
// Telemetry Module - Metrics, Tracing, Propagation
// =============================================================================
export * as telemetry from './telemetry/index.js';
export {
  // Initialization
  initializeTelemetry,
  shutdownTelemetry,
  // Tracing
  withSpan,
  withSpanAsync,
  traceCommand,
  traceApiCall,
  // Metrics
  createHistogram,
  createCounter,
  createGauge,
  HistogramRecorder,
  // Propagation
  W3CBaggagePropagator,
  getBaggageValue,
  setBaggageValue,
  // Clock
  AnchoredClock,
  getSharedClock,
  // Attributes
  sanitizeAttributes,
  SemanticAttributes,
} from './telemetry/index.js';

// =============================================================================
// UI Module - React Components, Hooks, Renderer
// =============================================================================
export * as ui from './ui/index.js';
export {
  // Components
  Message,
  Attachment,
  Diagnostics,
  Diff,
  ToolPermissionDialog,
  // Hooks
  useSession,
  useSessionState,
  useToolState,
  // Diff utilities
  createDiffHunks,
  createDiffFromEdits,
  // Renderer
  renderUI,
} from './ui/index.js';

// =============================================================================
// Tools Module - File Processing, MCP, Plugins, Hooks
// =============================================================================
export * as tools from './tools/index.js';
export {
  // File processing
  readTextFile,
  processImage,
  processPDF,
  processNotebook,
  computeAttachment,
  // MCP
  MCPServer,
  registerTool,
  executeTool,
  // Plugins
  PluginManager,
  loadPluginFromDirectory,
  // Hooks
  registerHook,
  executeHooks,
  HookEventType,
} from './tools/index.js';

// =============================================================================
// CLI Module - Commands, Parser, Runner
// =============================================================================
export * as cli from './cli/index.js';
export {
  // Parser
  parseArgs,
  // Help
  generateMainHelp,
  generateMCPHelp,
  // Runner
  run,
  runAndExit,
  // Constants
  ExitCodes,
  VERSION,
} from './cli/index.js';

// =============================================================================
// Main Entry Point
// =============================================================================
export { main } from './main.js';
