# Claude Code Plugins: Complete Technical Guide

**Last Updated:** 2025-11-18
**Source:** https://code.claude.com/docs/en/plugins

---

## Table of Contents

1. [Overview](#overview)
2. [Plugin Architecture](#plugin-architecture)
3. [Plugin Structure](#plugin-structure)
4. [Plugin Components](#plugin-components)
5. [Plugin Manifest (plugin.json)](#plugin-manifest-pluginjson)
6. [Creating Plugins](#creating-plugins)
7. [Plugin Marketplaces](#plugin-marketplaces)
8. [Installation & Management](#installation--management)
9. [MCP Integration](#mcp-integration)
10. [Hooks & Event Handlers](#hooks--event-handlers)
11. [Skills](#skills)
12. [Slash Commands](#slash-commands)
13. [Agents & Subagents](#agents--subagents)
14. [Best Practices](#best-practices)
15. [Security Considerations](#security-considerations)
16. [Real-World Examples](#real-world-examples)
17. [Troubleshooting](#troubleshooting)

---

## Overview

Claude Code's plugin system enables extension through **custom commands, agents, hooks, Skills, and MCP servers**. Plugins are discoverable via marketplaces and shareable across projects and teams.

### Core Capabilities

- **Slash Commands**: Custom shortcuts for frequently-used operations
- **Subagents**: Purpose-built agents for specialized development tasks
- **MCP Servers**: Connect to tools and data sources through the Model Context Protocol
- **Hooks**: Customize Claude Code's behavior at key points in its workflow
- **Skills**: Agent capabilities that Claude autonomously uses based on task context

### Key Features

- Discoverable through marketplaces
- Shareable across projects and teams
- Version-controlled and reproducible
- Support for multiple distribution methods
- Enterprise-grade governance capabilities

---

## Plugin Architecture

### Component Types

Plugins can package any combination of:

1. **Commands** (Slash commands) - User-invoked shortcuts
2. **Agents** - Specialized AI assistants for specific tasks
3. **Skills** - Model-invoked capabilities Claude activates automatically
4. **Hooks** - Event handlers for workflow automation
5. **MCP Servers** - External tool integrations

### Distribution Flow

```
Developer Creates Plugin
    ↓
Add to Marketplace (marketplace.json)
    ↓
Users Discover via /plugin
    ↓
Install with /plugin install
    ↓
Components Available in Claude Code
```

---

## Plugin Structure

### Standard Directory Layout

```
plugin-root/
├── .claude-plugin/
│   ├── plugin.json              # Plugin manifest (required)
│   └── marketplace.json         # Optional for local marketplaces
├── commands/                    # Slash command definitions (optional)
│   ├── command-1.md
│   └── command-2.md
├── agents/                      # Agent definitions (optional)
│   ├── agent-1.md
│   └── agent-2.md
├── skills/                      # Agent Skills (optional)
│   ├── skill-name/
│   │   ├── SKILL.md            # Skill definition (required)
│   │   ├── reference.md        # Additional docs (optional)
│   │   └── examples.md         # Examples (optional)
│   └── another-skill/
│       └── SKILL.md
├── hooks/                       # Event handlers (optional)
│   └── hooks.json
├── scripts/                     # Hook scripts and utilities (optional)
│   └── validate.sh
├── .mcp.json                    # MCP server config (optional)
└── README.md                    # Documentation
```

### Critical Directory Requirements

- **`.claude-plugin/`** must be at plugin root
- **All other directories** (commands/, agents/, skills/, hooks/) must be at plugin root, **NOT inside .claude-plugin/**
- The plugin.json file is the **only required file**

---

## Plugin Components

### 1. Commands (Slash Commands)

**Location:** `commands/` directory
**Format:** Markdown files with YAML frontmatter
**Invocation:** User types `/command-name` in Claude Code

Example:
```markdown
---
description: Generate a deployment checklist for production releases
argument-hint: [environment]
allowed-tools: Read, Grep, Bash
---

Create a comprehensive deployment checklist for $ARGUMENTS environment including:

1. Pre-deployment validation steps
2. Database migration verification
3. Environment variable checks
4. Rollback procedures
5. Post-deployment monitoring
```

### 2. Agents (Subagents)

**Location:** `agents/` directory
**Format:** Markdown files with YAML frontmatter
**Invocation:** Claude delegates automatically or user invokes explicitly

Example:
```markdown
---
name: security-auditor
description: Security expert for code review and vulnerability analysis
tools: Read, Grep, Bash
model: claude-3-5-sonnet-20241022
permissionMode: ask
---

You are a security expert specializing in application security.

## Your Role

- Review code for security vulnerabilities
- Check for common attack vectors (SQL injection, XSS, CSRF)
- Validate authentication and authorization patterns
- Identify sensitive data exposure risks
- Recommend security best practices

## Analysis Process

1. Understand the codebase context
2. Identify security-critical components
3. Perform systematic vulnerability analysis
4. Provide actionable remediation steps
```

### 3. Skills

**Location:** `skills/skill-name/` directories
**Format:** SKILL.md with YAML frontmatter
**Invocation:** Model-invoked based on task context

Example:
```markdown
---
name: pdf-processor
description: Extract text and tables from PDF files, fill forms, merge documents. Use when working with PDFs or document extraction.
allowed-tools: Read, Write, Bash
---

# PDF Processing Skill

## Capabilities

- Extract text from PDFs
- Extract tables and convert to CSV/JSON
- Fill PDF forms programmatically
- Merge multiple PDFs
- Split PDFs into separate files

## When to Use

Use this skill when the user mentions:
- PDF files
- Document extraction
- Form filling
- PDF manipulation

## Tools Available

- `pdftotext` for text extraction
- `pdfunite` for merging
- `pdftk` for advanced operations
```

### 4. Hooks

**Location:** `hooks/hooks.json` or inline in plugin.json
**Format:** JSON configuration
**Invocation:** Automatic based on events

Example:
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "prettier --write \"$FILE_PATH\"",
            "timeout": 30000
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/scripts/validate-command.sh"
          }
        ]
      }
    ]
  }
}
```

### 5. MCP Servers

**Location:** `.mcp.json` at plugin root or inline in plugin.json
**Format:** JSON configuration
**Invocation:** Automatic when plugin enabled

Example:
```json
{
  "mcpServers": {
    "database-tools": {
      "type": "stdio",
      "command": "${CLAUDE_PLUGIN_ROOT}/servers/db-server",
      "args": ["--config", "${CLAUDE_PLUGIN_ROOT}/config.json"],
      "env": {
        "DB_URL": "${DB_URL}",
        "DB_PASSWORD": "${DB_PASSWORD}"
      }
    },
    "api-gateway": {
      "type": "http",
      "url": "https://api.example.com/mcp",
      "headers": {
        "Authorization": "Bearer ${API_TOKEN}"
      }
    }
  }
}
```

---

## Plugin Manifest (plugin.json)

### Complete Schema Reference

```json
{
  "name": "plugin-name",
  "version": "1.2.0",
  "description": "Brief description of plugin functionality",
  "author": {
    "name": "Developer Name",
    "email": "dev@example.com"
  },
  "homepage": "https://docs.example.com/plugin",
  "repository": "https://github.com/user/plugin",
  "license": "MIT",
  "keywords": ["deployment", "ci-cd", "automation"],
  "commands": ["./commands/", "./custom-commands/"],
  "agents": "./agents/",
  "hooks": "./hooks/hooks.json",
  "mcpServers": "./mcp-config.json"
}
```

### Required Fields

- **`name`** (string): Unique identifier in kebab-case, no spaces (e.g., `"deployment-tools"`)

### Optional Metadata Fields

| Field | Type | Purpose | Example |
|-------|------|---------|---------|
| `version` | string | Semantic version | `"2.1.0"` |
| `description` | string | Brief explanation | `"Deployment automation tools"` |
| `author` | object | Creator info | `{"name": "Team", "email": "team@co.com"}` |
| `homepage` | string | Documentation URL | `"https://docs.example.com"` |
| `repository` | string | Source code URL | `"https://github.com/user/plugin"` |
| `license` | string | License type | `"MIT"`, `"Apache-2.0"` |
| `keywords` | array | Discovery tags | `["deployment", "ci-cd"]` |

### Component Path Fields

| Field | Type | Function |
|-------|------|----------|
| `commands` | string or array | Additional command files/directories |
| `agents` | string or array | Agent capability files |
| `hooks` | string or object | Event handler configuration |
| `mcpServers` | string or object | MCP server setup |

### Path Requirements

All paths must be:
- Relative to plugin root
- Begin with `./`
- Supplementary to default directories (not replacements)

### Environment Variables

**`${CLAUDE_PLUGIN_ROOT}`**: Contains the absolute path to your plugin directory for dynamic path resolution across installations.

Usage examples:
```json
{
  "mcpServers": {
    "local-server": {
      "command": "${CLAUDE_PLUGIN_ROOT}/bin/server",
      "args": ["--config", "${CLAUDE_PLUGIN_ROOT}/config.json"]
    }
  }
}
```

---

## Creating Plugins

### Step-by-Step Plugin Creation

#### 1. Initialize Plugin Structure

```bash
# Create plugin directory
mkdir my-plugin
cd my-plugin

# Create required structure
mkdir -p .claude-plugin
mkdir -p commands agents skills hooks scripts

# Create plugin manifest
cat > .claude-plugin/plugin.json << 'EOF'
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "My custom Claude Code plugin",
  "author": {
    "name": "Your Name",
    "email": "you@example.com"
  },
  "license": "MIT"
}
EOF
```

#### 2. Add Components

**Create a slash command:**
```bash
cat > commands/deploy.md << 'EOF'
---
description: Deploy application to specified environment
argument-hint: [environment]
allowed-tools: Bash, Read
---

Deploy the application to $ARGUMENTS environment:

1. Validate environment configuration
2. Run pre-deployment checks
3. Execute deployment
4. Verify deployment success
5. Run smoke tests
EOF
```

**Create an agent:**
```bash
cat > agents/tester.md << 'EOF'
---
name: test-specialist
description: Specialized agent for writing and running tests
tools: Read, Write, Bash, Grep
---

You are a test specialist focused on comprehensive test coverage.

Create and execute tests following project conventions.
EOF
```

**Create a skill:**
```bash
mkdir -p skills/api-tester
cat > skills/api-tester/SKILL.md << 'EOF'
---
name: api-tester
description: Test REST APIs with various HTTP methods, validate responses, and check error handling. Use when testing APIs or endpoints.
---

# API Testing Skill

Test REST APIs comprehensively using curl or similar tools.
Validate status codes, response formats, and error handling.
EOF
```

#### 3. Test Locally

```bash
# Create a test marketplace
mkdir -p test-marketplace/.claude-plugin
cat > test-marketplace/.claude-plugin/marketplace.json << EOF
{
  "name": "test-marketplace",
  "owner": {
    "name": "Developer",
    "email": "dev@example.com"
  },
  "plugins": [
    {
      "name": "my-plugin",
      "source": "../my-plugin",
      "description": "My test plugin"
    }
  ]
}
EOF

# In Claude Code
# /plugin marketplace add /path/to/test-marketplace
# /plugin install my-plugin@test-marketplace
```

#### 4. Iterate and Refine

- Test all components work as expected
- Validate tool permissions
- Check environment variable expansion
- Test with team members
- Document usage in README.md

#### 5. Publish

```bash
# Initialize git repository
git init
git add .
git commit -m "Initial plugin release"

# Push to GitHub
gh repo create my-plugin --public --source=. --push

# Create release
gh release create v1.0.0 --title "Initial Release" --notes "First stable release"
```

---

## Plugin Marketplaces

### Marketplace Structure

A marketplace is defined by a `marketplace.json` file:

```json
{
  "name": "company-marketplace",
  "version": "1.0.0",
  "description": "Company-wide Claude Code plugins",
  "owner": {
    "name": "DevOps Team",
    "email": "devops@company.com"
  },
  "pluginRoot": "./plugins/",
  "plugins": [
    {
      "name": "deployment-tools",
      "source": "./plugins/deployment-tools",
      "version": "2.1.0",
      "description": "Production deployment automation",
      "author": {
        "name": "Platform Team"
      },
      "keywords": ["deploy", "ci-cd"]
    },
    {
      "name": "security-scanner",
      "source": {
        "source": "github",
        "repo": "company/security-plugin"
      },
      "version": "1.5.0",
      "description": "Security vulnerability scanner"
    },
    {
      "name": "external-tool",
      "source": {
        "source": "url",
        "url": "https://gitlab.com/team/plugin.git"
      }
    }
  ]
}
```

### Required Fields

- **`name`**: Kebab-case marketplace identifier
- **`owner`**: Maintainer information with name and email
- **`plugins`**: Array of available plugin entries

### Optional Fields

- **`description`**: Marketplace description
- **`version`**: Marketplace version
- **`pluginRoot`**: Base path for relative sources

### Plugin Entry Structure

Each plugin requires:
- **`name`**: Kebab-case identifier
- **`source`**: Location reference

Optional fields:
- `description`, `version`, `author`, `homepage`, `repository`, `license`, `keywords`
- `commands`, `agents`, `hooks`, `mcpServers`
- `strict` (default: true) - whether plugin.json is mandatory

### Source Configuration Options

**Relative paths:**
```json
{
  "name": "local-plugin",
  "source": "./plugins/my-plugin"
}
```

**GitHub repositories:**
```json
{
  "name": "github-plugin",
  "source": {
    "source": "github",
    "repo": "owner/plugin-repo"
  }
}
```

**Git URLs:**
```json
{
  "name": "git-plugin",
  "source": {
    "source": "url",
    "url": "https://gitlab.com/team/plugin.git"
  }
}
```

### Creating a Marketplace

1. **Create repository structure:**
```bash
mkdir my-marketplace
cd my-marketplace
mkdir -p .claude-plugin plugins
```

2. **Create marketplace.json:**
```bash
cat > .claude-plugin/marketplace.json << 'EOF'
{
  "name": "my-marketplace",
  "owner": {
    "name": "Your Name",
    "email": "you@example.com"
  },
  "plugins": []
}
EOF
```

3. **Add plugins to marketplace:**
```json
{
  "plugins": [
    {
      "name": "plugin-1",
      "source": "./plugins/plugin-1",
      "description": "First plugin"
    }
  ]
}
```

4. **Publish to GitHub:**
```bash
git init
git add .
git commit -m "Initialize marketplace"
gh repo create my-marketplace --public --source=. --push
```

5. **Users add marketplace:**
```bash
# In Claude Code
/plugin marketplace add username/my-marketplace
```

### Team Configuration

For automatic marketplace installation, add to `.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": [
    {
      "source": "github",
      "repo": "company/claude-plugins"
    },
    {
      "source": "url",
      "url": "https://internal-git.company.com/plugins.git"
    }
  ]
}
```

Team members will automatically have these marketplaces when they trust the folder.

---

## Installation & Management

### Discovery Commands

```bash
# Browse available plugins
/plugin

# Search for specific functionality
/plugin search [keyword]

# View plugin details
/plugin info plugin-name@marketplace-name
```

### Installation Commands

```bash
# Install from marketplace
/plugin install plugin-name@marketplace-name

# Install with specific version
/plugin install plugin-name@marketplace-name --version 1.2.0

# Install all plugins from settings.json
# Happens automatically when trusting folder
```

### Management Commands

```bash
# List installed plugins
/plugin list

# Enable disabled plugin
/plugin enable plugin-name@marketplace-name

# Disable plugin without uninstalling
/plugin disable plugin-name@marketplace-name

# Uninstall plugin
/plugin uninstall plugin-name@marketplace-name

# Update plugin to latest version
/plugin update plugin-name@marketplace-name
```

### Marketplace Management

```bash
# Add marketplace
/plugin marketplace add source-path

# Add GitHub marketplace
/plugin marketplace add username/repo-name

# Add Git URL marketplace
/plugin marketplace add https://gitlab.com/team/marketplace.git

# List configured marketplaces
/plugin marketplace list

# Update marketplace metadata
/plugin marketplace update marketplace-name

# Remove marketplace (uninstalls plugins)
/plugin marketplace remove marketplace-name
```

### CLI Commands

```bash
# Add plugin via CLI
claude plugin add plugin-name@marketplace-name

# List plugins via CLI
claude plugin list

# Remove plugin via CLI
claude plugin remove plugin-name@marketplace-name
```

---

## MCP Integration

### Overview

Model Context Protocol (MCP) allows Claude Code to connect to external tools and data sources. Plugins can bundle MCP servers for automatic integration.

### Configuration Scopes

Three configuration levels determine server accessibility:

| Scope | Storage Location | Usage | Command Flag |
|-------|------------------|-------|--------------|
| **User** | `~/.claude/mcp.json` | Cross-project personal utilities | `--scope user` |
| **Project** | `.mcp.json` in project root | Team collaboration, shared tools | `--scope project` |
| **Local** | Project-specific user settings | Personal dev servers, credentials | `--scope local` |

**Precedence hierarchy:** Local > Project > User (higher priority overrides lower)

### Transport Types

**HTTP** (Recommended for remote servers):
```json
{
  "mcpServers": {
    "api-service": {
      "type": "http",
      "url": "https://api.example.com/mcp",
      "headers": {
        "Authorization": "Bearer ${API_TOKEN}"
      }
    }
  }
}
```

**Stdio** (For local processes):
```json
{
  "mcpServers": {
    "local-tool": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "tool-name"],
      "env": {
        "API_KEY": "${TOOL_API_KEY}"
      }
    }
  }
}
```

**SSE** (Deprecated, use HTTP):
```json
{
  "mcpServers": {
    "legacy-service": {
      "type": "sse",
      "url": "https://example.com/sse"
    }
  }
}
```

### Environment Variables

**Variable expansion:**
```json
{
  "command": "${HOME}/bin/server",
  "args": ["--config", "${CONFIG_PATH:-./config.json}"],
  "env": {
    "API_KEY": "${API_KEY}",
    "DEBUG": "${DEBUG:-false}"
  }
}
```

**Syntax:**
- `${VAR}` - Standard expansion
- `${VAR:-default}` - Fallback defaults

**Supported locations:**
- `command` paths
- `args` values
- `env` variables
- `url` endpoints
- `headers` authentication

### Plugin MCP Configuration

**Option 1: Separate .mcp.json file**
```json
{
  "mcpServers": {
    "plugin-server": {
      "type": "stdio",
      "command": "${CLAUDE_PLUGIN_ROOT}/bin/server",
      "args": ["--config", "${CLAUDE_PLUGIN_ROOT}/config.json"]
    }
  }
}
```

**Option 2: Inline in plugin.json**
```json
{
  "name": "my-plugin",
  "mcpServers": {
    "inline-server": {
      "type": "http",
      "url": "https://api.example.com/mcp"
    }
  }
}
```

### CLI Management

```bash
# Add HTTP server
claude mcp add stripe --transport http https://mcp.stripe.com \
  --header "Authorization: Bearer ${STRIPE_KEY}"

# Add stdio server
claude mcp add database --transport stdio \
  --env DB_URL="${DATABASE_URL}" \
  -- npx -y @bytebase/dbhub --dsn "${DB_URL}"

# List servers
claude mcp list

# Remove server
claude mcp remove server-name

# Test server
claude mcp get server-name
```

### Environment Variables for CLI

```bash
# Server startup timeout (milliseconds)
MCP_TIMEOUT=10000 claude

# Maximum output token limit
export MAX_MCP_OUTPUT_TOKENS=50000

# Debug MCP connections
claude --mcp-debug
```

### Examples

**Database connection:**
```bash
claude mcp add --transport stdio db -- npx -y @bytebase/dbhub \
  --dsn "postgresql://readonly:pass@prod.db.com:5432/analytics"
```

**API integration:**
```bash
claude mcp add --transport http github https://mcp.github.com \
  --header "Authorization: token ${GITHUB_TOKEN}"
```

**Local tool:**
```json
{
  "mcpServers": {
    "custom-tool": {
      "type": "stdio",
      "command": "${CLAUDE_PLUGIN_ROOT}/tools/custom",
      "env": {
        "TOOL_CONFIG": "${CLAUDE_PLUGIN_ROOT}/tool-config.json"
      }
    }
  }
}
```

---

## Hooks & Event Handlers

### Available Hook Events

| Event | Trigger | Use Cases |
|-------|---------|-----------|
| **PreToolUse** | Before Claude uses any tool | Validation, blocking, input modification |
| **PostToolUse** | After Claude uses any tool | Formatting, testing, notifications |
| **UserPromptSubmit** | When user submits prompt | Context injection, validation |
| **PermissionRequest** | When permission dialog appears | Auto-approval, logging |
| **Notification** | When Claude sends notification | Custom routing, filtering |
| **Stop** | When main agent finishes | Verification, cleanup |
| **SubagentStop** | When subagent completes | Result validation |
| **SessionStart** | At session initialization | Environment setup, context loading |
| **SessionEnd** | When session terminates | Cleanup, reporting |
| **PreCompact** | Before context compaction | State preservation |

### Configuration Structure

**In settings.json:**
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "prettier --write \"$FILE_PATH\"",
            "timeout": 30000
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "./scripts/validate-bash.sh"
          }
        ]
      }
    ],
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Project: $(basename $CLAUDE_PROJECT_DIR)'"
          }
        ]
      }
    ]
  }
}
```

**In plugin hooks/hooks.json:**
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/scripts/format.sh",
            "timeout": 60000
          }
        ]
      }
    ]
  }
}
```

### Matcher Patterns

Matchers identify which tools trigger hooks:

- **Exact match:** `"Write"` - matches only Write tool
- **Regex pattern:** `"Edit|Write"` - matches Edit OR Write
- **Wildcard:** `"*"` - matches all tools
- **Pattern:** `"Notebook.*"` - matches NotebookEdit, etc.
- **Case-sensitive:** Pattern matching distinguishes cases

### Hook Types

#### Command Hooks

Execute shell commands:

```json
{
  "type": "command",
  "command": "bash -c 'echo Processing $FILE_PATH'",
  "timeout": 30000
}
```

**Available variables:**
- `$CLAUDE_PROJECT_DIR` - Project root directory
- `$FILE_PATH` - File being operated on (tool-specific)
- `$TOOL_NAME` - Name of tool being used
- Additional event-specific variables

#### Prompt Hooks

Send input to LLM for evaluation (Stop/SubagentStop only):

```json
{
  "type": "prompt",
  "prompt": "Evaluate if the agent completed all tasks: $ARGUMENTS"
}
```

### Hook Input Structure

All hooks receive JSON via stdin:

```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/conversation.json",
  "cwd": "/current/working/directory",
  "permission_mode": "ask",
  "hook_event_name": "PreToolUse",
  "tool_name": "Write",
  "tool_input": {
    "file_path": "/path/to/file.js",
    "content": "..."
  },
  "tool_use_id": "xyz789"
}
```

### Hook Output Mechanisms

#### Simple (Exit Codes)

- **Exit 0:** Success, stdout shown in verbose mode
- **Exit 2:** Blocking error, stderr shown to Claude
- **Other:** Non-blocking error, stderr shown to user

#### Advanced (JSON Output)

Return structured JSON for control:

```json
{
  "continue": false,
  "stopReason": "Security check failed",
  "systemMessage": "File contains sensitive data",
  "suppressOutput": true,
  "decision": "deny",
  "additionalContext": "Recommend using environment variables"
}
```

### Event-Specific Controls

**PreToolUse:**
```json
{
  "decision": "allow|deny|ask",
  "updatedInput": {
    "file_path": "/modified/path"
  }
}
```

**PostToolUse:**
```json
{
  "decision": "block",
  "additionalContext": "Tests failed, reverting changes"
}
```

**UserPromptSubmit:**
```json
{
  "continue": true,
  "additionalContext": "Project uses TypeScript strict mode"
}
```

**Stop/SubagentStop:**
```json
{
  "continue": false,
  "stopReason": "All tests must pass before completion"
}
```

### Common Use Cases

**Auto-format code:**
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "prettier --write \"$FILE_PATH\" 2>/dev/null || true"
          }
        ]
      }
    ]
  }
}
```

**Validate bash commands:**
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/scripts/validate-bash.sh"
          }
        ]
      }
    ]
  }
}
```

**Inject project context:**
```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "cat $CLAUDE_PROJECT_DIR/CONTEXT.md"
          }
        ]
      }
    ]
  }
}
```

**Run tests after changes:**
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "npm test -- --findRelatedTests \"$FILE_PATH\"",
            "timeout": 120000
          }
        ]
      }
    ]
  }
}
```

### Environment Variables

- `CLAUDE_PROJECT_DIR` - Project root (all hooks)
- `CLAUDE_ENV_FILE` - Environment persistence file (SessionStart)
- `CLAUDE_CODE_REMOTE` - Remote vs local context

### Debugging

```bash
# View registered hooks
/hooks

# Debug mode
claude --debug

# Test hook command manually
bash -c 'YOUR_HOOK_COMMAND'
```

---

## Skills

### Overview

Skills are agent capabilities that Claude **autonomously uses** based on task context. Unlike slash commands (user-invoked), Skills are **model-invoked**.

### SKILL.md Format

```markdown
---
name: skill-name
description: What it does and when to use it. Include specific keywords and use cases.
allowed-tools: Read, Grep, Bash
---

# Skill Name

## Capabilities

List what this skill can do.

## When to Use

Describe specific scenarios where Claude should activate this skill.

## Implementation Details

Provide instructions, examples, and reference materials.
```

### Required Frontmatter

- **`name`**: Lowercase letters, numbers, hyphens only (max 64 chars)
- **`description`**: Functionality AND activation triggers (max 1024 chars)

### Optional Frontmatter

- **`allowed-tools`**: Restrict tool access (e.g., `Read, Grep, Glob`)

### Directory Structure

```
skills/
├── pdf-processor/
│   ├── SKILL.md              # Required
│   ├── reference.md          # Optional
│   ├── examples.md           # Optional
│   └── scripts/              # Optional
│       └── extract-pdf.sh
└── api-tester/
    └── SKILL.md
```

### Progressive Disclosure

Claude reads additional files (reference.md, examples.md) only when relevant, managing context efficiently.

### Description Best Practices

**Ineffective:**
```yaml
description: Helps with documents
```

**Effective:**
```yaml
description: Extract text and tables from PDF files, fill forms, merge documents. Use when working with PDFs, document extraction, or form filling.
```

**Key principles:**
1. Include specific use cases (PDF files, Excel spreadsheets)
2. Mention key terms users would naturally use
3. Explain both WHAT and WHEN
4. Be specific, not vague

### Storage Locations

- **Personal Skills**: `~/.claude/skills/skill-name/`
- **Project Skills**: `.claude/skills/skill-name/`
- **Plugin Skills**: Bundled with installed plugins

### Example Skill

```markdown
---
name: database-query-optimizer
description: Analyze and optimize SQL queries, suggest indexes, identify N+1 problems. Use when working with database queries, performance issues, or SQL optimization.
allowed-tools: Read, Grep, Bash
---

# Database Query Optimizer

## Capabilities

- Analyze SQL query performance
- Suggest index improvements
- Identify N+1 query problems
- Recommend query rewrites
- Check query execution plans

## When to Use

Activate when user mentions:
- Slow queries
- Database performance
- SQL optimization
- Query tuning
- Index recommendations

## Analysis Process

1. Review query structure
2. Check for common anti-patterns
3. Analyze execution plan
4. Suggest optimizations
5. Provide before/after comparisons

## Common Optimizations

### N+1 Queries
Look for loops with database calls inside. Suggest batch loading.

### Missing Indexes
Check WHERE, JOIN, ORDER BY clauses. Recommend covering indexes.

### Query Rewrites
Transform subqueries to JOINs where appropriate.
```

---

## Slash Commands

### Overview

Slash commands are **user-invoked** shortcuts for frequently-used prompts. They are defined as Markdown files with optional YAML frontmatter.

### Command File Format

```markdown
---
description: Brief description shown in /help
argument-hint: [optional-arg] <required-arg>
model: claude-3-5-sonnet-20241022
allowed-tools: Read, Grep, Bash
disable-model-invocation: false
---

Prompt content here. Use $ARGUMENTS for user input.

## Instructions

1. Step one
2. Step two
3. Use $ARGUMENTS in your processing
```

### Frontmatter Fields

| Field | Purpose | Example |
|-------|---------|---------|
| `description` | Shown in /help (required) | `"Deploy to production"` |
| `argument-hint` | Usage hint for args | `"[environment] [version]"` |
| `model` | Force specific model | `"claude-3-5-sonnet-20241022"` |
| `allowed-tools` | Restrict tool usage | `"Read, Grep, Glob"` |
| `disable-model-invocation` | Prevent execution | `true` |

### Using $ARGUMENTS

The `$ARGUMENTS` variable contains user input after command name:

```markdown
---
description: Create a new feature branch
argument-hint: <feature-name>
---

Create a new feature branch for: $ARGUMENTS

Steps:
1. Pull latest from main
2. Create branch: feature/$ARGUMENTS
3. Push to remote
4. Create draft PR
```

Usage: `/new-feature user-authentication`

### Storage Locations

- **Personal Commands**: `~/.claude/commands/`
- **Project Commands**: `.claude/commands/`
- **Plugin Commands**: Bundled with plugins

### Example Commands

**Deployment checklist:**
```markdown
---
description: Generate deployment checklist
argument-hint: [environment]
allowed-tools: Read, Grep
---

Create a comprehensive deployment checklist for $ARGUMENTS:

1. Pre-deployment validation
   - Run test suite
   - Check environment variables
   - Verify database migrations

2. Deployment steps
   - Build artifacts
   - Deploy to $ARGUMENTS
   - Run health checks

3. Post-deployment
   - Verify core functionality
   - Check error rates
   - Monitor performance
```

**Code review:**
```markdown
---
description: Perform comprehensive code review
allowed-tools: Read, Grep, Bash
---

Perform a thorough code review focusing on:

1. Code quality and style
2. Security vulnerabilities
3. Performance considerations
4. Test coverage
5. Documentation completeness

Provide specific, actionable feedback.
```

**Generate tests:**
```markdown
---
description: Generate unit tests for file
argument-hint: <file-path>
allowed-tools: Read, Write
---

Generate comprehensive unit tests for: $ARGUMENTS

Requirements:
- Test happy paths
- Test error cases
- Test edge cases
- Follow project test conventions
- Achieve >80% coverage
```

---

## Agents & Subagents

### Overview

Agents are specialized AI assistants that can be **explicitly invoked** or **automatically delegated** by Claude for specific tasks. Each agent operates in its own context window.

### Agent File Format

```markdown
---
name: agent-name
description: What this agent specializes in
tools: Read, Write, Bash, Grep
model: claude-3-5-sonnet-20241022
permissionMode: ask
skills: skill-1, skill-2
---

You are [agent role description].

## Your Role

Define the agent's primary responsibilities.

## Capabilities

List what this agent can do.

## Process

Describe the agent's workflow.

## Constraints

Any limitations or requirements.
```

### Frontmatter Fields

| Field | Purpose | Default |
|-------|---------|---------|
| `name` | Agent identifier | Required |
| `description` | Delegation triggers | Required |
| `tools` | Available tools | All tools |
| `model` | Specific model | Main model |
| `permissionMode` | Permission level | Inherit |
| `skills` | Available skills | All skills |

### Tool Configuration

**Inherit all tools (default):**
```yaml
# Omit tools field
```

**Restrict to specific tools:**
```yaml
tools: Read, Grep, Glob, Bash(git *)
```

**Allow all tools:**
```yaml
tools: "*"
```

### Key Features

**Separate Context Windows:**
Each agent has its own conversation context, preventing pollution of the main thread.

**Automatic Delegation:**
Claude delegates based on:
- Task description in request
- Agent's description field
- Current context
- Available tools

**Explicit Invocation:**
Users can explicitly invoke: `/agent agent-name`

### Storage Locations

- **Personal Agents**: `~/.claude/agents/`
- **Project Agents**: `.claude/agents/`
- **Plugin Agents**: Bundled with plugins

### Example Agents

**Security auditor:**
```markdown
---
name: security-auditor
description: Security expert for code review, vulnerability analysis, and security best practices
tools: Read, Grep, Bash
model: claude-3-5-sonnet-20241022
---

You are a security expert specializing in application security.

## Your Role

Perform comprehensive security audits of code and configurations.

## Analysis Areas

1. Authentication & Authorization
2. Input Validation & Sanitization
3. SQL Injection & XSS Prevention
4. CSRF Protection
5. Sensitive Data Exposure
6. Security Headers
7. Dependency Vulnerabilities

## Process

1. Understand codebase context
2. Identify security-critical components
3. Perform systematic analysis
4. Document findings with severity
5. Provide remediation steps
```

**Performance optimizer:**
```markdown
---
name: performance-optimizer
description: Performance expert for profiling, optimization, and scalability analysis
tools: Read, Grep, Bash
---

You are a performance optimization specialist.

## Your Role

Identify and resolve performance bottlenecks.

## Analysis Areas

1. Algorithm complexity
2. Database query optimization
3. Caching strategies
4. Resource utilization
5. Memory leaks
6. Bundle size optimization

## Methodology

1. Profile current performance
2. Identify bottlenecks
3. Propose optimizations
4. Estimate impact
5. Implement improvements
6. Verify results
```

**Test specialist:**
```markdown
---
name: test-specialist
description: Testing expert for unit tests, integration tests, and test coverage
tools: Read, Write, Bash
skills: test-coverage-analyzer
---

You are a testing specialist focused on comprehensive test coverage.

## Your Role

Create and maintain high-quality test suites.

## Test Types

1. Unit Tests - Component isolation
2. Integration Tests - Component interaction
3. E2E Tests - User workflows
4. Performance Tests - Load testing

## Best Practices

- Test behavior, not implementation
- Clear test names
- Arrange-Act-Assert pattern
- Meaningful assertions
- Mock external dependencies
```

---

## Best Practices

### Plugin Development

1. **Single Responsibility**: Each plugin should address one domain
2. **Clear Documentation**: README with usage examples
3. **Semantic Versioning**: Follow semver for releases
4. **Test Thoroughly**: Test all components before publishing
5. **Security Review**: Validate hooks and scripts
6. **Environment Variables**: Never hardcode secrets

### Component Design

**Commands:**
- Keep prompts focused and specific
- Use $ARGUMENTS effectively
- Restrict tools when possible
- Provide clear usage hints

**Agents:**
- Define clear expertise areas
- Use separate contexts for isolation
- Specify appropriate tool restrictions
- Document delegation triggers

**Skills:**
- Focus on one capability per skill
- Write trigger-rich descriptions
- Use progressive disclosure
- Test activation patterns

**Hooks:**
- Validate all inputs
- Set appropriate timeouts
- Handle errors gracefully
- Quote variables properly
- Test before production

### Team Distribution

**Repository-level setup:**
```json
{
  "extraKnownMarketplaces": [
    {
      "source": "github",
      "repo": "company/claude-plugins"
    }
  ],
  "extraKnownPlugins": [
    {
      "marketplace": "company-marketplace",
      "plugin": "security-tools"
    }
  ]
}
```

**Governance:**
- Allowlist approved marketplaces
- Review plugin changes via PRs
- Document required plugins in README
- Maintain change control
- Security review for new plugins

### Performance

**Context Management:**
- Use progressive disclosure in skills
- Keep command prompts concise
- Separate concerns with agents
- Clean up unused components

**Resource Usage:**
- Set reasonable hook timeouts
- Avoid expensive operations
- Cache when appropriate
- Monitor MCP server performance

---

## Security Considerations

### Critical Warnings

1. **Third-party Plugins**: "Use third party MCP servers at your own risk - Anthropic has not verified the correctness or security of all these servers."

2. **Trust Assessment**: "Make sure you trust MCP servers you are installing. Be especially careful when using MCP servers that could fetch untrusted content."

3. **Hook Execution**: "Claude Code hooks execute arbitrary shell commands on your system automatically. By using hooks, you acknowledge that you are solely responsible for the commands you configure."

### Best Practices

**Environment Variables:**
```bash
# Good - use environment variables
"env": { "API_KEY": "${API_KEY}" }

# Bad - hardcoded secrets
"env": { "API_KEY": "sk-1234567890" }
```

**Path Validation:**
```bash
# Good - validate paths
if [[ "$FILE_PATH" == *..* ]]; then
  echo "Path traversal detected" >&2
  exit 2
fi

# Bad - no validation
process_file "$FILE_PATH"
```

**Tool Restrictions:**
```yaml
# Good - restrict tools
allowed-tools: Read, Grep, Glob

# Bad - unrestricted
# (omit for full access only when necessary)
```

**Command Validation:**
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/scripts/validate.sh"
          }
        ]
      }
    ]
  }
}
```

### Enterprise Controls

**Managed MCP configuration** (`managed-mcp.json`):
```json
{
  "mcpServers": {
    "approved-server": {
      "type": "http",
      "url": "https://internal.company.com/mcp"
    }
  }
}
```

**Server allowlists** (`managed-settings.json`):
```json
{
  "allowedMcpServers": ["approved-server", "database"],
  "deniedMcpServers": ["unsafe-server"]
}
```

**Platform paths:**
- macOS: `/Library/Application Support/ClaudeCode/`
- Windows: `C:\ProgramData\ClaudeCode\`
- Linux: `/etc/claude-code/`

### Approval Requirements

- Project-scoped MCP servers require user approval
- Hooks in plugins must be reviewed
- Marketplace sources should be vetted
- Regular security audits recommended

---

## Real-World Examples

### Community Plugin Repositories

#### 1. Claude Code Plugins Plus
**Repository:** jeremylongshore/claude-code-plugins-plus
**Size:** 253 production-ready plugins
**Compliance:** 100% Anthropic 2025 Skills schema

**Notable plugins:**
- Excel Analyst Pro (DCF modeler, LBO modeler, variance analyzer)
- Investment banking templates
- Financial analysis tools

#### 2. Anthropic Official Skills
**Repository:** anthropics/skills
**Type:** Official Skills collection

**Examples:**
- Algorithmic art creation
- Canvas design
- Slack GIF creation
- MCP server generation
- Webapp testing
- Brand guidelines
- Internal communications

#### 3. Awesome Claude Code
**Repository:** hesreallyhim/awesome-claude-code
**Focus:** Project management workflows

**Features:**
- Specialized agents collection
- Slash commands library
- TDD Guard (hooks-driven TDD enforcement)
- Code quality regulation hooks
- Comprehensive documentation

#### 4. CCPlugins
**Repository:** brennercruvinel/CCPlugins
**Size:** 24 professional commands
**Target:** Opus 4 and Sonnet 4 optimized

**Use cases:**
- Enterprise development workflows
- Team standardization
- Production-grade automation

#### 5. VoltAgent Subagents
**Repository:** VoltAgent/awesome-claude-code-subagents
**Size:** 100+ specialized agents

**Categories:**
- Full-stack development
- DevOps operations
- Data science
- Business operations

### Example Plugin Implementations

#### Security Scanner Plugin

```
security-scanner/
├── .claude-plugin/
│   └── plugin.json
├── commands/
│   ├── security-audit.md
│   └── vulnerability-scan.md
├── agents/
│   ├── security-auditor.md
│   └── penetration-tester.md
├── skills/
│   └── owasp-checker/
│       └── SKILL.md
├── hooks/
│   └── hooks.json
└── scripts/
    └── scan.sh
```

**plugin.json:**
```json
{
  "name": "security-scanner",
  "version": "1.0.0",
  "description": "Comprehensive security scanning and auditing",
  "keywords": ["security", "audit", "vulnerability"]
}
```

**commands/security-audit.md:**
```markdown
---
description: Perform comprehensive security audit
allowed-tools: Read, Grep, Bash
---

Perform a thorough security audit of the codebase:

1. Scan for common vulnerabilities (OWASP Top 10)
2. Check dependencies for known CVEs
3. Review authentication/authorization
4. Validate input sanitization
5. Check for sensitive data exposure
```

**hooks/hooks.json:**
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/scripts/scan.sh \"$FILE_PATH\""
          }
        ]
      }
    ]
  }
}
```

#### DevOps Automation Plugin

```
devops-tools/
├── .claude-plugin/
│   └── plugin.json
├── commands/
│   ├── deploy.md
│   ├── rollback.md
│   └── scale.md
├── agents/
│   ├── deployment-specialist.md
│   └── infrastructure-expert.md
├── .mcp.json
└── scripts/
    ├── deploy.sh
    └── health-check.sh
```

**.mcp.json:**
```json
{
  "mcpServers": {
    "kubernetes": {
      "type": "stdio",
      "command": "kubectl",
      "args": ["--context", "${K8S_CONTEXT}"]
    },
    "terraform": {
      "type": "stdio",
      "command": "terraform",
      "env": {
        "TF_VAR_environment": "${ENVIRONMENT}"
      }
    }
  }
}
```

---

## Troubleshooting

### Plugin Not Loading

**Symptoms:** Plugin installed but components not appearing

**Solutions:**
```bash
# Verify plugin structure
ls -la .claude-plugin/
cat .claude-plugin/plugin.json

# Check plugin status
/plugin list

# Reinstall
/plugin uninstall plugin-name@marketplace
/plugin install plugin-name@marketplace

# Check logs
claude --debug
```

### Command Not Found

**Symptoms:** `/command` not recognized

**Solutions:**
```bash
# Verify command file location
ls -la commands/

# Check frontmatter
cat commands/command-name.md

# Ensure description field exists
# description: Required for commands

# Restart Claude Code
```

### Skill Not Activating

**Symptoms:** Skill exists but Claude doesn't use it

**Solutions:**
```markdown
<!-- Improve description with triggers -->
---
name: pdf-processor
description: Extract text and tables from PDF files, fill forms, merge PDFs. Use when working with PDFs, document extraction, form filling, or PDF manipulation.
---

<!-- Was too vague: -->
description: Process documents
```

### Hook Not Executing

**Symptoms:** Hook configured but not running

**Solutions:**
```bash
# Check hook configuration
cat hooks/hooks.json

# Verify matcher pattern
# "Write|Edit" not "write|edit" (case-sensitive)

# Test command manually
bash -c 'YOUR_HOOK_COMMAND'

# Check timeout
# Default is 60 seconds, increase if needed
"timeout": 120000

# View registered hooks
/hooks

# Enable debug mode
claude --debug
```

### MCP Server Connection Failed

**Symptoms:** MCP server not connecting

**Solutions:**
```bash
# Test server manually
claude mcp get server-name

# Check environment variables
echo $API_KEY

# Verify transport type
# "type": "stdio" for local
# "type": "http" for remote

# Check timeout
MCP_TIMEOUT=30000 claude

# Enable MCP debug
claude --mcp-debug

# Restart required after changes
# Restart Claude Code
```

### Permission Issues

**Symptoms:** Operations blocked unexpectedly

**Solutions:**
```bash
# Check permission mode
claude --permission-mode auto

# Review tool allowlist
# In settings.json or frontmatter

# Check hook permissions
# Hooks can block operations

# Verify file permissions
ls -la /path/to/file
```

### Marketplace Not Found

**Symptoms:** Cannot add marketplace

**Solutions:**
```bash
# Verify repository exists
# For GitHub: https://github.com/user/repo

# Check marketplace.json location
# Must be in .claude-plugin/marketplace.json

# Try full URL
/plugin marketplace add https://github.com/user/repo

# Check network connectivity
curl https://github.com/user/repo

# Verify JSON syntax
cat .claude-plugin/marketplace.json | jq
```

### Environment Variables Not Expanding

**Symptoms:** ${VAR} appears literally

**Solutions:**
```bash
# Set environment variable
export VAR=value

# Use in .env file
echo "VAR=value" >> .env

# Check expansion syntax
# Correct: ${VAR}
# Correct: ${VAR:-default}
# Wrong: $VAR

# Restart Claude Code to load new env
```

### Agent Not Delegating

**Symptoms:** Agent not automatically invoked

**Solutions:**
```markdown
<!-- Improve description -->
---
name: test-specialist
description: Testing expert who writes unit tests, integration tests, and ensures test coverage. Delegate when user asks to write tests, increase coverage, or test functionality.
---

<!-- Was too generic: -->
description: Helps with testing
```

---

## Summary

Claude Code's plugin system provides a powerful, extensible architecture for:

- **Commands**: User-invoked prompt shortcuts
- **Agents**: Specialized AI assistants with separate contexts
- **Skills**: Model-invoked capabilities for specific tasks
- **Hooks**: Event-driven automation and validation
- **MCP Servers**: External tool and data integrations

### Key Takeaways

1. **Modular Design**: Combine components as needed
2. **Team Distribution**: Share via marketplaces
3. **Security First**: Validate inputs, restrict tools, use environment variables
4. **Clear Triggers**: Write descriptive frontmatter for proper activation
5. **Progressive Enhancement**: Start simple, add complexity as needed

### Quick Reference

```bash
# Install plugin
/plugin install plugin-name@marketplace-name

# Add marketplace
/plugin marketplace add user/repo

# View hooks
/hooks

# Manage MCP
claude mcp list

# Debug mode
claude --debug
```

### Resources

- Official Docs: https://code.claude.com/docs/en/plugins
- Official Skills: https://github.com/anthropics/skills
- Community Plugins: https://github.com/topics/claude-code-plugins
- Marketplace Hub: https://claude-plugins.dev/

---

**Document Version:** 1.0.0
**Generated:** 2025-11-18
**Maintained By:** Research compilation from official Claude Code documentation
