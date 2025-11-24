# CLI Refactor - Source Code

This directory contains the refactored, modular TypeScript source code extracted from the bundled `cli.js` (421,069 lines).

## Directory Structure

```
src/
├── index.ts              # Main entry point with all exports
├── main.ts               # CLI bootstrap function
│
├── core/                 # Core utilities (3,917 lines)
│   ├── utils.ts          # Lodash-style utilities (clone, isEqual, memoize)
│   ├── logger.ts         # Logging infrastructure
│   ├── filesystem.ts     # File system abstraction
│   ├── config.ts         # Configuration management
│   ├── session.ts        # Session state management
│   ├── terminal.ts       # ANSI formatting, text utilities
│   └── index.ts          # Re-exports
│
├── aws/                  # AWS Integration (3,502 lines)
│   ├── types.ts          # TypeScript type definitions
│   ├── encoding.ts       # Base64, UTF-8 utilities
│   ├── auth.ts           # Authentication schemes
│   ├── endpoints.ts      # Endpoint resolution
│   ├── protocols.ts      # HTTP/RPC protocols
│   ├── credentials.ts    # Credential providers
│   ├── sts.ts            # STS client wrapper
│   └── index.ts          # Re-exports
│
├── network/              # Network/Protocol (2,995 lines)
│   ├── types.ts          # TypeScript interfaces
│   ├── errors.ts         # Network error classes
│   ├── url.ts            # URL parsing/serialization
│   ├── punycode.ts       # IDNA/Punycode utilities
│   ├── proxy.ts          # HTTPS proxy agent
│   ├── http-client.ts    # HTTP client with retries
│   └── index.ts          # Re-exports
│
├── ide/                  # IDE Integration (2,690 lines)
│   ├── types.ts          # IDE types and interfaces
│   ├── wsl.ts            # WSL path conversion
│   ├── detector.ts       # IDE detection (VS Code, JetBrains)
│   ├── lock-files.ts     # Lock file management
│   ├── connections.ts    # IDE connection handling
│   ├── extensions.ts     # Extension installation
│   ├── diagnostics.ts    # Diagnostics manager
│   └── index.ts          # Re-exports
│
├── telemetry/            # Observability (4,029 lines)
│   ├── types.ts          # Telemetry type definitions
│   ├── clock.ts          # AnchoredClock for time sync
│   ├── attributes.ts     # Semantic attributes
│   ├── propagation.ts    # W3C Baggage propagation
│   ├── metrics.ts        # Histograms, counters, gauges
│   ├── tracing.ts        # Distributed tracing
│   ├── exporter.ts       # OTLP exporters
│   └── index.ts          # Re-exports
│
├── ui/                   # React/Ink UI (~4,000 lines)
│   ├── types.ts          # UI type definitions
│   ├── diff-utils.ts     # Diff generation utilities
│   ├── renderer.tsx      # Main UI renderer
│   ├── components/       # React components
│   │   ├── Message.tsx   # Message rendering
│   │   ├── Attachment.tsx # Attachment display
│   │   ├── Diagnostics.tsx # Diagnostics display
│   │   ├── Diff.tsx      # Diff visualization
│   │   ├── Permission.tsx # Permission dialogs
│   │   └── index.ts      # Component exports
│   ├── hooks/            # React hooks
│   │   ├── useSession.ts # Session state hooks
│   │   └── index.ts      # Hook exports
│   └── index.ts          # Re-exports
│
├── tools/                # Tools/MCP (5,108 lines)
│   ├── types.ts          # Tool type definitions
│   ├── file-reader.ts    # File reading with encoding
│   ├── image-processor.ts # Image processing
│   ├── pdf-processor.ts  # PDF extraction
│   ├── notebook-processor.ts # Jupyter parsing
│   ├── attachment.ts     # Attachment metadata
│   ├── hooks.ts          # Hook system
│   ├── mcp/              # MCP server
│   │   ├── server.ts     # MCP server class
│   │   ├── handlers.ts   # Request handlers
│   │   ├── tools.ts      # Tool registry
│   │   └── index.ts      # MCP exports
│   ├── plugins/          # Plugin system
│   │   ├── manager.ts    # Plugin manager
│   │   ├── loader.ts     # Plugin loading
│   │   └── index.ts      # Plugin exports
│   └── index.ts          # Re-exports
│
└── cli/                  # CLI Commands (4,297 lines)
    ├── types.ts          # CLI type definitions
    ├── parser.ts         # Argument parsing
    ├── help.ts           # Help text generation
    ├── runner.ts         # Command execution
    ├── commands/         # Command handlers
    │   ├── mcp.ts        # MCP commands
    │   ├── plugin.ts     # Plugin commands
    │   ├── doctor.ts     # Doctor command
    │   ├── update.ts     # Update command
    │   └── index.ts      # Command exports
    └── index.ts          # Re-exports
```

