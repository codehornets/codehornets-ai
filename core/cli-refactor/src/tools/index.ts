/**
 * Tools Module Index
 *
 * Central export point for all tools-related functionality including:
 * - File processing (reading, images, PDFs, notebooks)
 * - Attachments and metadata
 * - MCP (Model Context Protocol) server
 * - Plugin management
 * - Hook system
 *
 * @module tools
 */

// =============================================================================
// Types
// =============================================================================

export type {
  // File types
  ImageMimeType,
  FileEncoding,
  LineEnding,
  TextFileResult,
  ImageFileResult,
  NotebookFileResult,
  PDFFileResult,
  FileReadResult,
  FileReadOptions,
  NotebookCell,
  NotebookOutput,
  AttachmentMetadata,
  // MCP types
  MCPServerInfo,
  MCPServerCapabilities,
  MCPServerOptions,
  MCPToolDefinition,
  MCPToolCallRequest,
  MCPToolCallResult,
  MCPContentBlock,
  MCPTextContent,
  MCPImageContent,
  MCPRequestHandler,
  MCPNotificationHandler,
  MCPTransport,
  // Plugin types
  PluginManifest,
  PluginStatus,
  Plugin,
  PluginInstance,
  PluginLoadOptions,
  PluginManagerEvents,
  // Hook types
  HookEventType,
  Hook,
  CommandHook,
  PromptHook,
  CallbackHook,
  HookConfig,
  HookSettings,
  HookInput,
  PreToolExecutionInput,
  PostToolExecutionInput,
  NotificationHookInput,
  StopHookInput,
  HookExecutionResult,
  HookSuccessResult,
  HookBlockingResult,
  HookNonBlockingErrorResult,
  HookCancelledResult,
  HookJsonOutput,
  HookSpecificOutput,
  PreToolUseHookOutput,
  PostToolUseHookOutput,
  UserPromptSubmitHookOutput,
  SessionStartHookOutput,
} from './types.js';

// =============================================================================
// File Reader
// =============================================================================

export {
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_TOKENS,
  BINARY_EXTENSIONS,
  IMAGE_EXTENSIONS,
  detectEncoding,
  detectLineEnding,
  readFileWithEncoding,
  readFileLines,
  formatWithLineNumbers,
  readTextFile,
  isFileSafeToRead,
  isBinaryFile,
  isImageFile,
  resolveFilePath,
  getFileModTime,
  formatFileSize,
  tabsToSpaces,
} from './file-reader.js';

// =============================================================================
// Image Processor
// =============================================================================

export {
  DEFAULT_MAX_IMAGE_TOKENS,
  SUPPORTED_IMAGE_FORMATS,
  QUALITY_LEVELS,
  ImageProcessingOptions,
  ImageMetadata,
  getImageFormat,
  estimateImageTokens,
  processImage,
  processLargeImage,
  isSupportedImageFormat,
  getImageMetadata,
  imageToDataUrl,
} from './image-processor.js';

// =============================================================================
// PDF Processor
// =============================================================================

export {
  MAX_PDF_SIZE_BYTES,
  PDF_MAGIC_BYTES,
  PDFExtractionOptions,
  PDFMetadata,
  PDFPage,
  PDFImage,
  isValidPDF,
  isPDFFile,
  isPDFWithinSizeLimit,
  processPDF,
  extractPDFText,
  getPDFMetadata,
  extractPDFPageAsImage,
  isPDFProcessingAvailable,
  estimatePDFTokens,
} from './pdf-processor.js';

// =============================================================================
// Notebook Processor
// =============================================================================

export {
  MAX_NOTEBOOK_SIZE_BYTES,
  SUPPORTED_NOTEBOOK_VERSIONS,
  NotebookMetadata,
  RawNotebook,
  RawCell,
  RawOutput,
  parseNotebook,
  processNotebook,
  extractCodeCells,
  extractMarkdownCells,
  getNotebookMetadata,
  getNotebookLanguage,
  countCells,
  isValidNotebook,
  isNotebookFile,
  cellsToToolResult,
} from './notebook-processor.js';

// =============================================================================
// Attachment
// =============================================================================

export {
  MIME_TYPES,
  getMimeType,
  computeChecksum,
  getFileStats,
  computeAttachment,
  createAtMentionAttachment,
  extractAtMentions,
  parseFilenameWithLineRange,
  sanitizeFilename,
  shouldIgnoreFile,
  getFileLanguage,
} from './attachment.js';

// =============================================================================
// MCP (Model Context Protocol)
// =============================================================================

export {
  // Server
  MCPServer,
  MCPServerState,
  MCPServerEvents,
  createMCPServer,
  createStdioTransport,
  // Handlers
  MCPMethod,
  InitializeParams,
  InitializeResult,
  ToolsListResult,
  ToolCallParams,
  ProgressParams,
  CancelledParams,
  registerRequestHandler,
  registerNotificationHandler,
  unregisterRequestHandler,
  unregisterNotificationHandler,
  routeRequest,
  routeNotification,
  createRequest,
  createResponse,
  createErrorResponse,
  createNotification,
  ErrorCodes,
  PROTOCOL_VERSION,
  DEFAULT_SERVER_INFO,
  handleInitialize,
  handleToolsList,
  handleToolCall,
  handlePing,
  // Tools
  registerTool,
  unregisterTool,
  getTool,
  listTools,
  hasTool,
  clearTools,
  executeTool,
  createTextContent,
  createImageContent,
  createSuccessResult,
  createErrorResult,
  BUILTIN_TOOLS,
  getBuiltinToolDefinition,
} from './mcp/index.js';

// =============================================================================
// Plugins
// =============================================================================

export {
  // Manager
  PluginManager,
  PluginManagerOptions,
  createPluginManager,
  createPluginManagerWithDiscovery,
  // Loader
  DEFAULT_LOAD_TIMEOUT,
  REQUIRED_MANIFEST_FIELDS,
  PLUGIN_FILE_PATTERNS,
  PluginLoadResult,
  PluginSource,
  readManifest,
  validateManifest,
  findManifestFile,
  loadPluginFromDirectory,
  loadPluginFromFile,
  discoverPlugins,
  resolvePluginSource,
  getDefaultPluginDirs,
} from './plugins/index.js';

// =============================================================================
// Hooks
// =============================================================================

export {
  DEFAULT_HOOK_TIMEOUT,
  MAX_HOOK_OUTPUT_SIZE,
  HOOK_EVENT_TYPES,
  registerHooks,
  registerHook,
  registerCallback,
  unregisterCallback,
  clearHooks,
  clearCallbacks,
  getHooksForEvent,
  matchesHook,
  getMatchingHooks,
  executeHookSingle,
  executeHooks,
  createPreToolInput,
  createPostToolInput,
  createNotificationInput,
  createStopInput,
  hasBlockingResult,
  getBlockingError,
  getAdditionalContext,
} from './hooks.js';
