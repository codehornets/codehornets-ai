# CLI.js Function Index

**File:** `cli.js` (421,069 lines)
**Analysis Date:** 2025-11-21
**Type:** Bundled Claude Code CLI application

## Quick Stats

| Metric | Value |
|--------|-------|
| Total Lines | 421,069 |
| Total Functions | ~1,600+ |
| Total Classes | ~200+ |
| Total Modules | ~100+ |
| Main Entry Point | `h4I()` at line 421,050 |

## Architecture Overview

```
cli.js Structure (by line range)
================================

[1-85000] Section 1 - Core Infrastructure
  ├── Lodash utilities (clone, isEqual, memoize, etc.)
  ├── IO and logging
  ├── Filesystem abstraction
  ├── Configuration management
  ├── Session state (ID, costs, usage)
  ├── CLI argument parsing
  ├── Terminal formatting (ANSI)
  └── AWS SDK core (Smithy protocols)

[85001-170000] Section 2 - AWS & Network
  ├── Data serialization (base64, dates)
  ├── HTTP protocol implementations
  ├── Authentication framework
  ├── Endpoint resolution/caching
  ├── Credential providers (process, INI, SSO, IMDS)
  ├── HTTP client (Undici, proxy agents)
  └── STS client (AssumeRole)

[170001-255000] Section 3 - URL/IDE/LSP
  ├── IDNA/Punycode (international domains)
  ├── WHATWG URL parser
  ├── IDE integration (VS Code, Cursor, JetBrains)
  ├── Diagnostics manager
  ├── React components (message rendering)
  ├── Diff utilities
  └── LSP core (JSON-RPC, events, semaphore)

[255001-340000] Section 4 - OpenTelemetry
  ├── Histogram aggregation
  ├── Exponential histogram
  ├── W3C Baggage propagator
  ├── Time synchronization (AnchoredClock)
  ├── Attribute sanitization
  ├── Semantic attributes
  └── Protobuf (ResourceSpans, Span)

[340001-421069] Section 5 - Core App
  ├── Metrics protobuf definitions
  ├── gRPC infrastructure (load balancing)
  ├── Session management
  ├── React UI components (Ink)
  ├── File tools (Read, Image, PDF, Notebook)
  ├── MCP server & plugin system
  ├── CLI commands (mcp, plugin, doctor, update)
  └── Main entry point: h4I()
```

## Key Functions Reference

### Section 1: Core Utilities (1-85000)

| Function | Line | Description |
|----------|------|-------------|
| `o21` | 1119 | Memoize function (lodash-style) |
| `hNA` | 1860 | Deep clone implementation |
| `BI9` | 3409 | Creates initial session state |
| `L0` | 3460 | Gets current session ID |
| `dB` | 3287 | Gets claude config directory |
| `xY` | 5276 | Parses command line arguments |
| `IQ` | 7933 | Logs message to console |

### Section 2: AWS/Network (85001-170000)

| Function | Line | Description |
|----------|------|-------------|
| `aB4` | 85375 | Decode base64 to Uint8Array |
| `oB4` | 85390 | Encode to base64 |
| `Vh4` | 120055 | fromProcess credential factory |
| `ih4` | 120406 | fromIni credential factory |
| `Qg4` | 120485 | Default credential provider chain |
| `e78` | 150677 | Default role assumer factory |

### Section 3: URL/IDE/LSP (170001-255000)

| Function | Line | Description |
|----------|------|-------------|
| `X_8` | 186400 | toASCII - punycode conversion |
| `W_8` | 186438 | toUnicode conversion |
| `XY` | 186924 | URL state machine parser |
| `Ax8` | 187194 | Serialize URL |
| `ZiA` | 252544 | Detect running IDEs |
| `jx` | 253367 | Render message (main) |
| `dqQ` | 253711 | Create diff hunks |

### Section 4: OpenTelemetry (255001-340000)

| Function | Line | Description |
|----------|------|-------------|
| `B92` | 330076 | HistogramAggregator |
| `G92` | 330450 | ExponentialHistogramAggregator |
| `p92` | 330715 | W3CBaggagePropagator |
| `a92` | 330754 | AnchoredClock |

### Section 5: Core App (340001-421069)

| Function | Line | Description |
|----------|------|-------------|
| `ep5` | 365100 | Fetch remote session events |
| `Ht1` | 365200 | Create remote session connection |
| `renderMainUI` | 375400 | Main UI rendering |
| `readFileContent` | 400100 | Read file with encoding detection |
| `processPDF` | 400300 | Extract PDF content |
| `processNotebook` | 400400 | Parse Jupyter notebooks |
| `MCPServer.initialize` | 415100 | Initialize MCP server |
| `registerHook` | 415700 | Register tool lifecycle hook |
| **`h4I`** | **421050** | **MAIN ENTRY POINT** |

## Key Classes

| Class | Line | Description |
|-------|------|-------------|
| `GyB` (STSClient) | 150012 | AWS STS client |
| `bE1` (HttpsProxyAgent) | 120869 | HTTPS proxy agent |
| `k8A` | 252086 | WSL path converter |
| `LO` | 252825 | Diagnostics manager |
| `Px1` (LinkedMap) | 254028 | Linked map data structure |
| `wNQ` (LRUCache) | 254256 | LRU cache |
| `mNQ` (Semaphore) | 254542 | Async semaphore |
| `B92` (HistogramAggregator) | 330076 | OpenTelemetry histogram |

## CLI Commands

| Command | Description |
|---------|-------------|
| `mcp` | MCP server management |
| `plugin` | Plugin management |
| `doctor` | Diagnose CLI issues |
| `update` | Update CLI version |

### MCP Subcommands

- `servers` - List configured MCP servers
- `tools` - List available MCP tools
- `info` - Show MCP server information
- `call` - Call an MCP tool
- `grep` - Search MCP resources
- `resources` - List MCP resources
- `read` - Read MCP resource content

## Hook Event Types

- `PreToolExecution`
- `PostToolExecution`
- `Notification`
- `Stop`

## Bundling Patterns

| Pattern | Description |
|---------|-------------|
| `T(() => {...})` | Lazy initialization wrapper |
| `z((exports, module) => {...})` | CommonJS module wrapper |
| `E$(target, exports)` | Export spreading |
| `IA(module, 1)` | ESM interop import |

## Major Dependencies

- AWS SDK v3 (`@aws-sdk/*`)
- Smithy protocols (`@smithy/*`)
- OpenTelemetry (metrics, tracing, propagation)
- gRPC (connectivity, load balancing)
- React + Ink (terminal UI)
- Undici (HTTP client)
- Lodash-style utilities (bundled)

## Files Generated

```
cli-refactor/
├── MASTER-INDEX.json      # Complete merged index
├── README.md              # This file
├── section-1-functions.json
├── section-2-functions.json
├── section-3-functions.json
├── section-4-functions.json
└── section-5-functions.json
```