## Statistics

| Module | Files | Lines | Description |
|--------|-------|-------|-------------|
| core | 7 | 3,917 | Utilities, logging, config, session |
| aws | 8 | 3,502 | AWS SDK wrappers, credentials |
| network | 7 | 2,995 | HTTP client, proxy, URL parsing |
| ide | 8 | 2,690 | IDE detection, connections |
| telemetry | 8 | 4,029 | OpenTelemetry integration |
| ui | 12 | ~4,000 | React/Ink terminal UI |
| tools | 15 | 5,108 | File tools, MCP, plugins |
| cli | 10 | 4,297 | Commands, parser, runner |
| **Total** | **77** | **~33,000** | Clean, typed TypeScript |

**Compression ratio:** 421,069 lines (bundled) → ~33,000 lines (clean) = **12.8x reduction**

## Usage

```typescript
// Import everything
import * as cli from './cli-refactor/src';

// Import specific modules
import { core, aws, network, ide, telemetry, ui, tools, cli } from './cli-refactor/src';

// Import specific functions
import {
  cloneDeep,
  getSessionId,
  detectRunningIdes,
  withSpan,
  MCPServer,
  parseArgs,
} from './cli-refactor/src';

// Run the CLI
import { main } from './cli-refactor/src';
await main();
```

## Module APIs

### Core
```typescript
import { clone, cloneDeep, isEqual, memoize } from './core';
import { log, debug, info, warn, error } from './core';
import { getConfigDir, getConfig } from './core';
import { getSessionId, getCwd } from './core';
import { bold, red, green, yellow, stripAnsi, box } from './core';
```

### AWS
```typescript
import { defaultProvider, fromIni, fromEnv } from './aws';
import { STSClient, getDefaultRoleAssumer } from './aws';
import { fromBase64, toBase64 } from './aws';
```

### Network
```typescript
import { HttpClient, fetchJson } from './network';
import { HttpsProxyAgent, createProxyAgent } from './network';
import { parseUrl, serializeUrl, toASCII } from './network';
```

### IDE
```typescript
import { detectRunningIdes, getIdeConnections } from './ide';
import { DiagnosticsManager } from './ide';
import { WslPathConverter } from './ide';
```

### Telemetry
```typescript
import { initializeTelemetry, withSpan } from './telemetry';
import { createHistogram, createCounter } from './telemetry';
import { W3CBaggagePropagator } from './telemetry';
```

### UI
```typescript
import { Message, Attachment, Diff, Permission } from './ui';
import { useSession, useToolState } from './ui';
import { createDiffHunks, renderMainUI } from './ui';
```

### Tools
```typescript
import { readTextFile, processPDF, processNotebook } from './tools';
import { MCPServer, registerTool, executeTool } from './tools';
import { PluginManager, registerHook, executeHooks } from './tools';
```

### CLI
```typescript
import { parseArgs, runCommand } from './cli';
import { mcpCommand, pluginCommand, doctorCommand } from './cli';
import { generateHelp, showHelp } from './cli';
```

## Building

```bash
# Install dependencies
npm install

# Type check
npx tsc --noEmit

# Build
npx tsc

# Run
node dist/main.js
```

## Dependencies

**Runtime:**
- `@aws-sdk/credential-providers` - AWS credentials
- `@aws-sdk/client-sts` - STS operations
- `@opentelemetry/api` - Telemetry API
- `ink` - Terminal UI framework
- `react` - React for UI components

**Dev:**
- `typescript` - TypeScript compiler
- `@types/node` - Node.js types
- `@types/react` - React types
