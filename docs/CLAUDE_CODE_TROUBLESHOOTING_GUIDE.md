# Claude Code Comprehensive Troubleshooting Guide

> Complete technical reference for troubleshooting Claude Code installation, configuration, performance, and debugging issues.

**Last Updated:** 2025-11-18
**Source:** https://code.claude.com/docs/en/troubleshooting

---

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [Authentication & Configuration](#authentication--configuration)
3. [Connection & Network Problems](#connection--network-problems)
4. [Platform-Specific Issues](#platform-specific-issues)
5. [Performance Optimization](#performance-optimization)
6. [MCP Server Issues](#mcp-server-issues)
7. [Search & Tool Integration](#search--tool-integration)
8. [Context Window Management](#context-window-management)
9. [SSL/TLS Certificate Problems](#ssltls-certificate-problems)
10. [Debugging Commands & Tools](#debugging-commands--tools)
11. [Error Patterns & Solutions](#error-patterns--solutions)
12. [Best Practices](#best-practices)

---

## Installation Issues

### Node.js Requirements

**Minimum Version:** Node.js 18.0 or higher

```bash
# Check Node.js version
node --version

# Verify npm version
npm --version
```

**Common Solutions:**
- Install/upgrade from nodejs.org
- Use nvm (Node Version Manager) for version management
- Ensure system-wide Node.js installation (not just user-local)

### Permission Errors (EACCES)

**macOS/Linux:**
```bash
# Fix npm ownership
sudo chown -R $(whoami) ~/.npm

# Alternative: Use nvm to avoid permission issues
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
```

**Windows:**
```powershell
# Run Command Prompt as Administrator
npm install -g @anthropic-ai/claude-code
```

**Alternative Installation Methods:**
```bash
# macOS/Linux - Native installer (no npm required)
curl -fsSL https://claude.ai/install.sh | bash

# Windows - PowerShell installer
irm https://claude.ai/install.ps1 | iex

# Migrate existing installation to user directory
claude migrate-installer
```

### Command Not Found

**Symptom:** `claude: command not found`

**Diagnosis:**
```bash
# Check if Claude Code is installed
which claude

# Check npm global prefix
npm config get prefix

# Verify PATH includes npm global bin
echo $PATH
```

**Solutions:**
```bash
# Reinstall globally
npm install -g @anthropic-ai/claude-code

# Add npm global bin to PATH (add to ~/.bashrc or ~/.zshrc)
export PATH="$PATH:$(npm config get prefix)/bin"

# Reload shell configuration
source ~/.bashrc  # or source ~/.zshrc
```

### Installation Timeout

**Solutions:**
```bash
# Clear npm cache
npm cache clean --force

# Use alternative registry
npm install -g @anthropic-ai/claude-code --registry https://registry.npmjs.org/

# Increase timeout
npm install -g @anthropic-ai/claude-code --timeout=60000
```

---

## Authentication & Configuration

### API Key Issues

**Configuration Methods:**
```bash
# Interactive configuration
claude config

# Environment variable (add to ~/.bashrc or ~/.zshrc)
export ANTHROPIC_API_KEY="your-api-key-here"

# Verify configuration
echo $ANTHROPIC_API_KEY
```

**Common Problems:**
- Extra spaces or characters in API key
- Copying incomplete key from console
- Using expired or invalid key
- Wrong environment variable name

**Solution:**
```bash
# Remove stored auth and reconfigure
rm -rf ~/.config/claude-code/auth.json
claude config

# Get new API key from
# https://console.anthropic.com
```

### Configuration File Location

**Primary Config:** `~/.claude.json`

```bash
# View current configuration
cat ~/.claude.json

# Reset configuration
claude config --reset

# Backup configuration
cp ~/.claude.json ~/.claude.json.backup
```

### Subscription Recognition Problems

**Symptom:** Claude Max/Pro not recognized

**Solutions:**
1. Clear browser cookies and cache
2. Use incognito mode to re-login to claude.ai
3. Run `claude config` to re-authenticate
4. Verify subscription at https://console.anthropic.com

### OAuth Authentication Failures

**Error:** "OAuth account information not found in config"

**Solution:**
```bash
# Remove auth file
rm -rf ~/.config/claude-code/auth.json

# Re-authenticate
claude

# Follow OAuth flow in browser
```

---

## Connection & Network Problems

### 503 Service Unavailable

**Nature:** Server-side issue, NOT a local problem

**Recommended Actions:**
- Wait 2-5 minutes for automatic recovery
- Check https://status.anthropic.com for service status
- DO NOT reinstall or reconfigure during outages

**What NOT to Do:**
- Don't uninstall/reinstall
- Don't modify configuration
- Don't clear cache

### Unresponsive Sessions

**Symptoms:**
- No response from Claude
- Hanging commands
- Frozen terminal

**Solutions:**
```bash
# Within Claude session
/clear

# Restart Claude Code
# Press Ctrl+C to exit, then restart
claude

# Check internet connectivity
ping claude.ai

# Verify API status
curl -I https://api.anthropic.com
```

### Connection Errors

**Common Error:** "Unable to connect to API due to poor internet connection"

**Diagnosis:**
```bash
# Test internet connectivity
ping -c 4 8.8.8.8

# Test DNS resolution
nslookup claude.ai

# Test API endpoint
curl -v https://api.anthropic.com
```

**Solutions:**
1. Check firewall settings
2. Verify VPN configuration
3. Test without proxy
4. Check corporate network restrictions

### Proxy Configuration

**Environment Variables:**
```bash
# HTTP Proxy
export HTTP_PROXY="http://proxy.company.com:8080"
export HTTPS_PROXY="https://proxy.company.com:8080"

# No proxy for local addresses
export NO_PROXY="localhost,127.0.0.1,.local"
```

**Corporate Proxy with Authentication:**
```bash
export HTTP_PROXY="http://username:password@proxy.company.com:8080"
export HTTPS_PROXY="https://username:password@proxy.company.com:8080"
```

---

## Platform-Specific Issues

### Windows WSL (Windows Subsystem for Linux)

#### OS/Platform Detection Issues

**Error:** Installation fails with OS detection error

**Symptoms:**
- WSL using Windows npm instead of Linux npm
- "exec: node: not found" errors
- Platform mismatch warnings

**Diagnosis:**
```bash
# Check which npm/node is being used
which npm
which node

# Should show Linux paths like /usr/bin/npm
# NOT Windows paths like /mnt/c/Program Files/nodejs/npm
```

**Solutions:**

**Option 1: Force Installation**
```bash
npm install -g @anthropic-ai/claude-code --force --no-os-check
```

**Option 2: Fix Node.js Installation**
```bash
# Install Node.js via Linux package manager
sudo apt update
sudo apt install nodejs npm

# Or use nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install --lts
nvm use --lts
```

**Option 3: Configure npm for Linux**
```bash
npm config set os linux
npm install -g @anthropic-ai/claude-code
```

#### nvm Version Conflicts

**Problem:** WSL imports Windows PATH, causing Windows nvm/npm to take priority

**Solution:**
```bash
# Edit /etc/wsl.conf
sudo nano /etc/wsl.conf

# Add these lines
[interop]
appendWindowsPath = false

# Restart WSL
# In Windows PowerShell:
wsl --shutdown

# Ensure nvm loads in shell config
# Add to ~/.bashrc or ~/.zshrc
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

#### JetBrains IDE Detection on WSL2

**Error:** "No available IDEs detected"

**Root Cause:** WSL2 NAT networking + Windows Firewall blocking connections

**Solution 1: Configure Windows Firewall**
```powershell
# Run in Windows PowerShell as Administrator
New-NetFirewallRule -DisplayName "Allow WSL2 Internal Traffic" -Direction Inbound -Protocol TCP -Action Allow
```

**Solution 2: Switch to Mirrored Networking**
```bash
# Create/edit .wslconfig in Windows user directory
# Location: C:\Users\YourUsername\.wslconfig

[wsl2]
networkingMode=mirrored
```

**Solution 3: Terminal Configuration (for JetBrains Terminal)**
- Settings → Tools → Terminal
- Adjust ESC key behavior if malfunctioning

**Diagnostic Information to Collect:**
- WSL version (1 or 2): `wsl --version`
- Networking mode (NAT or mirrored): check `.wslconfig`
- IDE name and version
- Claude Code extension/plugin version
- Shell type (bash/zsh): `echo $SHELL`

#### WSL Performance Optimization

**File System Location Matters:**
```bash
# SLOW: Windows filesystem accessed from WSL
/mnt/c/Users/YourName/projects/

# FAST: Native Linux filesystem
/home/yourname/projects/

# Move projects to Linux filesystem
cp -r /mnt/c/Users/YourName/projects/ ~/projects/
```

**WSL Configuration for Performance:**
```ini
# Edit .wslconfig in Windows user directory
# C:\Users\YourUsername\.wslconfig

[wsl2]
memory=8GB
processors=4
swap=2GB
localhostForwarding=true
```

**Update WSL:**
```powershell
# In Windows PowerShell
wsl --update
wsl --shutdown
```

### macOS Issues

**M1/M2 Architecture:**
```bash
# Check architecture
uname -m

# For Rosetta issues, ensure native arm64 Node.js
arch -arm64 npm install -g @anthropic-ai/claude-code
```

**Permission Issues:**
```bash
# Fix ownership of npm directories
sudo chown -R $(whoami) /usr/local/lib/node_modules
sudo chown -R $(whoami) /usr/local/bin
```

### Linux Distribution-Specific

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install -y nodejs npm
npm install -g @anthropic-ai/claude-code
```

**Fedora/RHEL/CentOS:**
```bash
sudo dnf install nodejs npm
npm install -g @anthropic-ai/claude-code
```

**Arch Linux:**
```bash
sudo pacman -S nodejs npm
npm install -g @anthropic-ai/claude-code
```

**Alpine Linux:**
```bash
apk add nodejs npm
npm install -g @anthropic-ai/claude-code
```

---

## Performance Optimization

### Slow Response Times

**Model Selection:**
```bash
# Use faster model
claude --model claude-sonnet-4-20250514

# Check current model
claude --help | grep model
```

**Context Optimization:**
```bash
# Compress context (preserves essential information)
/compact

# Clear context completely
/clear

# Check context usage
# Monitor the context meter in Claude Code UI
```

**System Requirements:**
- Minimum 16GB RAM recommended
- SSD for faster file operations
- Stable internet connection (10+ Mbps)

### Memory Management

**Restart Regularly:**
- Start new sessions for unrelated tasks
- Don't run marathon sessions
- Use `/clear` between different features

**Break Large Tasks:**
```bash
# Instead of one large task
"Refactor entire codebase"

# Break into smaller chunks
1. "Refactor authentication module"
2. "Refactor database layer"
3. "Refactor API routes"
```

### Context Window Full

**Symptoms:**
- Performance degradation
- Incomplete responses
- Context-related errors

**Solutions:**
```bash
# Immediate reset
/clear

# Smart compression
/compact

# Reduce context upfront
# Use specific file ranges
@src/auth/login.ts:10-50

# Create summaries in CLAUDE.md
# Only include essential information
```

**Best Practices:**
- Monitor context meter
- Use `/compact` at 70% capacity
- Complete related work in focused chunks
- Store persistent info in CLAUDE.md (keep it minimal)

---

## MCP Server Issues

### MCP Servers Not Loading

**Common Issues:**
1. Configuration file not found
2. Incorrect file location
3. Invalid JSON syntax
4. Missing environment variables

**Configuration File Locations:**
```bash
# Project-specific (checked into git)
./.mcp.json

# User-specific
~/.claude/.mcp.json

# Global (deprecated)
~/.config/claude-code/mcp.json
```

**Diagnostic Steps:**
```bash
# List configured MCP servers
claude mcp list

# If returns "No MCP servers configured", check:
# 1. File exists and is readable
ls -la .mcp.json

# 2. Valid JSON syntax
cat .mcp.json | python -m json.tool

# 3. Restart Claude Code
# Configuration changes require restart
```

### Configuration File Not Detected

**Problem:** `.claude/.mcp.json` not loading

**Workaround:** Move to project root
```bash
mv .claude/.mcp.json ./.mcp.json
```

**Restart Required:**
```bash
# Exit Claude Code (Ctrl+C)
# Restart
claude
```

### MCP Server Connection Failures

**Debugging Flag:**
```bash
# Start Claude with MCP debugging
claude --mcp-debug

# Provides detailed connection logs
```

**Common Issues:**

**1. Invalid Absolute Paths:**
```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["/absolute/path/to/server.js"],  // Must be absolute
      "env": {}
    }
  }
}
```

**2. Missing Environment Variables:**
```json
{
  "mcpServers": {
    "task-master-ai": {
      "command": "npx",
      "args": ["-y", "task-master-ai"],
      "env": {
        "ANTHROPIC_API_KEY": "your-key-here"  // Required
      }
    }
  }
}
```

**3. Node Version Conflicts:**
- Ensure consistent Node.js version
- Use absolute path to node binary
- Verify with `which node`

### MCP Log File Location

**Check Logs:**
```bash
# macOS
~/Library/Logs/claude-code/mcp-server-{name}.log

# Linux
~/.local/state/claude-code/logs/mcp-server-{name}.log

# Windows (WSL)
~/.local/state/claude-code/logs/mcp-server-{name}.log
```

### WSL-Specific MCP Issues

**Problem:** MCP server binding to 127.0.0.1 only

**Cause:** WSL creates virtual interface, server must listen on WSL interface

**Solution:** Configure server to bind to 0.0.0.0 or WSL interface IP
```bash
# Find WSL interface IP
ip addr show eth0 | grep inet

# Configure server to listen on WSL IP
```

---

## Search & Tool Integration

### Ripgrep Installation

**Issue:** Search, @file mentions, custom agents, slash commands not working

**Cause:** Missing or incorrectly configured ripgrep

**Solution:**

**macOS:**
```bash
brew install ripgrep

# Verify installation
rg --version

# Set environment variable
export USE_BUILTIN_RIPGREP=0
```

**Windows:**
```powershell
winget install BurntSushi.ripgrep.MSVC

# Or via Chocolatey
choco install ripgrep
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install ripgrep
```

**Fedora/RHEL:**
```bash
sudo dnf install ripgrep
```

**Arch Linux:**
```bash
sudo pacman -S ripgrep
```

**Alpine Linux:**
```bash
apk add ripgrep
```

**Environment Variable:**
```bash
# Add to ~/.bashrc or ~/.zshrc
export USE_BUILTIN_RIPGREP=0

# Reload shell
source ~/.bashrc
```

### Ripgrep Performance

**WSL Performance Issues:**
- Use Linux filesystem (/home/) not Windows (/mnt/c/)
- Install ripgrep in WSL, not Windows
- Disk read performance penalty across filesystems

**Built-in vs System Ripgrep:**
```bash
# Use built-in (default)
# No configuration needed

# Use system ripgrep (faster for large codebases)
export USE_BUILTIN_RIPGREP=0
```

### Search Not Finding Files

**Common Issues:**

**1. .gitignore Exclusions:**
```bash
# ripgrep respects .gitignore by default
# To search all files including ignored:
rg --no-ignore "pattern"
```

**2. Hidden Files:**
```bash
# Search hidden files
rg --hidden "pattern"
```

**3. Binary Files:**
```bash
# Search binary files
rg --text "pattern"
```

---

## Context Window Management

### Context Window Limits

**Current Limits:**
- Claude Sonnet 4.5: 200,000 tokens (expanding to 1M)
- Claude Haiku 4.5: 200,000 tokens
- Context awareness enabled (models track remaining tokens)

**Performance Characteristics:**
- Optimal performance: 0-70% capacity
- Degraded performance: 70-90% capacity
- Avoid: 90-100% capacity (poor quality, memory issues)

### CLAUDE.md Best Practices

**Keep It Minimal:**
```markdown
# Good - Essential only
- Project uses React + TypeScript
- Tests go in __tests__ folder
- Run `npm test` before committing

# Bad - Too verbose
- History of project decisions
- Detailed API documentation
- Complete style guide
```

**File Locations (in priority order):**
```bash
# Project-specific (highest priority)
./CLAUDE.md

# Parent directory
../CLAUDE.md

# User global (lowest priority)
~/.claude/CLAUDE.md
```

**What to Include:**
- Essential project conventions
- Critical bash commands
- Testing requirements
- Common patterns

**What NOT to Include:**
- Detailed documentation (reference with @docs/file.md)
- Long code examples
- Duplicate information from codebase
- Historical context

### Context Management Commands

```bash
# Monitor context usage
# Check context meter in UI

# At 70% capacity - compress
/compact

# Between different tasks - reset
/clear

# Strategic file references
@src/auth/login.ts           # Entire file
@src/auth/login.ts:10-50     # Specific lines only
```

### Strategic Chunking

**Bad Approach:**
```
Single long session touching:
- Authentication refactor
- Database migration
- API redesign
- Frontend updates
- Documentation
```

**Good Approach:**
```
Session 1: Authentication refactor + tests
/clear
Session 2: Database migration + tests
/clear
Session 3: API redesign + tests
/clear
Session 4: Frontend updates + tests
/clear
Session 5: Documentation updates
```

### Context-Aware Features (Sonnet 4.5+)

**Automatic Context Management:**
- Models track remaining token budget
- Intelligent context pruning
- Memory tool for long-running tasks
- Context editing capabilities

**New Capabilities:**
- Extended task execution without hitting limits
- Critical information preservation
- Automatic context optimization

---

## SSL/TLS Certificate Problems

### Self-Signed Certificate Errors

**Error:** `SELF_SIGNED_CERT_IN_CHAIN`

**Common Scenarios:**
- Corporate proxy with custom SSL inspection
- Self-signed certificates in development
- Internal CA certificates

### Corporate Proxy Configuration

**Certificate Bundle Setup:**
```bash
# Export certificate bundle path
export SSL_CERT_FILE=/path/to/certificate-bundle.crt
export NODE_EXTRA_CA_CERTS=/path/to/certificate-bundle.crt

# Add to ~/.bashrc or ~/.zshrc for persistence
echo 'export SSL_CERT_FILE=/path/to/certificate-bundle.crt' >> ~/.bashrc
echo 'export NODE_EXTRA_CA_CERTS=/path/to/certificate-bundle.crt' >> ~/.bashrc
```

**Get Certificate Bundle:**
```bash
# Export from browser
# Chrome: Settings → Security → Manage certificates → Export

# From corporate IT
# Contact IT department for certificate bundle

# System certificates (macOS)
security find-certificate -a -p /System/Library/Keychains/SystemRootCertificates.keychain > /tmp/certs.pem
```

### Mutual TLS (mTLS)

**Enterprise Authentication:**
```bash
# Client certificate
export SSL_CERT_FILE=/path/to/client-cert.pem

# Client key
export SSL_KEY_FILE=/path/to/client-key.pem

# CA bundle
export NODE_EXTRA_CA_CERTS=/path/to/ca-bundle.pem
```

### IP-Based Connection Issues

**Problem:** Claude Code connects to IP addresses instead of hostnames

**Impact:** SSL certificate validation fails (certs are for hostnames, not IPs)

**Workaround:** Ensure DNS resolution works correctly
```bash
# Test DNS
nslookup api.anthropic.com

# Test connection
curl -v https://api.anthropic.com
```

### Unsafe Workaround (NOT RECOMMENDED)

```bash
# DANGEROUS: Disables all certificate validation
export NODE_TLS_REJECT_UNAUTHORIZED=0

# ONLY use for:
# - Local development
# - Temporary debugging
# - Non-production environments
# NEVER use in production or with sensitive data
```

### MCP SSL Issues

**Problem:** MCP servers work, but web fetch fails with SSL errors

**Diagnosis:**
```bash
# Start with MCP debugging
claude --mcp-debug

# Check if MCP and fetch use different cert handling
```

**Solution:**
```bash
# Ensure both SSL_CERT_FILE and NODE_EXTRA_CA_CERTS are set
export SSL_CERT_FILE=/path/to/bundle.crt
export NODE_EXTRA_CA_CERTS=/path/to/bundle.crt
```

---

## Debugging Commands & Tools

### /doctor Command

**Run Diagnostics:**
```bash
# Within Claude session
/doctor

# Shows:
# - Installation health
# - Configuration status
# - Search functionality status
# - Environment checks
# - Log locations
```

**Common Outputs:**
- "Search: OK" - ripgrep working
- "Search: Missing" - install ripgrep
- Permission issues
- Configuration problems

### /bug Command

**Report Issues:**
```bash
# Within Claude session
/bug

# Automatically:
# - Collects diagnostic information
# - Prepares issue report
# - Opens GitHub issue template
```

**Information Collected:**
- Claude Code version
- Node.js version
- Platform/OS details
- Recent error messages
- Configuration (sanitized)

### Verbose Logging

**Enable Detailed Logging:**
```bash
# Verbose mode
claude --verbose

# Shows:
# - Internal operations
# - Tool executions
# - File operations
# - API communications
# - Timestamps
# - Operation parameters
```

**Redirect to File:**
```bash
# Capture all output
claude --verbose 2>&1 | tee debug.log

# Or redirect to file only
claude --verbose > debug.log 2>&1
```

### MCP Debugging

**Debug MCP Connections:**
```bash
# Start with MCP debugging enabled
claude --mcp-debug

# Shows:
# - MCP server startup
# - Connection attempts
# - Configuration loading
# - Communication logs
# - Error details
```

### Headless Mode for Automation

**Non-Interactive Execution:**
```bash
# Single prompt
claude -p "analyze this codebase for security issues"

# Stream JSON output
claude -p "refactor auth.ts" --output-format stream-json

# Automation example
claude -p "run tests" --output-format json > test-results.json
```

**Use Cases:**
- CI/CD pipelines
- Pre-commit hooks
- Build scripts
- Automated testing
- Batch processing

### Version Information

**Check Versions:**
```bash
# Claude Code version
claude --version

# Node.js version
node --version

# npm version
npm --version

# System information
uname -a

# On macOS
sw_vers

# On Linux
lsb_release -a
```

---

## Error Patterns & Solutions

### Common Error Messages

#### "Command not found: claude"

**Cause:** Installation failed or PATH not configured

**Solution:**
```bash
# Verify installation
npm list -g @anthropic-ai/claude-code

# Reinstall if not found
npm install -g @anthropic-ai/claude-code

# Add to PATH
export PATH="$PATH:$(npm config get prefix)/bin"
```

#### "exec: node: not found"

**Cause:** Node.js not installed or not in PATH

**Solution:**
```bash
# Check Node.js installation
which node

# Install if missing
# Ubuntu/Debian
sudo apt install nodejs

# macOS
brew install node

# Use nvm (recommended)
nvm install --lts
```

#### "npm ERR! code EACCES"

**Cause:** Permission denied for npm global install

**Solution:**
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}

# Or use nvm to avoid sudo
```

#### "Invalid API key"

**Cause:** Incorrect or expired API key

**Solution:**
```bash
# Reconfigure
claude config

# Get new key from
# https://console.anthropic.com

# Verify no extra spaces
echo $ANTHROPIC_API_KEY | wc -c
```

#### "503 Service Unavailable"

**Cause:** Anthropic API temporarily down

**Solution:**
- Wait 2-5 minutes
- Check https://status.anthropic.com
- Don't reinstall or reconfigure

#### "Context window full"

**Cause:** Conversation too long

**Solution:**
```bash
/compact  # Compress context
/clear    # Reset completely
```

#### "No available IDEs detected"

**Cause:** JetBrains IDE plugin not installed or WSL networking

**Solution:**
1. Install Claude Code plugin in IDE
2. Ensure IDE is running
3. For WSL2: Configure firewall (see WSL section)

#### "Unable to connect to API"

**Cause:** Network/firewall/proxy issues

**Solution:**
```bash
# Test connectivity
ping api.anthropic.com

# Check proxy settings
echo $HTTP_PROXY
echo $HTTPS_PROXY

# Try without proxy
unset HTTP_PROXY HTTPS_PROXY
```

### Certificate Error Patterns

**Errors:**
- `SELF_SIGNED_CERT_IN_CHAIN`
- `UNABLE_TO_VERIFY_LEAF_SIGNATURE`
- `CERT_HAS_EXPIRED`
- `ERR_TLS_CERT_ALTNAME_INVALID`

**Solution:** See [SSL/TLS Certificate Problems](#ssltls-certificate-problems)

### Installation Failure Patterns

**40% of crashes stem from:**
- Corrupted installations
- Permission errors
- Version conflicts

**Nuclear Option - Complete Reset:**
```bash
# 1. Uninstall
npm uninstall -g @anthropic-ai/claude-code

# 2. Remove config files
rm -rf ~/.claude.json
rm -rf ~/.claude/
rm -rf ~/.config/claude-code/

# 3. Clear npm cache
npm cache clean --force

# 4. Fresh install
npm install -g @anthropic-ai/claude-code

# 5. Reconfigure
claude config
```

---

## Best Practices

### Setup Optimization

#### CLAUDE.md Files

**Purpose:** Persistent context automatically included in every conversation

**What to Include:**
```markdown
# Project Conventions
- TypeScript + React
- Tests in __tests__/ directories
- Run `npm test` before commits

# Essential Commands
- `npm run dev` - Start dev server
- `npm test` - Run test suite
- `npm run build` - Production build

# Code Style
- 2-space indentation
- Prettier for formatting
- ESLint rules enforced

# Testing Requirements
- Write tests for all new features
- Minimum 80% coverage
- No mocking unless necessary
```

**Hierarchy (first match wins):**
1. `./CLAUDE.md` (project-specific)
2. `../CLAUDE.md` (parent directory)
3. `~/.claude/CLAUDE.md` (global user config)

#### Tool Allowlisting

**Methods:**
1. Select "Always allow" during session
2. Use `/permissions` command
3. Edit `.claude/settings.json`
4. Use `--allowedTools` CLI flag

**Example `.claude/settings.json`:**
```json
{
  "allowedTools": [
    "Edit",
    "Bash(task-master *)",
    "Bash(git *)",
    "Bash(npm run *)",
    "mcp__task_master_ai__*"
  ]
}
```

#### Custom Slash Commands

**Location:** `.claude/commands/`

**Example:** `.claude/commands/test-coverage.md`
```markdown
# Test Coverage Analysis
Run test coverage analysis and report results.

Steps:
1. Run `npm run test:coverage`
2. Analyze coverage report
3. Identify files below 80% coverage
4. Suggest tests to add

Report format:
- Overall coverage percentage
- Files needing tests
- Specific uncovered lines
```

**Parameterized Commands:** Use `$ARGUMENTS`
```markdown
# Debug Feature: $ARGUMENTS
Debug the specified feature.

1. Search for relevant code
2. Check recent changes with git
3. Run tests for this feature
4. Analyze error logs
```

### Effective Workflows

#### Explore → Plan → Code → Commit

**1. Explore:**
```bash
# Read relevant files without writing
@src/auth/
@tests/auth/

"Read the authentication code and tests. Don't make changes yet."
```

**2. Plan:**
```bash
# Request planning with extended thinking
"Think hard about how to add OAuth support to the existing auth system."

# Levels of thinking:
# - "think" - basic planning
# - "think hard" - moderate computation
# - "think harder" - significant analysis
# - "ultrathink" - maximum computation budget
```

**3. Code:**
```bash
"Implement the OAuth integration following the plan."
```

**4. Commit:**
```bash
"Create a commit for the OAuth implementation. Update CLAUDE.md with new auth patterns."
```

#### Test-Driven Development

**Process:**
1. Write failing tests based on requirements
2. Confirm tests fail
3. Commit tests
4. Implement code to pass tests
5. Verify with independent review (new session or subagent)

**Example:**
```bash
# Session 1
"Write tests for OAuth login flow. Expected: user redirects to provider, callback handles token."
/clear

# Session 2
"Implement OAuth login to pass the tests we wrote."
```

#### Visual Iteration

**For UI Work:**
1. Provide screenshot of current state
2. Provide design mock as reference
3. Implement changes
4. Take new screenshot
5. Iterate 2-3 times for optimization

**Commands:**
```bash
# Upload screenshots by dragging into prompt
# Or reference URLs
"Compare this screenshot to the design mock. Fix spacing and colors."
```

### Context Management

#### Use /clear Frequently

**When to Clear:**
- Between unrelated tasks
- After completing a feature
- When switching contexts
- If performance degrades

**Example Session:**
```bash
# Task 1: Auth implementation
"Implement OAuth login"
... work ...
/clear

# Task 2: Database migration
"Create migration for user preferences"
... work ...
/clear

# Task 3: Documentation
"Update API docs for new endpoints"
```

#### File Referencing

**Methods:**
```bash
# Tab-completion
@src/auth[TAB]

# Drag-drop
# Drag file into terminal

# Specific lines
@src/auth/login.ts:10-50

# URLs
@https://api.example.com/docs

# Piping data
cat large-log.txt | claude -p "analyze errors"
```

#### Checklist-Based Workflows

**For Complex Migrations:**
```markdown
Migration Checklist:
- [ ] Update database schema
- [ ] Migrate existing data
- [ ] Update ORM models
- [ ] Update API endpoints
- [ ] Update frontend clients
- [ ] Update tests
- [ ] Update documentation
- [ ] Performance testing
```

**Process systematically:**
1. Work through one item at a time
2. Verify before moving to next
3. Use `/compact` periodically
4. Don't rush through all items

### GitHub Integration

**Use `gh` CLI:**
```bash
# Install gh CLI
brew install gh  # macOS
sudo apt install gh  # Ubuntu

# Authenticate
gh auth login

# Claude can now:
# - Create PRs
# - Review code
# - Fix build failures
# - Triage issues
```

**Examples:**
```bash
"Create a PR for this feature branch"
"Review PR #123 and fix the issues"
"The CI build failed. Fix the errors."
"Triage open issues and categorize by priority"
```

### Git Operations

**Claude can help with:**
```bash
# Search commit history
"Find commits that modified the auth system in the last month"

# Compose commit messages
"Create a commit message for these changes"

# Handle rebase conflicts
"Help me resolve these rebase conflicts"

# Compare branches
"Compare this branch to main and summarize differences"
```

### Instruction Specificity

**Poor Instructions:**
```bash
"add tests for foo.py"
"fix the bug"
"make it better"
```

**Better Instructions:**
```bash
"Write new test case for foo.py covering the edge case where the user is logged out. Avoid mocks - use real database with test fixtures."

"Fix the authentication bug where users remain logged in after session expiry. Check both cookie expiration and JWT validation."

"Refactor the UserService class to improve testability. Extract database logic to repository pattern. Keep existing API unchanged."
```

**Benefits:**
- Higher first-attempt success rate
- Fewer course corrections
- More precise results
- Less context pollution

### Multi-Claude Workflows

**Use Cases:**
- One Claude writes code, another reviews
- Parallel work on independent features
- Different contexts for different tasks

**Setup with Git Worktrees:**
```bash
# Create worktrees
git worktree add ../project-auth feature/auth
git worktree add ../project-api feature/api

# Terminal 1
cd ../project-auth
claude

# Terminal 2
cd ../project-api
claude

# Terminal 3
cd project
claude  # Main review/integration session
```

**iTerm2 Notifications:**
```bash
# Get notified when Claude needs input
# Settings → Profiles → Terminal → Notifications
```

### Headless Automation

**CI/CD Integration:**
```bash
# Pre-commit hook
claude -p "run linting and fix issues" --output-format json

# CI pipeline
claude -p "analyze test failures and suggest fixes" --output-format stream-json

# Build scripts
claude -p "optimize bundle size" --output-format json
```

**Fanning Out (Parallel Processing):**
```bash
# Process multiple files
for file in src/**/*.ts; do
  claude -p "add JSDoc comments to $file" &
done
wait
```

**Pipelining (Sequential Processing):**
```bash
# Data processing pipeline
cat raw-data.csv | \
  claude -p "clean and validate data" | \
  claude -p "transform to JSON" | \
  claude -p "generate summary statistics" > output.json
```

### Performance Tips

**1. Be Specific Upfront**
- Detailed requirements first
- Reduces iterations
- Saves tokens and time

**2. Provide Visual References**
- Screenshots for UI issues
- Design mocks for implementation
- Error dialogs with context

**3. Use Extended Thinking**
- Complex problems: "think hard"
- Architecture decisions: "think harder"
- Critical systems: "ultrathink"

**4. Verify Early**
- Use independent subagents for review
- Start fresh session for verification
- Don't trust long conversations for validation

**5. Iterate Against Clear Targets**
- Tests (pass/fail criteria)
- Visual mocks (pixel-perfect reference)
- Expected outputs (exact specifications)

### Safe YOLO Mode

**Containerized Development:**
```bash
# In Docker container without internet
docker run -it --rm \
  -v $(pwd):/workspace \
  -e ANTHROPIC_API_KEY \
  my-dev-container \
  claude --dangerously-skip-permissions

# Safe because:
# - No internet access
# - Isolated filesystem
# - No access to host system
```

**Dev Containers:**
```json
// .devcontainer/devcontainer.json
{
  "name": "Claude Dev",
  "image": "mcr.microsoft.com/devcontainers/typescript-node:18",
  "settings": {
    "claude.skipPermissions": true
  },
  "extensions": [
    "anthropic.claude-code"
  ]
}
```

---

## Quick Reference

### Essential Commands

```bash
# Installation
npm install -g @anthropic-ai/claude-code
claude config

# Session Management
/clear          # Reset context completely
/compact        # Compress context intelligently
/doctor         # Run diagnostics
/bug            # Report issue
/permissions    # Manage tool permissions

# Debugging
claude --verbose              # Detailed logging
claude --mcp-debug           # MCP debugging
claude --version             # Version info

# Headless
claude -p "prompt"                        # Single prompt
claude -p "prompt" --output-format json   # JSON output
```

### Common File Locations

```bash
# Configuration
~/.claude.json                    # Main config
~/.config/claude-code/auth.json   # Authentication
./.mcp.json                       # MCP servers (project)
~/.claude/.mcp.json              # MCP servers (user)

# Documentation
./CLAUDE.md                       # Project context
~/.claude/CLAUDE.md              # Global context

# Custom Commands
./.claude/commands/*.md           # Slash commands

# Logs (macOS)
~/Library/Logs/claude-code/

# Logs (Linux/WSL)
~/.local/state/claude-code/logs/
```

### Quick Diagnostics

```bash
# Check installation
which claude
claude --version
node --version
npm --version

# Check configuration
cat ~/.claude.json
echo $ANTHROPIC_API_KEY

# Check connectivity
ping claude.ai
curl -I https://api.anthropic.com

# Check MCP servers
claude mcp list

# Run full diagnostics
# Within Claude session:
/doctor
```

### Environment Variables

```bash
# API Key
export ANTHROPIC_API_KEY="your-key"

# Proxy
export HTTP_PROXY="http://proxy:8080"
export HTTPS_PROXY="https://proxy:8080"

# SSL Certificates
export SSL_CERT_FILE="/path/to/cert.pem"
export NODE_EXTRA_CA_CERTS="/path/to/cert.pem"

# Ripgrep
export USE_BUILTIN_RIPGREP=0

# Unsafe (development only)
export NODE_TLS_REJECT_UNAUTHORIZED=0
```

### Quick Fixes

```bash
# Complete reset
npm uninstall -g @anthropic-ai/claude-code
rm -rf ~/.claude.json ~/.claude/ ~/.config/claude-code/
npm cache clean --force
npm install -g @anthropic-ai/claude-code
claude config

# Fix permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) $(npm config get prefix)

# Fix WSL Node.js
npm config set os linux
npm install -g @anthropic-ai/claude-code --force --no-os-check

# Fix authentication
rm -rf ~/.config/claude-code/auth.json
claude config

# Fix MCP
claude --mcp-debug
# Restart Claude Code after config changes
```

---

## Support Resources

### Official Documentation
- Main Docs: https://code.claude.com/docs
- Troubleshooting: https://code.claude.com/docs/en/troubleshooting
- API Status: https://status.anthropic.com
- Console: https://console.anthropic.com

### Community Resources
- GitHub Issues: https://github.com/anthropics/claude-code/issues
- Reddit: r/ClaudeAI
- Best Practices: https://www.anthropic.com/engineering/claude-code-best-practices

### Reporting Issues

**Information to Collect:**
```bash
# Versions
claude --version
node --version
npm --version
uname -a

# Configuration (sanitize API keys!)
cat ~/.claude.json

# Error messages (complete output)
claude --verbose > debug.log 2>&1

# MCP issues
claude --mcp-debug
cat ~/.local/state/claude-code/logs/mcp-*.log
```

**Use `/bug` command for automated reporting**

---

## Changelog & Version Notes

**Latest Updates:**
- Context window expansion to 1M tokens (Sonnet 4.5)
- Context awareness features (token budget tracking)
- Improved MCP server integration
- Enhanced debugging tools
- Better WSL2 support

**Known Issues:**
- WSL2 JetBrains IDE detection (use firewall configuration)
- MCP configuration file detection (use root `.mcp.json`)
- Ripgrep consistency (set `USE_BUILTIN_RIPGREP=0`)
- Self-signed certificate handling (configure `NODE_EXTRA_CA_CERTS`)

---

**End of Troubleshooting Guide**

*This guide is maintained based on official documentation and community feedback. For the latest updates, always refer to https://code.claude.com/docs/en/troubleshooting*
