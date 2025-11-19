# Claude Code Headless Mode: Complete Technical Guide

> Comprehensive documentation covering architecture, CLI usage, automation capabilities, integration patterns, and production best practices for Claude Code's headless mode.

## Table of Contents

1. [Overview](#overview)
2. [Architecture & Core Concepts](#architecture--core-concepts)
3. [CLI Reference](#cli-reference)
4. [Output Formats](#output-formats)
5. [Session Management](#session-management)
6. [Tool Permissions](#tool-permissions)
7. [MCP Server Configuration](#mcp-server-configuration)
8. [Automation Patterns](#automation-patterns)
9. [CI/CD Integration](#cicd-integration)
10. [Error Handling](#error-handling)
11. [Production Best Practices](#production-best-practices)
12. [Real-World Examples](#real-world-examples)

---

## Overview

Headless mode enables programmatic execution of Claude Code without an interactive UI, allowing integration into automation scripts, CI/CD pipelines, command-line workflows, and batch processing operations.

### Key Capabilities

- **Non-Interactive Operation**: Execute Claude Code tasks via command line without user interaction
- **Structured Output**: JSON/JSONL output formats for programmatic parsing
- **Session Persistence**: Multi-turn conversations with session management
- **Tool Restriction**: Fine-grained control over allowed operations
- **CI/CD Ready**: Integration with GitHub Actions, GitLab CI/CD, Jenkins, and other platforms
- **Batch Processing**: Process multiple tasks systematically with automated workflows

### Primary Use Cases

- Automated code reviews and security audits
- Incident response and SRE automation
- Pre-commit hooks and quality gates
- Issue triage and labeling
- Batch migrations and refactoring
- Documentation generation
- Testing and validation workflows

---

## Architecture & Core Concepts

### Headless vs Interactive Mode

| Aspect | Interactive Mode | Headless Mode |
|--------|-----------------|---------------|
| **Session Persistence** | Automatic between commands | Manual via `--resume` or `--continue` |
| **User Interaction** | Prompts for permissions | No prompts (requires tool allowlisting) |
| **Output Format** | Human-readable text | Text, JSON, or stream-JSON |
| **Primary Use** | Development and exploration | Automation and scripting |
| **Error Handling** | Interactive feedback | Exit codes and stderr |

### Execution Model

```
┌─────────────────────────────────────────────────┐
│  Input (CLI args or stdin)                      │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Claude Code Headless Engine                    │
│  • Parse flags and configuration                │
│  • Load MCP servers                             │
│  • Apply tool restrictions                      │
│  • Execute with custom system prompt            │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Output (stdout/stderr/exit code)               │
│  • text: Plain response                         │
│  • json: Structured result with metadata        │
│  • stream-json: JSONL streaming messages        │
└─────────────────────────────────────────────────┘
```

---

## CLI Reference

### Essential Flags

#### Execution Control

```bash
# Run in non-interactive mode (required for headless)
claude -p "your prompt here"
claude --print "your prompt here"

# Enable verbose logging for debugging
claude -p "prompt" --verbose

# Specify output format
claude -p "prompt" --output-format json
claude -p "prompt" --output-format stream-json
claude -p "prompt" --output-format text  # default
```

#### Session Management

```bash
# Continue most recent conversation
claude -c "follow-up prompt"
claude --continue "follow-up prompt"

# Resume specific session by ID
claude -r "session-id" "new prompt"
claude --resume "550e8400-e29b-41d4-a716-446655440000" "new prompt"

# Interactive session selection (not for headless)
claude --resume
```

#### Tool Permissions

```bash
# Allow specific tools (space or comma-separated)
claude -p "prompt" --allowedTools "Read,Edit,Bash(git *)"

# Disallow specific tools
claude -p "prompt" --disallowedTools "Bash(rm:*),Bash(sudo:*)"

# Delegate permission handling to MCP tool
claude -p "prompt" --permission-prompt-tool "mcp__approval_system"
```

#### Custom Instructions

```bash
# Append to system prompt (preserves default behavior)
claude -p "prompt" --append-system-prompt "You are an SRE expert"

# Replace system prompt entirely (advanced use only)
claude -p "prompt" --system-prompt "Custom instructions from scratch"
```

#### MCP Configuration

```bash
# Load MCP servers from custom config file
claude -p "prompt" --mcp-config /path/to/mcp.json
```

### Complete Flag Reference

| Flag | Short | Description | Example |
|------|-------|-------------|---------|
| `--print` | `-p` | Non-interactive mode | `claude -p "analyze code"` |
| `--output-format` | | Output type: text, json, stream-json | `--output-format json` |
| `--continue` | `-c` | Resume most recent session | `claude -c "add tests"` |
| `--resume` | `-r` | Resume specific session by ID | `claude -r abc123 "fix bug"` |
| `--allowedTools` | | Permit specific tools | `--allowedTools "Read,Edit"` |
| `--disallowedTools` | | Deny specific tools | `--disallowedTools "Bash(rm:*)"` |
| `--append-system-prompt` | | Add custom instructions | `--append-system-prompt "Focus on security"` |
| `--system-prompt` | | Replace system prompt entirely | `--system-prompt "Custom base prompt"` |
| `--mcp-config` | | Load MCP servers from JSON file | `--mcp-config /path/to/mcp.json` |
| `--permission-prompt-tool` | | Delegate permissions to MCP tool | `--permission-prompt-tool mcp__approval` |
| `--verbose` | | Enable detailed logging | `claude -p "prompt" --verbose` |
| `--model` | | Specify model to use | `--model sonnet` |
| `--dangerously-skip-permissions` | | Skip all permission prompts (use cautiously) | For MCP server mode |

---

## Output Formats

### Text Output (Default)

Plain text response, suitable for human reading or simple script integration.

```bash
claude -p "Write a hello world function"
```

**Output:**
```
Here's a simple hello world function:

function helloWorld() {
  console.log("Hello, World!");
}
```

**Best for:**
- Simple scripts
- Human-readable output
- Direct terminal display

---

### JSON Output

Structured output with metadata including execution cost, duration, turn count, and session ID.

```bash
claude -p "Analyze this code" --output-format json
```

**Output Structure:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "result": "The code analysis reveals...",
  "total_cost_usd": 0.023,
  "num_turns": 3,
  "duration_ms": 4523,
  "model": "claude-sonnet-4.5",
  "status": "completed"
}
```

**Parsing with jq:**
```bash
# Extract result text
result=$(claude -p "Generate code" --output-format json)
code=$(echo "$result" | jq -r '.result')

# Extract cost and session ID
cost=$(echo "$result" | jq -r '.total_cost_usd')
session=$(echo "$result" | jq -r '.session_id')

echo "Cost: $cost USD, Session: $session"
```

**Best for:**
- Programmatic parsing
- Cost tracking
- Automation pipelines
- Result validation

---

### Stream-JSON Output

Emits individual messages as newline-delimited JSON (JSONL), providing real-time updates.

```bash
claude -p "Analyze project" --output-format stream-json
```

**Output Format:**
```jsonl
{"type":"init","session_id":"abc123","timestamp":"2025-01-15T10:30:00Z"}
{"type":"user","message":{"role":"user","content":"Analyze project"},"timestamp":"2025-01-15T10:30:01Z"}
{"type":"assistant","message":{"role":"assistant","content":"Starting analysis..."},"timestamp":"2025-01-15T10:30:05Z"}
{"type":"tool_use","tool":"Read","parameters":{"file_path":"/path/to/file"},"timestamp":"2025-01-15T10:30:06Z"}
{"type":"result","status":"completed","total_cost_usd":0.045,"num_turns":2,"timestamp":"2025-01-15T10:30:15Z"}
```

**Processing Stream-JSON:**
```bash
# Filter for TodoWrite calls
cat output.jsonl | grep TodoWrite | jq -r '.message.content[]'

# Extract all assistant messages
cat output.jsonl | jq 'select(.type=="assistant") | .message.content'

# Real-time monitoring
claude -p "Large task" --output-format stream-json | while read -r line; do
  echo "$line" | jq -r '.message.content // empty'
done
```

**Best for:**
- Real-time monitoring
- Large/long-running tasks
- Streaming to other systems
- Event-driven processing

---

### Stream-JSON Input

Multi-turn conversations via stdin using JSONL format without relaunching the binary.

```bash
# Create JSONL input file
cat > conversation.jsonl <<'EOF'
{"type":"user","message":{"role":"user","content":"Start code review"}}
{"type":"user","message":{"role":"user","content":"Focus on security issues"}}
EOF

# Execute with stream-json input
cat conversation.jsonl | claude -p --input-format stream-json --output-format stream-json
```

**Best for:**
- Multi-turn automation
- Guided conversation flows
- Complex workflows with mid-stream guidance

---

## Session Management

### Session Lifecycle

```
┌──────────────┐
│  New Session │ ◄── claude -p "prompt"
└──────┬───────┘
       │
       │ Generates session_id
       ▼
┌──────────────┐
│   Active     │ ◄── Can be resumed with --resume
└──────┬───────┘
       │
       │ Conversation continues
       ▼
┌──────────────┐
│  Completed   │ ◄── Stored in ~/.claude/sessions/
└──────────────┘
```

### Continue Most Recent Session

```bash
# First execution
claude -p "Create a user authentication system"
# ... Claude generates code ...

# Continue in same session
claude -p --continue "Now add password reset functionality"

# Continue again
claude -c "Add rate limiting"
```

### Resume Specific Session

```bash
# Capture session ID from JSON output
session_id=$(claude -p "Start project" --output-format json | jq -r '.session_id')

# Resume later with specific session
claude -p --resume "$session_id" "Continue where we left off"
```

### Multi-Step Session Example

```bash
#!/bin/bash
# Legal document review with session persistence

# Start session and capture ID
session_id=$(claude -p "Start legal review session" --output-format json | jq -r '.session_id')

# Multi-step review maintaining context
claude -p --resume "$session_id" "Review contract.pdf for liability clauses" \
  --output-format json > step1.json

claude -p --resume "$session_id" "Check compliance with GDPR requirements" \
  --output-format json > step2.json

claude -p --resume "$session_id" "Identify financial obligations" \
  --output-format json > step3.json

claude -p --resume "$session_id" "Generate executive summary of all risks" \
  --output-format json > summary.json
```

### Best Practices

- **Use `--resume` with explicit session IDs** for automation (more reliable than `--continue`)
- **Store session IDs** in variables or files for multi-step workflows
- **Extract session IDs** from JSON output for programmatic control
- **Session persistence** is not automatic in headless mode - must be explicit

---

## Tool Permissions

### Permission Model

Claude Code tools can be controlled at three levels:

1. **Allowed** - Permitted without prompts
2. **Neutral** - Not explicitly allowed or denied (prompts in interactive mode, blocked in headless)
3. **Denied** - Explicitly blocked

### Tool Allowlist Syntax

```bash
# Allow entire tool
--allowedTools "Read"

# Allow tool with any arguments
--allowedTools "Bash(*)"

# Allow tool with specific pattern
--allowedTools "Bash(git *)"
--allowedTools "Write(src/**)"
--allowedTools "Read(*.js)"

# Multiple tools (space-separated)
--allowedTools "Read Edit Bash(git *)"

# Multiple tools (comma-separated)
--allowedTools "Read,Edit,Bash(git *)"
```

### Common Permission Patterns

#### Read-Only Access
```bash
claude -p "Analyze codebase" \
  --allowedTools "Read,Grep,Glob"
```

#### Safe Development
```bash
claude -p "Implement feature" \
  --allowedTools "Read,Write(src/**),Edit,Bash(git *),Bash(npm *)"
```

#### Git Operations Only
```bash
claude -p "Review and commit changes" \
  --allowedTools "Read,Bash(git add:*),Bash(git commit:*),Bash(git status)"
```

#### Security Review (No Modifications)
```bash
claude -p "Security audit" \
  --allowedTools "Read,Grep,WebSearch" \
  --disallowedTools "Write,Edit,Bash"
```

### Tool Denylist

```bash
# Block dangerous operations
claude -p "Refactor code" \
  --allowedTools "Read,Write,Edit" \
  --disallowedTools "Bash(rm:*),Bash(sudo:*),Bash(chmod:*)"
```

### Available Tools

Common tools that can be restricted:

- **File Operations**: `Read`, `Write`, `Edit`, `Glob`, `Grep`
- **Shell**: `Bash(command)`, `BashOutput`, `KillShell`
- **Notebook**: `NotebookEdit`
- **Web**: `WebFetch`, `WebSearch`
- **Tasks**: `TodoWrite`
- **Questions**: `AskUserQuestion`
- **Skills**: `Skill`
- **Commands**: `SlashCommand`
- **MCP**: `mcp__<server>__<tool>` (e.g., `mcp__github__create_issue`)

### Configuration File (.claude/settings.json)

Persistent permission configuration:

```json
{
  "permissions": {
    "allowedTools": [
      "Read",
      "Write(src/**)",
      "Edit",
      "Bash(git *)",
      "Bash(npm run *)",
      "Grep",
      "Glob"
    ],
    "deny": [
      "Read(.env*)",
      "Write(production.config.*)",
      "Bash(rm *)",
      "Bash(sudo *)",
      "Bash(chmod *)"
    ]
  }
}
```

### Permission Delegation (--permission-prompt-tool)

Delegate permission decisions to an MCP tool for advanced workflows:

```bash
claude -p "Deploy changes" \
  --permission-prompt-tool "mcp__approval_system__check_permission"
```

**Use Cases:**
- Slack/Teams approval workflows
- Time-of-day restrictions
- Risk scoring systems
- Audit logging
- Enterprise compliance

**Permission Order:**
1. Check `settings.json` / `--allowedTools` / `--disallowedTools`
2. If matched, allow/deny immediately
3. If not matched, forward to `--permission-prompt-tool`
4. MCP tool returns allow/deny decision

---

## MCP Server Configuration

### Configuration File Structure

MCP servers can be configured at three scopes:

1. **System** - `/etc/claude-code/mcp.json` (Linux), `/Library/Application Support/ClaudeCode/managed-mcp.json` (macOS)
2. **User** - `~/.claude/mcp.json`
3. **Project** - `./.claude/mcp.json`

### Example MCP Configuration

```json
{
  "mcpServers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/",
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "sentry": {
      "type": "http",
      "url": "https://mcp.sentry.dev/mcp",
      "env": {
        "SENTRY_AUTH_TOKEN": "${SENTRY_AUTH_TOKEN}"
      }
    },
    "company-internal": {
      "type": "stdio",
      "command": "/usr/local/bin/company-mcp-server",
      "args": ["--config", "/etc/company/mcp-config.json"],
      "env": {
        "COMPANY_API_URL": "https://internal.company.com",
        "API_KEY": "${COMPANY_API_KEY}"
      }
    },
    "database": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "${DATABASE_URL}"
      }
    }
  }
}
```

### Using Custom MCP Config in Headless Mode

```bash
# Load MCP servers from custom file
claude -p "Query production database" \
  --mcp-config /path/to/prod-mcp.json \
  --allowedTools "mcp__database__query"
```

### MCP Tool Permissions

MCP tools follow the same permission syntax:

```bash
# Allow specific MCP tool
--allowedTools "mcp__github__create_issue"

# Allow all tools from MCP server
--allowedTools "mcp__github__*"

# Pattern matching
--allowedTools "mcp__database__query(*)"
```

### Enterprise MCP Deployment

System administrators can deploy managed MCP configurations:

```bash
# macOS
sudo cp enterprise-mcp.json "/Library/Application Support/ClaudeCode/managed-mcp.json"

# Linux
sudo cp enterprise-mcp.json /etc/claude-code/managed-mcp.json

# Windows
copy enterprise-mcp.json "C:\ProgramData\ClaudeCode\managed-mcp.json"
```

---

## Automation Patterns

### 1. Simple One-Shot Execution

```bash
#!/bin/bash
# Analyze code quality and generate report

claude -p "Analyze current project code quality and generate a report" \
  --output-format json > quality-report.json

# Parse results
score=$(cat quality-report.json | jq -r '.result' | grep -oP 'Score: \K\d+')
echo "Quality Score: $score"
```

### 2. Issue Triage and Labeling

```bash
#!/bin/bash
# Auto-label GitHub issues

issue_number=$1
issue_body=$(gh issue view "$issue_number" --json body -q '.body')

labels=$(claude -p "Analyze this GitHub issue and suggest appropriate labels: $issue_body" \
  --output-format json \
  --allowedTools "Read" | jq -r '.result')

# Apply labels
gh issue edit "$issue_number" --add-label "$labels"
```

### 3. Batch Migration

```bash
#!/bin/bash
# Batch migrate React components to Vue

# Generate migration list
claude -p "List all .jsx files in src/components that need React to Vue migration" \
  --allowedTools "Glob,Read" \
  --output-format json | jq -r '.result' > migration-list.txt

# Process each file
while read -r file; do
  echo "Migrating $file..."

  claude -p "Migrate $file from React to Vue, preserving all functionality" \
    --allowedTools "Read,Edit,Bash(git add:*),Bash(git commit:*)" \
    --output-format json > "migration-${file//\//-}.json"

  # Check if migration succeeded
  if [ $? -eq 0 ]; then
    echo "✓ Successfully migrated $file"
  else
    echo "✗ Failed to migrate $file"
  fi

  # Rate limiting delay
  sleep 2
done < migration-list.txt
```

### 4. Code Review Automation

```bash
#!/bin/bash
# Automated PR review for security issues

pr_number=$1

# Get PR diff
gh pr diff "$pr_number" > /tmp/pr-diff.txt

# Security review
claude -p "Review this PR for security vulnerabilities, insecure patterns, and compliance issues" \
  --append-system-prompt "You are a security engineer. Focus on OWASP Top 10, injection attacks, authentication issues, and data exposure." \
  --allowedTools "Read" \
  --output-format json < /tmp/pr-diff.txt > security-review.json

# Parse findings
findings=$(cat security-review.json | jq -r '.result')

# Post review comment
if echo "$findings" | grep -q "CRITICAL\|HIGH"; then
  gh pr comment "$pr_number" --body "## Security Review Results\n\n$findings\n\n⚠️ Critical issues found. Please address before merging."
  gh pr review "$pr_number" --request-changes --body "Security issues detected."
else
  gh pr comment "$pr_number" --body "## Security Review Results\n\n$findings\n\n✓ No critical security issues found."
fi
```

### 5. Incident Response Automation

```bash
#!/bin/bash
# SRE incident diagnosis and response

incident_description="$1"

claude -p "Incident: $incident_description" \
  --append-system-prompt "You are an SRE expert. Diagnose the issue, assess impact, provide immediate action items, and suggest long-term fixes." \
  --allowedTools "Bash(kubectl *),Bash(docker *),Read,mcp__datadog__query" \
  --output-format json > incident-analysis.json

# Extract action items
action_items=$(cat incident-analysis.json | jq -r '.result' | grep -A 20 "Action Items")

# Send to incident channel
curl -X POST "$SLACK_WEBHOOK" \
  -H 'Content-Type: application/json' \
  -d "{\"text\":\"Incident Analysis:\\n$action_items\"}"
```

### 6. Multi-Turn Workflow with Session Management

```bash
#!/bin/bash
# Complex refactoring with multiple review steps

# Step 1: Initial analysis
session=$(claude -p "Analyze codebase structure and identify refactoring opportunities" \
  --allowedTools "Read,Grep,Glob" \
  --output-format json | jq -r '.session_id')

echo "Session ID: $session"

# Step 2: Create refactoring plan
claude -p --resume "$session" "Create detailed refactoring plan with file-by-file breakdown" \
  --output-format json > refactor-plan.json

# Step 3: Execute refactoring
claude -p --resume "$session" "Execute the refactoring plan, one file at a time" \
  --allowedTools "Read,Edit,Bash(git add:*),Bash(git commit:*)" \
  --output-format json > refactor-execution.json

# Step 4: Validation
claude -p --resume "$session" "Validate all changes, run tests, and generate summary" \
  --allowedTools "Bash(npm test),Read" \
  --output-format json > refactor-validation.json
```

### 7. Streaming Output for Long Tasks

```bash
#!/bin/bash
# Process large codebase with real-time feedback

claude -p "Analyze entire codebase for performance bottlenecks" \
  --allowedTools "Read,Grep,Glob" \
  --output-format stream-json | while read -r line; do

  # Extract message type
  msg_type=$(echo "$line" | jq -r '.type // empty')

  case $msg_type in
    "assistant")
      # Display assistant messages in real-time
      content=$(echo "$line" | jq -r '.message.content // empty')
      echo "[CLAUDE] $content"
      ;;
    "tool_use")
      # Log tool usage
      tool=$(echo "$line" | jq -r '.tool // empty')
      echo "[TOOL] Using: $tool"
      ;;
    "result")
      # Extract final statistics
      cost=$(echo "$line" | jq -r '.total_cost_usd')
      echo "[COMPLETE] Total cost: $cost USD"
      ;;
  esac
done
```

---

## CI/CD Integration

### GitHub Actions

#### Basic Workflow

```yaml
name: Claude Code Review
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  claude-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Claude Code
        run: npm install -g @anthropics/claude-code

      - name: Authenticate Claude Code
        env:
          CLAUDE_CODE_API_KEY: ${{ secrets.CLAUDE_CODE_API_KEY }}
        run: |
          # API key authentication for headless environments
          echo "Authentication handled via environment variable"

      - name: Run Claude Code Review
        env:
          CLAUDE_CODE_API_KEY: ${{ secrets.CLAUDE_CODE_API_KEY }}
        run: |
          claude -p "Review this PR for code quality, bugs, and best practices violations" \
            --allowedTools "Read,Grep,Glob" \
            --output-format json > review-results.json

      - name: Parse and Post Results
        run: |
          findings=$(cat review-results.json | jq -r '.result')
          gh pr comment ${{ github.event.pull_request.number }} \
            --body "## Claude Code Review\n\n$findings"
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Upload Review Artifact
        uses: actions/upload-artifact@v3
        with:
          name: claude-review
          path: review-results.json
```

#### Advanced Security Audit

```yaml
name: Security Audit with Claude
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  security-audit:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
      contents: read

    steps:
      - uses: actions/checkout@v4

      - name: Get PR diff
        id: pr-diff
        run: |
          gh pr diff ${{ github.event.pull_request.number }} > pr-diff.txt
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Security Analysis
        env:
          CLAUDE_CODE_API_KEY: ${{ secrets.CLAUDE_CODE_API_KEY }}
        run: |
          cat pr-diff.txt | claude -p \
            --append-system-prompt "You are a security engineer. Check for: SQL injection, XSS, authentication bypasses, secrets in code, insecure dependencies, CSRF vulnerabilities." \
            --allowedTools "Read,Grep" \
            --output-format json > security-audit.json

      - name: Check for Critical Issues
        id: check-critical
        run: |
          critical_count=$(cat security-audit.json | jq -r '.result' | grep -c "CRITICAL" || echo "0")
          echo "critical=$critical_count" >> $GITHUB_OUTPUT

      - name: Request Changes if Critical
        if: steps.check-critical.outputs.critical != '0'
        run: |
          findings=$(cat security-audit.json | jq -r '.result')
          gh pr review ${{ github.event.pull_request.number }} \
            --request-changes \
            --body "⚠️ **Critical Security Issues Detected**\n\n$findings"
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Comment Success
        if: steps.check-critical.outputs.critical == '0'
        run: |
          findings=$(cat security-audit.json | jq -r '.result')
          gh pr comment ${{ github.event.pull_request.number }} \
            --body "✅ **Security Audit Passed**\n\n$findings"
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

### GitLab CI/CD

```yaml
stages:
  - security
  - quality

claude_security_audit:
  stage: security
  image: node:20
  before_script:
    - npm install -g @anthropics/claude-code
  script:
    - |
      git diff origin/main...HEAD > changes.diff

      claude -p "Security review of these changes" \
        --append-system-prompt "Focus on OWASP Top 10 vulnerabilities" \
        --allowedTools "Read,Grep" \
        --output-format json > security-report.json

      # Parse results
      if grep -q "CRITICAL" security-report.json; then
        echo "Critical security issues found!"
        exit 1
      fi
  artifacts:
    reports:
      security: security-report.json
    paths:
      - security-report.json
    expire_in: 30 days
  only:
    - merge_requests
  variables:
    CLAUDE_CODE_API_KEY: $CLAUDE_CODE_API_KEY

claude_code_quality:
  stage: quality
  image: node:20
  before_script:
    - npm install -g @anthropics/claude-code
  script:
    - |
      claude -p "Analyze code quality, identify technical debt, suggest improvements" \
        --allowedTools "Read,Grep,Glob" \
        --output-format json > quality-report.json

      quality_score=$(cat quality-report.json | jq -r '.result' | grep -oP 'Score: \K\d+' || echo "0")

      if [ "$quality_score" -lt 70 ]; then
        echo "Code quality below threshold: $quality_score"
        exit 1
      fi
  artifacts:
    paths:
      - quality-report.json
  only:
    - merge_requests
  variables:
    CLAUDE_CODE_API_KEY: $CLAUDE_CODE_API_KEY
```

---

### Jenkins Pipeline

```groovy
pipeline {
    agent any

    environment {
        CLAUDE_CODE_API_KEY = credentials('claude-code-api-key')
    }

    stages {
        stage('Setup') {
            steps {
                sh 'npm install -g @anthropics/claude-code'
            }
        }

        stage('Code Review') {
            steps {
                script {
                    def reviewResult = sh(
                        script: '''
                            claude -p "Review code changes for quality and best practices" \
                              --allowedTools "Read,Grep,Glob" \
                              --output-format json
                        ''',
                        returnStdout: true
                    ).trim()

                    writeFile file: 'review-results.json', text: reviewResult

                    def review = readJSON file: 'review-results.json'
                    echo "Review completed. Cost: $${review.total_cost_usd}"
                }
            }
        }

        stage('Security Audit') {
            steps {
                script {
                    def auditResult = sh(
                        script: '''
                            claude -p "Security audit of codebase" \
                              --append-system-prompt "Focus on security vulnerabilities" \
                              --allowedTools "Read,Grep" \
                              --output-format json
                        ''',
                        returnStdout: true
                    ).trim()

                    writeFile file: 'security-audit.json', text: auditResult

                    // Check for critical issues
                    def audit = readJSON file: 'security-audit.json'
                    if (audit.result.contains('CRITICAL')) {
                        error 'Critical security issues found!'
                    }
                }
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: '*.json', fingerprint: true
        }
        failure {
            emailext(
                subject: "Claude Code Analysis Failed: ${env.JOB_NAME}",
                body: "Build failed. Check attached reports.",
                attachmentsPattern: '*.json'
            )
        }
    }
}
```

---

### Pre-Commit Hooks

#### Git Pre-Commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Get list of changed files
changed_files=$(git diff --cached --name-only --diff-filter=ACM)

if [ -z "$changed_files" ]; then
  echo "No files to review"
  exit 0
fi

echo "Running Claude Code pre-commit review..."

# Review changed files
claude -p "Review these changed files for typos, outdated comments, and misleading function names: $changed_files" \
  --allowedTools "Read,Write" \
  --output-format json > /tmp/pre-commit-review.json

# Check for blocking issues
if grep -q "BLOCK" /tmp/pre-commit-review.json; then
  echo "❌ Pre-commit review found blocking issues:"
  cat /tmp/pre-commit-review.json | jq -r '.result'
  exit 1
fi

echo "✅ Pre-commit review passed"
exit 0
```

#### Pre-Commit with Test Validation

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Check if tests pass
echo "Running tests..."
npm test

if [ $? -ne 0 ]; then
  echo "❌ Tests failed. Running Claude Code to diagnose..."

  claude -p "Tests are failing. Analyze test output and suggest fixes" \
    --allowedTools "Read,Bash(npm test)" \
    --output-format json > /tmp/test-diagnosis.json

  diagnosis=$(cat /tmp/test-diagnosis.json | jq -r '.result')
  echo "$diagnosis"

  exit 1
fi

echo "✅ All tests passed"
exit 0
```

#### Pre-Commit Configuration (.pre-commit-config.yaml)

```yaml
repos:
  - repo: local
    hooks:
      - id: claude-code-review
        name: Claude Code Review
        entry: bash -c 'claude -p "Review staged changes" --allowedTools "Read" --output-format json'
        language: system
        pass_filenames: false
        stages: [commit]

      - id: claude-security-check
        name: Claude Security Check
        entry: bash -c 'claude -p "Security review of changes" --append-system-prompt "Focus on security" --allowedTools "Read,Grep" --output-format json | jq -r ".result" | grep -q "CRITICAL" && exit 1 || exit 0'
        language: system
        pass_filenames: false
        stages: [commit]
```

---

## Error Handling

### Exit Codes

Claude Code uses standard Unix exit codes for automation:

| Exit Code | Meaning | Action |
|-----------|---------|--------|
| `0` | Success | Continue normally |
| `1` | General error | Log error, may continue |
| `2` | Blocking error (hooks) | Halt execution, provide feedback |
| Other | Non-blocking error | Show stderr to user, continue |

### Error Detection in Scripts

```bash
#!/bin/bash

# Execute Claude Code
claude -p "Analyze code" --output-format json > result.json
exit_code=$?

if [ $exit_code -eq 0 ]; then
  echo "✓ Success"
  cat result.json | jq -r '.result'
elif [ $exit_code -eq 1 ]; then
  echo "✗ General error occurred"
  cat result.json 2>&1
  exit 1
elif [ $exit_code -eq 2 ]; then
  echo "✗ Blocking error - action prevented"
  exit 2
else
  echo "✗ Unknown error (exit code: $exit_code)"
  exit $exit_code
fi
```

### Stderr Handling

```bash
#!/bin/bash

# Capture both stdout and stderr
claude -p "Process files" --output-format json > stdout.txt 2> stderr.txt
exit_code=$?

if [ $exit_code -ne 0 ]; then
  echo "Error occurred (exit code: $exit_code)"
  echo "Standard Error:"
  cat stderr.txt

  # Log to monitoring system
  curl -X POST "$MONITORING_ENDPOINT" \
    -H 'Content-Type: application/json' \
    -d "{\"error\":\"$(cat stderr.txt)\",\"exit_code\":$exit_code}"
fi
```

### Timeout Management

```bash
#!/bin/bash

# Execute with 5-minute timeout
timeout 300 claude -p "Long-running task" --output-format json > result.json
exit_code=$?

if [ $exit_code -eq 124 ]; then
  echo "✗ Command timed out after 5 minutes"
  exit 1
elif [ $exit_code -eq 0 ]; then
  echo "✓ Completed successfully"
else
  echo "✗ Failed with exit code: $exit_code"
  exit $exit_code
fi
```

### Retry Logic with Exponential Backoff

```bash
#!/bin/bash

max_retries=3
retry_count=0
base_delay=2

while [ $retry_count -lt $max_retries ]; do
  echo "Attempt $((retry_count + 1)) of $max_retries..."

  claude -p "Execute task" --output-format json > result.json 2> error.txt
  exit_code=$?

  if [ $exit_code -eq 0 ]; then
    echo "✓ Success"
    exit 0
  fi

  retry_count=$((retry_count + 1))

  if [ $retry_count -lt $max_retries ]; then
    delay=$((base_delay ** retry_count))
    echo "Failed. Retrying in ${delay}s..."
    cat error.txt
    sleep $delay
  fi
done

echo "✗ Failed after $max_retries attempts"
cat error.txt
exit 1
```

### Rate Limit Handling

```bash
#!/bin/bash

process_with_rate_limit() {
  local file=$1
  local delay=2  # seconds between requests

  echo "Processing $file..."

  claude -p "Analyze $file" --output-format json > "result-${file//\//-}.json" 2> error.txt
  exit_code=$?

  if [ $exit_code -ne 0 ]; then
    # Check for rate limit error
    if grep -q "rate.*limit\|429" error.txt; then
      echo "⚠️ Rate limit hit. Waiting 60s..."
      sleep 60
      # Retry once
      claude -p "Analyze $file" --output-format json > "result-${file//\//-}.json"
      exit_code=$?
    fi
  fi

  # Delay before next request
  sleep $delay

  return $exit_code
}

# Process files
for file in src/**/*.js; do
  process_with_rate_limit "$file"
done
```

---

## Production Best Practices

### 1. Cost Management

```bash
#!/bin/bash
# Track costs across automation runs

total_cost=0

for task in task1 task2 task3; do
  result=$(claude -p "$task" --output-format json)
  cost=$(echo "$result" | jq -r '.total_cost_usd')
  total_cost=$(echo "$total_cost + $cost" | bc)

  echo "Task: $task, Cost: $cost USD"
done

echo "Total cost: $total_cost USD"

# Alert if over budget
budget=5.00
if (( $(echo "$total_cost > $budget" | bc -l) )); then
  echo "⚠️ Over budget! Total: $total_cost, Budget: $budget"
  # Send alert
fi
```

### 2. Rate Limiting

```bash
#!/bin/bash
# Implement delays between requests

request_count=0
reset_time=$((SECONDS + 300))  # 5-minute window

make_request() {
  # Check if we need to reset counter
  if [ $SECONDS -ge $reset_time ]; then
    request_count=0
    reset_time=$((SECONDS + 300))
  fi

  # Rate limit: max 50 requests per 5 minutes
  if [ $request_count -ge 50 ]; then
    sleep_time=$((reset_time - SECONDS))
    echo "Rate limit reached. Sleeping ${sleep_time}s..."
    sleep $sleep_time
    request_count=0
    reset_time=$((SECONDS + 300))
  fi

  claude -p "$1" --output-format json
  request_count=$((request_count + 1))
}

# Use the rate-limited function
make_request "Task 1"
make_request "Task 2"
```

### 3. Monitoring and Logging

```bash
#!/bin/bash
# Comprehensive logging and monitoring

log_dir="/var/log/claude-automation"
mkdir -p "$log_dir"

run_claude_task() {
  local task_name=$1
  local prompt=$2
  local timestamp=$(date +%Y%m%d_%H%M%S)
  local log_file="$log_dir/${task_name}_${timestamp}.log"

  echo "[$(date)] Starting task: $task_name" | tee -a "$log_file"

  # Execute with timing
  start_time=$(date +%s)

  claude -p "$prompt" --output-format json > "${log_dir}/${task_name}_${timestamp}.json" 2>> "$log_file"
  exit_code=$?

  end_time=$(date +%s)
  duration=$((end_time - start_time))

  # Extract metrics
  cost=$(cat "${log_dir}/${task_name}_${timestamp}.json" | jq -r '.total_cost_usd // "0"')

  # Log metrics
  echo "[$(date)] Task: $task_name, Duration: ${duration}s, Cost: $cost USD, Exit: $exit_code" | tee -a "$log_file"

  # Send to monitoring system
  curl -X POST "$METRICS_ENDPOINT" \
    -H 'Content-Type: application/json' \
    -d "{
      \"task\": \"$task_name\",
      \"duration\": $duration,
      \"cost\": $cost,
      \"exit_code\": $exit_code,
      \"timestamp\": \"$(date -Iseconds)\"
    }" 2>> "$log_file"

  return $exit_code
}

# Usage
run_claude_task "security_audit" "Perform security audit of codebase"
run_claude_task "quality_check" "Analyze code quality"
```

### 4. Caching and Deduplication

```bash
#!/bin/bash
# Cache results to avoid redundant API calls

cache_dir=".claude-cache"
mkdir -p "$cache_dir"

cached_claude() {
  local prompt=$1
  local cache_key=$(echo -n "$prompt" | md5sum | cut -d' ' -f1)
  local cache_file="$cache_dir/$cache_key.json"

  # Check cache (valid for 1 hour)
  if [ -f "$cache_file" ]; then
    cache_age=$(($(date +%s) - $(stat -c %Y "$cache_file")))
    if [ $cache_age -lt 3600 ]; then
      echo "✓ Using cached result (age: ${cache_age}s)"
      cat "$cache_file"
      return 0
    fi
  fi

  # Execute and cache
  claude -p "$prompt" --output-format json > "$cache_file"
  cat "$cache_file"
}

# Usage
cached_claude "Analyze project structure"
```

### 5. Session Management for Long Workflows

```bash
#!/bin/bash
# Manage long-running sessions with checkpointing

session_file=".claude-session"

# Load or create session
if [ -f "$session_file" ]; then
  session_id=$(cat "$session_file")
  echo "Resuming session: $session_id"
else
  # Start new session
  result=$(claude -p "Initialize analysis session" --output-format json)
  session_id=$(echo "$result" | jq -r '.session_id')
  echo "$session_id" > "$session_file"
  echo "Started new session: $session_id"
fi

# Execute tasks in session
for task in step1 step2 step3; do
  echo "Executing: $task"

  claude -p --resume "$session_id" "Execute $task" \
    --output-format json > "${task}.json"

  # Checkpoint after each step
  if [ $? -eq 0 ]; then
    echo "✓ Completed: $task"
  else
    echo "✗ Failed: $task"
    exit 1
  fi
done

# Clean up session file when done
rm "$session_file"
```

### 6. Graceful Degradation

```bash
#!/bin/bash
# Implement fallback strategies

primary_model="claude-sonnet-4.5"
fallback_model="claude-haiku"

execute_with_fallback() {
  local prompt=$1

  # Try primary model
  result=$(claude -p "$prompt" --model "$primary_model" --output-format json 2>&1)
  exit_code=$?

  if [ $exit_code -eq 0 ]; then
    echo "$result"
    return 0
  fi

  # Check if error is rate limit or capacity
  if echo "$result" | grep -q "rate.*limit\|capacity\|overloaded"; then
    echo "⚠️ Primary model unavailable. Using fallback..." >&2

    # Try fallback model
    claude -p "$prompt" --model "$fallback_model" --output-format json
    return $?
  fi

  # Other error - propagate
  echo "$result" >&2
  return $exit_code
}

# Usage
execute_with_fallback "Analyze code"
```

### 7. Security and Secrets Management

```bash
#!/bin/bash
# Secure handling of API keys and sensitive data

# Never hardcode API keys
if [ -z "$CLAUDE_CODE_API_KEY" ]; then
  echo "Error: CLAUDE_CODE_API_KEY not set"
  exit 1
fi

# Restrict file permissions
result_file="sensitive-analysis.json"
touch "$result_file"
chmod 600 "$result_file"  # Owner read/write only

# Execute with restricted tools
claude -p "Analyze configuration" \
  --allowedTools "Read,Grep" \
  --disallowedTools "Write(.env*),Read(.secrets/*)" \
  --output-format json > "$result_file"

# Scrub sensitive data from logs
sed -i 's/api[_-]key[[:space:]]*[:=][[:space:]]*[^[:space:]]*/api_key=REDACTED/gi' "$result_file"
sed -i 's/password[[:space:]]*[:=][[:space:]]*[^[:space:]]*/password=REDACTED/gi' "$result_file"
```

### 8. Alerting and Notifications

```bash
#!/bin/bash
# Send alerts on failures or critical findings

run_with_alerts() {
  local task_name=$1
  local prompt=$2
  local slack_webhook="$SLACK_WEBHOOK"

  result=$(claude -p "$prompt" --output-format json 2>&1)
  exit_code=$?

  if [ $exit_code -ne 0 ]; then
    # Failure alert
    curl -X POST "$slack_webhook" \
      -H 'Content-Type: application/json' \
      -d "{
        \"text\": \"❌ Claude automation failed: $task_name\",
        \"attachments\": [{
          \"color\": \"danger\",
          \"text\": \"$(echo "$result" | jq -r '.error // . | @text')\"
        }]
      }"
    return $exit_code
  fi

  # Check for critical findings
  if echo "$result" | jq -r '.result' | grep -q "CRITICAL"; then
    curl -X POST "$slack_webhook" \
      -H 'Content-Type: application/json' \
      -d "{
        \"text\": \"⚠️ Critical issues found in: $task_name\",
        \"attachments\": [{
          \"color\": \"warning\",
          \"text\": \"$(echo "$result" | jq -r '.result' | head -c 500)\"
        }]
      }"
  fi

  echo "$result"
  return 0
}

# Usage
run_with_alerts "security_scan" "Scan for security vulnerabilities"
```

---

## Real-World Examples

### Example 1: Automated Documentation Generation

```bash
#!/bin/bash
# Generate API documentation from code

output_dir="docs/api"
mkdir -p "$output_dir"

# Find all API route files
api_files=$(find src/api -name "*.js" -type f)

for file in $api_files; do
  echo "Documenting: $file"

  # Extract filename for output
  doc_name=$(basename "$file" .js).md

  # Generate documentation
  claude -p "Generate comprehensive API documentation for this file, including endpoints, parameters, responses, and examples" \
    --allowedTools "Read" \
    --output-format json > /tmp/doc-gen.json

  # Extract markdown content
  cat /tmp/doc-gen.json | jq -r '.result' > "$output_dir/$doc_name"

  echo "✓ Generated: $output_dir/$doc_name"

  sleep 2  # Rate limiting
done

# Generate index
claude -p "Create an index.md file that links to all API documentation files in $output_dir" \
  --allowedTools "Read,Write($output_dir/*)" \
  --output-format json

echo "✓ Documentation generation complete"
```

### Example 2: Smart Git Commit Messages

```bash
#!/bin/bash
# Generate conventional commit messages

# Check for staged changes
if ! git diff --cached --quiet; then
  # Get diff
  diff=$(git diff --cached)

  # Generate commit message
  commit_msg=$(claude -p "Generate a conventional commit message for these changes. Format: <type>(<scope>): <subject>" \
    --allowedTools "Read" \
    --output-format json <<< "$diff" | jq -r '.result' | head -n 1)

  echo "Suggested commit message:"
  echo "$commit_msg"
  echo ""
  echo -n "Use this message? (y/n): "
  read -r response

  if [ "$response" = "y" ]; then
    git commit -m "$commit_msg"
    echo "✓ Committed with AI-generated message"
  else
    echo "Commit cancelled"
  fi
else
  echo "No staged changes"
fi
```

### Example 3: Automated Test Generation

```bash
#!/bin/bash
# Generate unit tests for untested functions

# Find files with low test coverage
untested_files=$(npm run test:coverage --silent | grep -E "^\s*src/" | awk '$4 < 80 {print $1}')

for file in $untested_files; do
  echo "Generating tests for: $file"

  # Read source file
  test_file="${file/src/tests}"
  test_file="${test_file/.js/.test.js}"

  mkdir -p "$(dirname "$test_file")"

  # Generate tests
  claude -p "Generate comprehensive unit tests for this file using Jest. Include edge cases and error handling." \
    --allowedTools "Read,Write(tests/**)" \
    --output-format json > /tmp/test-gen.json

  # Extract test code
  cat /tmp/test-gen.json | jq -r '.result' > "$test_file"

  # Verify tests run
  npm test "$test_file"

  if [ $? -eq 0 ]; then
    echo "✓ Generated passing tests: $test_file"
    git add "$test_file"
  else
    echo "✗ Generated tests have issues: $test_file"
  fi

  sleep 3  # Rate limiting
done
```

### Example 4: Codebase Migration Assistant

```bash
#!/bin/bash
# Assist with large-scale codebase migrations

migration_plan="migration-plan.json"

# Phase 1: Analysis
echo "Phase 1: Analyzing codebase..."
session=$(claude -p "Analyze this codebase for Python 2 to Python 3 migration. Identify all files that need changes." \
  --allowedTools "Read,Grep,Glob" \
  --output-format json | jq -r '.session_id')

echo "Session: $session"

# Phase 2: Generate migration plan
echo "Phase 2: Generating migration plan..."
claude -p --resume "$session" "Create detailed migration plan with priority order and dependency information" \
  --output-format json | jq -r '.result' > "$migration_plan"

# Phase 3: Execute migration in batches
echo "Phase 3: Executing migration..."
batch_size=5
batch_num=1

cat "$migration_plan" | jq -r '.files[]' | while read -r file; do
  echo "Migrating: $file (batch $batch_num)"

  claude -p --resume "$session" "Migrate $file from Python 2 to Python 3. Update syntax, imports, and dependencies." \
    --allowedTools "Read,Edit,Bash(git add:*),Bash(git commit:*)" \
    --output-format json > "migration-result-$batch_num.json"

  # Run tests after each file
  python3 -m pytest "tests/test_${file##*/}" || {
    echo "⚠️ Tests failed for $file - review needed"
  }

  batch_num=$((batch_num + 1))

  # Pause between batches
  if [ $((batch_num % batch_size)) -eq 0 ]; then
    echo "Completed batch. Pausing..."
    sleep 10
  fi
done

echo "✓ Migration complete"
```

### Example 5: Intelligent Log Analysis

```bash
#!/bin/bash
# Analyze application logs for issues

log_file="/var/log/application.log"
analysis_output="log-analysis-$(date +%Y%m%d-%H%M%S).json"

# Extract recent errors (last hour)
recent_errors=$(grep -A 5 "ERROR\|CRITICAL" "$log_file" | tail -n 500)

# Analyze with Claude
claude -p "Analyze these application errors. Group by root cause, identify patterns, suggest fixes, and prioritize by severity." \
  --append-system-prompt "You are an SRE analyzing production logs. Focus on actionable insights." \
  --allowedTools "Read" \
  --output-format json <<< "$recent_errors" > "$analysis_output"

# Extract insights
echo "=== Log Analysis Summary ==="
cat "$analysis_output" | jq -r '.result' | head -n 50

# Check for critical issues
critical_count=$(cat "$analysis_output" | jq -r '.result' | grep -c "CRITICAL" || echo "0")

if [ "$critical_count" -gt 0 ]; then
  echo ""
  echo "⚠️ $critical_count critical issues detected!"

  # Send alert
  curl -X POST "$PAGERDUTY_WEBHOOK" \
    -H 'Content-Type: application/json' \
    -d "{
      \"routing_key\": \"$PAGERDUTY_KEY\",
      \"event_action\": \"trigger\",
      \"payload\": {
        \"summary\": \"Critical issues in application logs\",
        \"severity\": \"critical\",
        \"source\": \"claude-log-analyzer\"
      }
    }"
fi
```

### Example 6: Dependency Audit and Update

```bash
#!/bin/bash
# Audit dependencies and suggest safe updates

# Get dependency list
dependencies=$(npm list --depth=0 --json)

# Analyze dependencies
audit_result=$(claude -p "Analyze these npm dependencies. Identify: 1) Security vulnerabilities, 2) Outdated packages, 3) Unused dependencies, 4) License issues. Provide actionable recommendations." \
  --allowedTools "Read,Bash(npm outdated),Bash(npm audit)" \
  --output-format json <<< "$dependencies")

echo "$audit_result" > dependency-audit.json

# Parse recommendations
outdated=$(echo "$audit_result" | jq -r '.result' | grep -A 10 "Outdated Packages")
security=$(echo "$audit_result" | jq -r '.result' | grep -A 10 "Security")

echo "=== Dependency Audit Results ==="
echo "$outdated"
echo ""
echo "$security"

# Generate update plan
claude -p "Based on the audit results, create a safe update plan that minimizes breaking changes. Group updates by risk level." \
  --output-format json < dependency-audit.json | jq -r '.result' > update-plan.md

echo ""
echo "✓ Update plan saved to: update-plan.md"
```

### Example 7: Database Schema Migration

```bash
#!/bin/bash
# Generate database migration scripts

schema_changes="$1"  # Description of required changes

if [ -z "$schema_changes" ]; then
  echo "Usage: $0 'description of schema changes'"
  exit 1
fi

timestamp=$(date +%Y%m%d%H%M%S)
migration_file="migrations/${timestamp}_migration.sql"

# Read current schema
current_schema=$(psql -U postgres -d mydb -c "\d+" -t)

# Generate migration
claude -p "Generate SQL migration script for these changes: $schema_changes. Current schema: $current_schema. Include both up and down migrations." \
  --append-system-prompt "You are a database expert. Generate PostgreSQL-compatible SQL. Include transaction blocks and rollback safety." \
  --allowedTools "Read" \
  --output-format json > /tmp/migration-gen.json

# Extract SQL
cat /tmp/migration-gen.json | jq -r '.result' > "$migration_file"

echo "Generated migration: $migration_file"
echo ""
echo "=== Migration Preview ==="
head -n 30 "$migration_file"

echo ""
echo -n "Apply this migration? (y/n): "
read -r response

if [ "$response" = "y" ]; then
  # Apply migration
  psql -U postgres -d mydb -f "$migration_file"

  if [ $? -eq 0 ]; then
    echo "✓ Migration applied successfully"
    git add "$migration_file"
    git commit -m "Add migration: $schema_changes"
  else
    echo "✗ Migration failed"
    exit 1
  fi
else
  echo "Migration saved but not applied"
fi
```

---

## Conclusion

Claude Code's headless mode provides powerful automation capabilities for modern development workflows. By understanding the architecture, CLI flags, output formats, and best practices outlined in this guide, you can build robust, production-ready automation systems.

### Key Takeaways

1. **Use JSON output** for programmatic processing and cost tracking
2. **Implement session management** for multi-turn workflows
3. **Apply strict tool permissions** to maintain security
4. **Monitor costs and rate limits** in production environments
5. **Handle errors gracefully** with proper exit code checking
6. **Leverage streaming output** for long-running tasks
7. **Integrate with CI/CD** for automated code quality gates
8. **Cache results** to minimize redundant API calls

### Resources

- **Official Documentation**: https://code.claude.com/docs/en/headless
- **CLI Reference**: https://code.claude.com/docs/en/cli-reference
- **GitHub Actions Guide**: https://code.claude.com/docs/en/github-actions
- **MCP Documentation**: https://docs.claude.com/en/docs/claude-code/mcp
- **API Documentation**: https://docs.anthropic.com/

### Getting Help

- GitHub Issues: https://github.com/anthropics/claude-code/issues
- Community Discord: https://discord.gg/anthropic
- Support: support@anthropic.com

---

**Document Version**: 1.0
**Last Updated**: January 2025
**Author**: Compiled from official documentation and community resources
