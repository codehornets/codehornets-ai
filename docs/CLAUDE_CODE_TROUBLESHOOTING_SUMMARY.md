# Claude Code Troubleshooting - Executive Summary

> Quick reference guide for common Claude Code issues and solutions

**Source:** https://code.claude.com/docs/en/troubleshooting
**Detailed Guide:** [CLAUDE_CODE_TROUBLESHOOTING_GUIDE.md](./CLAUDE_CODE_TROUBLESHOOTING_GUIDE.md)

---

## 5-Minute Quick Diagnosis

Run these checks to resolve 90% of issues:

```bash
# 1. Verify installation
claude --version

# 2. Check connectivity
ping claude.ai

# 3. Validate API key
echo $ANTHROPIC_API_KEY

# 4. Reset session (within Claude)
/clear

# 5. Reconfigure
claude config
```

---

## Top 10 Common Issues

### 1. Command Not Found
**Error:** `claude: command not found`

**Quick Fix:**
```bash
npm install -g @anthropic-ai/claude-code
export PATH="$PATH:$(npm config get prefix)/bin"
source ~/.bashrc
```

---

### 2. Permission Errors (EACCES)
**Error:** `npm ERR! code EACCES`

**Quick Fix:**
```bash
sudo chown -R $(whoami) ~/.npm
# Or use nvm to avoid sudo entirely
```

---

### 3. WSL Installation Failures
**Error:** OS detection error or "exec: node: not found"

**Quick Fix:**
```bash
npm config set os linux
npm install -g @anthropic-ai/claude-code --force --no-os-check
```

---

### 4. Authentication Issues
**Error:** Invalid API key or subscription not recognized

**Quick Fix:**
```bash
rm -rf ~/.config/claude-code/auth.json
claude config
# Get new key from console.anthropic.com
```

---

### 5. 503 Service Unavailable
**Error:** API temporarily down

**Quick Fix:**
- Wait 2-5 minutes (server-side issue)
- Check https://status.anthropic.com
- DO NOT reinstall or reconfigure

---

### 6. Slow Performance
**Symptoms:** Sluggish responses, context issues

**Quick Fix:**
```bash
# Within Claude session
/compact  # At 70% context usage
/clear    # Between different tasks

# Switch to faster model
claude --model claude-sonnet-4-20250514
```

---

### 7. Search Not Working
**Symptoms:** @file mentions, custom agents, slash commands failing

**Quick Fix:**
```bash
# Install ripgrep
brew install ripgrep  # macOS
sudo apt install ripgrep  # Linux

# Configure
export USE_BUILTIN_RIPGREP=0
```

---

### 8. MCP Servers Not Loading
**Error:** "No MCP servers configured"

**Quick Fix:**
```bash
# Move config to project root
mv .claude/.mcp.json ./.mcp.json

# Restart Claude Code required
# Exit (Ctrl+C) and restart: claude

# Debug
claude --mcp-debug
```

---

### 9. WSL JetBrains IDE Not Detected
**Error:** "No available IDEs detected"

**Quick Fix (PowerShell as Admin):**
```powershell
New-NetFirewallRule -DisplayName "Allow WSL2 Internal Traffic" -Direction Inbound -Protocol TCP -Action Allow
```

---

### 10. Context Window Full
**Error:** Performance degradation, incomplete responses

**Quick Fix:**
```bash
# Within Claude session
/compact  # Preserve essentials
/clear    # Complete reset

# Prevention
# Monitor context meter, clear at 70%
```

---

## Nuclear Option: Complete Reset

Use when nothing else works:

```bash
# 1. Uninstall
npm uninstall -g @anthropic-ai/claude-code

# 2. Remove all config
rm -rf ~/.claude.json
rm -rf ~/.claude/
rm -rf ~/.config/claude-code/

# 3. Clear cache
npm cache clean --force

# 4. Reinstall
npm install -g @anthropic-ai/claude-code

# 5. Reconfigure
claude config
```

---

## Platform-Specific Quick Fixes

### Windows WSL

```bash
# Fix Node.js path issues
which npm  # Should show /usr/bin/npm, not /mnt/c/...

# Install Node in Linux
sudo apt install nodejs npm

# Or use nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install --lts

# Performance: Use Linux filesystem
mv /mnt/c/Users/YourName/projects ~/projects
```

### macOS

```bash
# M1/M2 architecture
arch -arm64 npm install -g @anthropic-ai/claude-code

# Fix permissions
sudo chown -R $(whoami) /usr/local/lib/node_modules
sudo chown -R $(whoami) /usr/local/bin
```

### Linux

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nodejs npm ripgrep

# Fedora/RHEL
sudo dnf install nodejs npm ripgrep

# Arch
sudo pacman -S nodejs npm ripgrep
```

---

## Essential Commands Reference

### Session Management
```bash
/clear          # Reset context
/compact        # Compress context
/doctor         # Run diagnostics
/bug            # Report issue
/permissions    # Manage tools
```

### Debugging
```bash
claude --verbose              # Detailed logging
claude --mcp-debug           # MCP debugging
claude --version             # Version info
claude -p "prompt"           # Headless mode
```

### File Locations
```bash
~/.claude.json                # Main config
~/.config/claude-code/        # Auth & settings
./.mcp.json                   # MCP servers
./CLAUDE.md                   # Project context
./.claude/commands/           # Custom commands
```

---

## Critical Environment Variables

```bash
# Required
export ANTHROPIC_API_KEY="your-key-here"

