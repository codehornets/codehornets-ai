/**
 * CLI Refactor - Main Entry Point
 *
 * This module re-exports all refactored CLI components extracted from
 * the bundled cli.js (421k lines) into clean, modular TypeScript.
 *
 * @module cli-refactor
 */
export * as core from './core/index.js';
export { clone, cloneDeep, isEqual, memoize, mapValues, get, has, log, debug, info, warn, error, createLogger, getConfigDir, getConfig, getSessionId, getCwd, bold, red, green, yellow, cyan, stripAnsi, wordWrap, box, } from './core/index.js';
export * as aws from './aws/index.js';
export { defaultProvider, fromEnv, fromIni, fromProcess, fromTokenFile, fromContainerMetadata, fromInstanceMetadata, fromSSO, STSClient, AssumeRoleCommand, AssumeRoleWithWebIdentityCommand, getDefaultRoleAssumer, getDefaultRoleAssumerWithWebIdentity, fromBase64, toBase64, fromUtf8, toUtf8, type AWSCredentials, type CredentialProvider, } from './aws/index.js';
export * as network from './network/index.js';
export { HttpClient, get as httpGet, post as httpPost, fetchJson, HttpsProxyAgent, createProxyAgent, parseUrl, serializeUrl, toASCII, toUnicode, NetworkError, } from './network/index.js';
export * as ide from './ide/index.js';
export { detectRunningIdes, isVsCodeIde, isJetBrainsIde, getIdeDisplayName, getIdeConnections, getIdeLockFiles, cleanStaleLockFiles, installIdeExtension, DiagnosticsManager, WslPathConverter, } from './ide/index.js';
export * as telemetry from './telemetry/index.js';
export { initializeTelemetry, shutdownTelemetry, withSpan, withSpanAsync, traceCommand, traceApiCall, createHistogram, createCounter, createGauge, HistogramRecorder, W3CBaggagePropagator, getBaggageValue, setBaggageValue, AnchoredClock, getSharedClock, sanitizeAttributes, SemanticAttributes, } from './telemetry/index.js';
export * as ui from './ui/index.js';
export { Message, Attachment, Diagnostics, Diff, ToolPermissionDialog, useSession, useSessionState, useToolState, createDiffHunks, createDiffFromEdits, renderUI, } from './ui/index.js';
export * as tools from './tools/index.js';
export { readTextFile, processImage, processPDF, processNotebook, computeAttachment, MCPServer, registerTool, executeTool, PluginManager, loadPluginFromDirectory, registerHook, executeHooks, HookEventType, } from './tools/index.js';
export * as cli from './cli/index.js';
export { parseArgs, generateMainHelp, generateMCPHelp, run, runAndExit, ExitCodes, VERSION, } from './cli/index.js';
export { main } from './main.js';
//# sourceMappingURL=index.d.ts.map