# Proxy (if needed)
export HTTP_PROXY="http://proxy:8080"
export HTTPS_PROXY="https://proxy:8080"

# SSL Certificates (corporate)
export SSL_CERT_FILE="/path/to/cert.pem"
export NODE_EXTRA_CA_CERTS="/path/to/cert.pem"

# Ripgrep
export USE_BUILTIN_RIPGREP=0
```

---

## Performance Best Practices

### Context Management
- Monitor context meter in UI
- Use `/compact` at 70% capacity
- Use `/clear` between different tasks
- Keep CLAUDE.md minimal (essentials only)

### Optimal Workflow
```bash
# 1. Explore - Read files first
@src/auth/
"Read this code, don't change anything yet"

# 2. Plan - Think before coding
"Think hard about how to implement OAuth"

# 3. Code - Implement
"Add OAuth support following the plan"

# 4. Commit - Complete
"Create commit and update docs"

# 5. Clear - Reset for next task
/clear
```

### Task Breakdown
```bash
# Bad: One long session
"Refactor entire codebase"

# Good: Focused sessions
"Refactor auth module"
/clear
"Refactor database layer"
/clear
"Refactor API routes"
```

---

## When to Use Each Command

| Situation | Command | Why |
|-----------|---------|-----|
| Starting new feature | `/clear` | Fresh context |
| Context at 70% | `/compact` | Preserve essentials |
| Slow responses | `/clear` or `/compact` | Reduce token usage |
| Between tasks | `/clear` | Avoid context pollution |
| Installation issues | `/doctor` | Diagnose problems |
| Bug report | `/bug` | Automated reporting |
| Check tools | `/permissions` | Manage access |

---

## Troubleshooting Decision Tree

```
Issue?
│
├─ Installation/Setup
│  ├─ Command not found → Check PATH, reinstall
│  ├─ Permission denied → Fix npm ownership or use nvm
│  └─ Version conflicts → Use nvm for version management
│
├─ Authentication
│  ├─ Invalid API key → Reconfigure with claude config
│  ├─ Subscription issue → Clear cookies, re-login
│  └─ OAuth failure → Remove auth.json, restart
│
├─ Performance
│  ├─ Slow responses → /compact or /clear
│  ├─ Context full → /clear and break into smaller tasks
│  └─ Memory issues → Restart, ensure 16GB+ RAM
│
├─ Connectivity
│  ├─ 503 errors → Wait 2-5 min, check status.anthropic.com
│  ├─ Can't connect → Check firewall, proxy, internet
│  └─ Certificate errors → Configure SSL_CERT_FILE
│
├─ Platform-Specific
│  ├─ WSL issues → Fix Node path, use Linux filesystem
│  ├─ WSL+JetBrains → Configure firewall rule
│  └─ macOS M1/M2 → Use arch -arm64 npm install
│
├─ Tools/Features
│  ├─ Search broken → Install ripgrep
│  ├─ MCP not loading → Move to root .mcp.json, restart
│  └─ Custom commands → Check .claude/commands/
│
└─ Nothing Works
   └─ Complete reset → Uninstall, remove configs, reinstall
```

---

## Pro Tips

1. **Be Specific in Instructions**
   - Poor: "add tests"
   - Good: "write test for edge case where user is logged out, avoid mocks"

2. **Use Visual References**
   - Drag screenshots into prompts for UI issues
   - Claude is multimodal - use it!

3. **Leverage Multiple Sessions**
   - Use git worktrees for parallel development
   - One Claude writes, another reviews

4. **Automate with Headless Mode**
   ```bash
   claude -p "run linting" --output-format json
   ```

5. **Master Context Management**
   - CLAUDE.md for persistent context (keep minimal)
   - @file:10-50 for specific line ranges
   - /compact at 70%, /clear between tasks

6. **Install `gh` CLI**
   ```bash
   brew install gh
   gh auth login
   # Claude can now create PRs, review code, etc.
   ```

---

## Getting Help

### Diagnostic Information to Collect
```bash
# Run these before reporting issues
claude --version
node --version
npm --version
uname -a
cat ~/.claude.json  # Remove API key!
claude --verbose > debug.log 2>&1
```

### Support Channels
- **Built-in:** `/bug` command
- **Documentation:** https://code.claude.com/docs
- **API Status:** https://status.anthropic.com
- **GitHub Issues:** https://github.com/anthropics/claude-code/issues
- **Community:** r/ClaudeAI

---

## Most Important Takeaways

1. **Install ripgrep** for search functionality
2. **Use `/clear` frequently** to maintain performance
3. **Keep CLAUDE.md minimal** - only essentials
4. **WSL users:** Use Linux filesystem, not /mnt/c/
5. **Be specific** in instructions for better results
6. **Monitor context meter** - compact at 70%
7. **503 errors are server-side** - just wait
8. **Use nvm** to avoid permission issues
9. **Configure firewall** for WSL + JetBrains
10. **Complete reset** when nothing else works

---

## Quick Checklist: New Installation

```bash
# 1. Install Node.js 18+ (use nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install --lts

# 2. Install Claude Code
npm install -g @anthropic-ai/claude-code

# 3. Install ripgrep
brew install ripgrep  # macOS
sudo apt install ripgrep  # Linux

# 4. Configure
claude config
# Enter API key from console.anthropic.com

# 5. Optional: Install gh CLI for GitHub integration
brew install gh
gh auth login

# 6. Test
claude --version
/doctor
```

---

For comprehensive details on any topic, see the [full troubleshooting guide](./CLAUDE_CODE_TROUBLESHOOTING_GUIDE.md).
