# Claude Code Subagents: Complete Technical Guide

**Last Updated**: 2025-11-18
**Source**: https://code.claude.com/docs/en/sub-agents + Community Research

---

## Table of Contents

1. [Overview](#overview)
2. [Core Characteristics](#core-characteristics)
3. [Architecture & How Subagents Work](#architecture--how-subagents-work)
4. [Creating Subagents](#creating-subagents)
5. [Configuration Reference](#configuration-reference)
6. [Usage Patterns](#usage-patterns)
7. [Communication Patterns](#communication-patterns)
8. [Subagent Chaining](#subagent-chaining)
9. [Resumable Subagents](#resumable-subagents)
10. [Tool Management & MCP Integration](#tool-management--mcp-integration)
11. [Model Selection & Inheritance](#model-selection--inheritance)
12. [Permission Modes](#permission-modes)
13. [Skills Integration](#skills-integration)
14. [Built-In Subagents](#built-in-subagents)
15. [Example Implementations](#example-implementations)
16. [Advanced Workflows](#advanced-workflows)
17. [Best Practices](#best-practices)
18. [Performance Considerations](#performance-considerations)
19. [Known Issues & Limitations](#known-issues--limitations)
20. [Resources & Community Examples](#resources--community-examples)

---

## Overview

Subagents are specialized AI assistants within Claude Code designed to handle specific task types. Each operates independently with dedicated context windows, custom system prompts, and configured tool access, enabling efficient problem-solving through task delegation.

### Key Definition
Subagents function as **"pre-configured AI personalities that Claude Code can delegate tasks to."**

### When to Use Subagents

- Complex workflows requiring specialized expertise
- Tasks needing isolated context to prevent main conversation pollution
- Repetitive workflows across projects and teams
- Multi-stage pipelines (analysis → implementation → review)
- Parallel development with different concerns (backend, frontend, testing)

---

## Core Characteristics

| Characteristic | Description |
|----------------|-------------|
| **Dedicated Context Windows** | Each subagent has isolated context, preventing main conversation pollution |
| **Task-Specific Expertise** | Fine-tuned system prompts for specialized domains |
| **Custom Tool Permissions** | Granular control over which tools each subagent can access |
| **Individual System Prompts** | Unique behavioral guidelines for each specialist |
| **Reusability** | Once created, usable across projects and shareable with teams |
| **Independent Execution** | Subagents cannot directly communicate with each other |

### Benefits Summary

| Benefit | Impact |
|---------|--------|
| **Context Preservation** | Main conversation stays focused; complex workflows don't exhaust context |
| **Specialized Expertise** | Higher success rates for domain-specific tasks |
| **Reusability** | DRY principle for AI workflows; share across teams |
| **Flexible Permissions** | Security through minimal tool access principle |
| **Parallel Processing** | Multiple subagents can work on different aspects simultaneously |

---

## Architecture & How Subagents Work

### Execution Model

```
┌─────────────────────────────────────────────────────┐
│           Main Claude Code Session                  │
│  (Primary context window, user interaction)         │
└─────────────────┬───────────────────────────────────┘
                  │
                  │ Delegates Task
                  ▼
    ┌─────────────────────────────────────────────┐
    │         Subagent Instance                    │
    │  - Fresh context window                      │
    │  - Custom system prompt                      │
    │  - Restricted tool access                    │
    │  - Specific model configuration              │
    │  - Auto-loaded skills (if configured)        │
    └─────────────────────────────────────────────┘
                  │
                  │ Returns Results
                  ▼
    ┌─────────────────────────────────────────────┐
    │    Main Session Resumes                      │
    │  (With subagent's summary/findings)          │
    └─────────────────────────────────────────────┘
```

### Key Architectural Principles

1. **Context Isolation**: Subagents receive context FROM the main thread but cannot exchange information WITH each other
2. **Fresh Start**: Each subagent invocation gathers required context anew (unless using resumable feature)
3. **Summary-Based Communication**: Subagents return summaries, not full context
4. **Independence**: No shared state between subagents (file-based handoffs required for chaining)

---

## Creating Subagents

### Method 1: Interactive Interface (Recommended)

```bash
# Open the agents management interface
/agents
```

Steps:
1. Select "Create new agent"
2. Choose scope: project-level or user-level
3. Define configuration (name, description, tools, model, permissions)
4. Save → Subagent becomes immediately available

### Method 2: Direct File Creation

Create a markdown file with YAML frontmatter in the appropriate directory.

**File Locations:**

| Type | Location | Scope | Priority |
|------|----------|-------|----------|
| Project | `.claude/agents/` | Current project only | Highest |
| User | `~/.claude/agents/` | All projects | Medium |
| CLI | `--agents` flag | Current session | Between project & user |
| Plugin | Plugin `agents/` directory | Plugin-specific | Variable |

**Priority Order**: Project > CLI > User > Plugin

### Method 3: CLI Configuration

Define subagents dynamically using the `--agents` flag with JSON:

```bash
claude --agents '{
  "code-reviewer": {
    "description": "Expert code reviewer for quality and security",
    "prompt": "You are a senior code reviewer focusing on:\n- Code quality and maintainability\n- Security vulnerabilities\n- Performance implications\n- Test coverage",
    "tools": ["Read", "Grep", "Glob", "Bash"],
    "model": "sonnet"
  },
  "test-runner": {
    "description": "Specialized in running and debugging tests",
    "prompt": "You are a test specialist. Run tests, analyze failures, and suggest fixes.",
    "tools": ["Bash", "Read", "Grep"],
    "model": "haiku"
  }
}'
```

### Method 4: AI-Generated (Best Practice)

**Anthropic's Recommendation**: "We highly recommend generating your initial subagent with Claude and then iterating on it."

**Example Prompt**:
```
Create a subagent for analyzing database performance issues in PostgreSQL.
It should:
- Read slow query logs
- Analyze EXPLAIN output
- Suggest index optimizations
- Check for N+1 queries
- Use only Read, Grep, and Bash tools
- Use Sonnet model for complex analysis
```

Claude will generate the complete YAML frontmatter and system prompt.

---

## Configuration Reference

### File Format: Markdown with YAML Frontmatter

```markdown
---
name: subagent-identifier
description: Natural language purpose and usage triggers
tools: Tool1, Tool2, Tool3
model: sonnet
permissionMode: default
skills: skill1, skill2
---

# System Prompt

You are a [role] specialized in [domain].

## Your Responsibilities
- [Responsibility 1]
- [Responsibility 2]

## Approach
[Detailed instructions on how to approach tasks]

## Constraints
- [Constraint 1]
- [Constraint 2]

## Output Format
[How to format results]
```

### Configuration Fields Reference

| Field | Required | Type | Description | Valid Values |
|-------|----------|------|-------------|--------------|
| `name` | Yes | string | Lowercase identifier with hyphens | `code-reviewer`, `test-runner` |
| `description` | Yes | string | Natural language purpose (used for auto-delegation) | Any descriptive text |
| `tools` | No | CSV | Comma-separated tool list | Tool names, or omit to inherit all |
| `model` | No | string | Model to use | `sonnet`, `opus`, `haiku`, `inherit`, or omit for default |
| `permissionMode` | No | string | Permission handling mode | `default`, `acceptEdits`, `bypassPermissions`, `plan`, `ignore` |
| `skills` | No | CSV | Auto-load specific skills | Skill names to activate |

### Field Details

#### `name` (Required)
- Lowercase with hyphens
- Used for explicit invocation: "Use the code-reviewer subagent"
- Should be descriptive and unique

```yaml
name: database-performance-analyzer
```

#### `description` (Required)
- Natural language purpose statement
- Claude uses this to automatically delegate appropriate tasks
- Should clearly state WHEN to use this subagent

**Good Examples**:
```yaml
description: Expert code reviewer for quality, security, and maintainability issues
description: Specialized in debugging test failures and analyzing error messages
description: Database performance optimizer for PostgreSQL queries and indexes
```

**Poor Examples**:
```yaml
description: Code helper  # Too vague
description: Reviews code  # Doesn't explain when/why
```

#### `tools` (Optional)
- Comma-separated list of allowed tools
- Omit to inherit ALL tools from main session (including MCP tools)
- Follow principle of least privilege

```yaml
# Minimal read-only access
tools: Read, Grep, Glob

# Analysis with execution
tools: Read, Grep, Bash

# Full implementation access
tools: Read, Write, Edit, Grep, Glob, Bash
```

#### `model` (Optional)
- Controls which AI model the subagent uses
- Options: `sonnet`, `opus`, `haiku`, `inherit`
- Omit to use default subagent model configuration

```yaml
model: opus        # Use Claude Opus for complex reasoning
model: sonnet      # Use Claude Sonnet (default)
model: haiku       # Use Claude Haiku for speed/cost
model: inherit     # Use same model as main conversation
```

#### `permissionMode` (Optional)
- Controls how the subagent handles permission requests
- Default: `default` (asks for permissions)

```yaml
permissionMode: default            # Ask for permissions (default)
permissionMode: acceptEdits        # Auto-accept file edits
permissionMode: bypassPermissions  # Skip all permissions (DANGEROUS)
permissionMode: plan               # Read-only analysis mode
permissionMode: ignore             # (Consult docs for behavior)
```

#### `skills` (Optional)
- Auto-load specific skills when subagent is invoked
- Comma-separated list of skill names
- Combines subagent independence with portable skill expertise

```yaml
skills: systematic-debugging, verification-before-completion
skills: frontend-dev-guidelines, backend-dev-guidelines
```

---

## Usage Patterns

### Automatic Delegation

Claude Code proactively delegates tasks to appropriate subagents based on:
- User request descriptions
- Subagent `description` fields
- Current context and available tools

**Example User Request**:
```
Review this authentication module for security issues
```

If you have a subagent with:
```yaml
description: Expert code reviewer focusing on security vulnerabilities and best practices
```

Claude will automatically invoke it.

### Explicit Invocation

Request specific subagents directly:

```
Use the code-reviewer subagent to analyze recent changes
Ask the debugger to investigate this error
Have the test-runner check all unit tests
Use the performance-analyzer for the database queries
```

### Mixed Approach

Combine automatic and explicit:
```
I need help optimizing this API endpoint.
Use the performance-analyzer for the query issues,
then have the code-reviewer check the implementation.
```

---

## Communication Patterns

### Direct: Main → Subagent → Main

The simplest pattern where main agent delegates to a subagent and receives results.

```
Main Agent
   │
   ├─> Delegates to Code Reviewer
   │      └─> Returns findings
   │
   └─> Continues with review results
```

### File-Based Handoffs (Most Reliable)

Subagents cannot directly communicate with each other. Use file-based communication for multi-stage workflows.

```
Main Agent
   │
   ├─> Analyst Subagent
   │      └─> Writes findings to analysis.md
   │
   ├─> Implementation Subagent
   │      └─> Reads analysis.md, implements, writes to implementation.md
   │
   └─> Review Subagent
          └─> Reads implementation.md, validates
```

**Example Workflow**:

```markdown
# Stage 1: Analysis
"Use the security-analyst to review authentication and write findings to security-analysis.md"

# Stage 2: Implementation
"Use the implementer to fix issues listed in security-analysis.md and log changes to implementation-log.md"

# Stage 3: Validation
"Use the validator to verify fixes from implementation-log.md"
```

### Scratchpad Pattern

Give subagents separate working scratchpads for better isolation:

```yaml
# analyst-agent.md
---
name: analyst
description: Analyzes requirements and writes to .analyst-notes.md
---
You write your findings to `.analyst-notes.md`. Never read or modify other scratchpad files.
```

```yaml
# implementer-agent.md
---
name: implementer
description: Implements based on .analyst-notes.md and writes to .implementer-log.md
---
You read from `.analyst-notes.md` and write your progress to `.implementer-log.md`.
```

### Orchestrator Pattern

Main agent coordinates multiple subagents:

```
      Main Agent (Orchestrator)
           │
    ┌──────┼──────┬──────┐
    │      │      │      │
    ▼      ▼      ▼      ▼
 Analyst  Arch  Impl  Test
    │      │      │      │
    └──────┴──────┴──────┘
           │
      Aggregates Results
```

---

## Subagent Chaining

### Linear Chaining

Sequential execution where each subagent's output feeds the next:

```
Analyzer → Optimizer → Documenter
```

**Implementation**:
```markdown
1. "Use the performance-analyzer to identify bottlenecks and write to perf-report.md"
2. "Use the code-optimizer to fix issues in perf-report.md and log changes to optimization-log.md"
3. "Use the docs-generator to create release notes from optimization-log.md"
```

### Parallel Chaining

Multiple subagents work simultaneously on different aspects:

```
          Main Task
         /    |    \
        /     |     \
       ▼      ▼      ▼
    Backend Frontend Tests
       \      |      /
        \     |     /
         Integration
```

**Example**:
```
1. Spawn three parallel tasks:
   - "Use backend-developer for API implementation"
   - "Use frontend-developer for UI components"
   - "Use test-engineer for test suite"
2. After all complete:
   - "Use integration-tester to verify end-to-end flow"
```

### Complex Multi-Stage Pipeline

Real-world example: Full-stack feature implementation

```
Requirements Analyst
        ↓
    System Architect ──→ Database Architect
        ↓                      ↓
    Backend Dev ←──────────────┘
        ↓
    Frontend Dev
        ↓
    Test Automator
        ↓
    Security Auditor
        ↓
    Deployment Engineer
        ↓
    Observability Engineer
```

**Benefits of Chaining**:
- Each specialist maintains its own dedicated context window
- Quality preserved at each step
- Prevents context exhaustion
- Clear separation of concerns

---

## Resumable Subagents

### Overview

Subagents can maintain state across multiple invocations through unique agent IDs and transcript files.

### How It Works

1. Each subagent execution receives a unique `agentId`
2. Full conversation stored in `agent-{agentId}.jsonl` transcript
3. Resume by providing the same `agentId`
4. Agent remembers all previous context

### Usage Pattern

**Initial Invocation**:
```
User: "Use the code-analyzer agent to start reviewing the authentication module"

Response: "Analysis complete. Agent ID: abc123"
```

**Resume Session**:
```
User: "Resume agent abc123 and now analyze the authorization logic as well"

Response: "Continuing from previous session... [analysis with full prior context]"
```

### Programmatic Usage (Agent SDK)

```javascript
// Initial invocation
const result = await agent.run({
  task: "Analyze authentication module"
});
console.log(result.agentId); // "abc123"

// Resume
const continuedResult = await agent.run({
  task: "Now analyze authorization",
  resume: "abc123"
});
```

### Use Cases

- **Long-running research**: Multi-day investigation with context preservation
- **Iterative refinement**: Multiple rounds of code review and fixes
- **Multi-step workflows**: Complex analysis requiring several sessions
- **Session continuity**: Pick up where you left off after breaks

### Transcript Storage

```
.claude/
  transcripts/
    agent-abc123.jsonl      # First session
    agent-def456.jsonl      # Second session
    agent-ghi789.jsonl      # Third session
```

Each JSONL file contains:
- Tool calls and results
- Assistant responses
- Context information

### Known Issue (Critical)

**Bug Report (Nov 2025)**: Agent transcript files do NOT store user prompts that initiated or resumed the agent. This causes:
- Resumed agents lack critical context
- Resume feature partially broken for intended purpose
- Only assistant responses and tool results are saved

**Workaround**: Include summary of previous prompts in resume request:
```
Resume agent abc123. Previously you analyzed authentication (login, JWT tokens).
Now analyze authorization (roles, permissions).
```

---

## Tool Management & MCP Integration

### Tool Configuration Strategies

#### 1. Inherit All Tools (Default)

Omit the `tools` field to inherit ALL tools from main session, including MCP tools:

```yaml
---
name: full-access-agent
description: Agent with complete tool access
# No tools field = inherits everything
---
```

#### 2. Explicit Tool Whitelist (Recommended)

Specify exactly which tools the subagent needs:

```yaml
---
name: read-only-analyzer
description: Analyzes code without modifications
tools: Read, Grep, Glob, Bash
---
```

#### 3. Role-Based Tool Access

Different subagents get different tool sets based on their role:

```yaml
# Analyst: Read-only
---
name: security-analyst
tools: Read, Grep, Glob
---

# Implementer: Full access
---
name: code-implementer
tools: Read, Write, Edit, Grep, Glob, Bash
---

# Reviewer: Read + Execute
---
name: test-reviewer
tools: Read, Grep, Bash
---
```

### MCP Tool Integration

Subagents can access MCP (Model Context Protocol) tools from configured MCP servers.

**Key Behaviors**:
1. If `tools` field is **omitted**: Subagent inherits ALL MCP tools
2. If `tools` field is **specified**: Must explicitly list MCP tools needed
3. MCP tools listed in `/agents` interface alongside built-in tools

**Example with MCP Tools**:
```yaml
---
name: database-admin
description: Database administration and query optimization
tools: Read, Bash, mcp__postgres__query, mcp__postgres__explain
---
```

### Tool Selection Best Practices

| Agent Role | Recommended Tools | Rationale |
|------------|------------------|-----------|
| Analyst | Read, Grep, Glob | Read-only for safety |
| Architect | Read, Grep, Glob, Bash | Analysis + verification |
| Implementer | Read, Write, Edit, Bash | Full implementation |
| Tester | Read, Bash, Grep | Execute tests, read results |
| Reviewer | Read, Grep, Bash | Review + run checks |

### Scope Tools Per Agent

**Example Multi-Agent Workflow**:

```yaml
# PM & Architect: Read-heavy with search
---
name: product-architect
tools: Read, Grep, Glob, mcp__confluence__search, mcp__jira__read
---

# Implementer: Write access + UI testing
---
name: full-stack-implementer
tools: Read, Write, Edit, Bash, mcp__playwright__test
---

# Reviewer: Read + execution
---
name: quality-reviewer
tools: Read, Grep, Bash
---
```

### Tool Sprawl Prevention

If you omit tools in a subagent, it inherits all available tools (including MCP), which can:
- Consume context window space
- Create confusion about which tools to use
- Reduce focus

**Solution**: Whitelist intentionally:
```yaml
tools: Read, Grep, Bash  # Only what's needed
```

### Current Limitation

**Feature Request**: Configure tools/MCP servers available ONLY to subagents (not main agent).

**Issue**: MCP tools configured for subagents are still available to main agent, consuming context.

**Workaround**: Use different Claude Code instances/projects with different MCP configurations.

---

## Model Selection & Inheritance

### Model Configuration Options

| Configuration | Behavior | Use Case |
|--------------|----------|----------|
| `model: sonnet` | Use Claude Sonnet 4.5 | Balanced performance (default) |
| `model: opus` | Use Claude Opus 4 | Complex reasoning, critical tasks |
| `model: haiku` | Use Claude Haiku 4.5 | Speed, cost optimization |
| `model: inherit` | Use main conversation's model | Consistency with main session |
| (omit field) | Use default subagent model | Most common approach |

### Strategic Model Selection

#### By Task Complexity

```yaml
# High complexity: Code review, architecture decisions
---
name: code-reviewer
model: opus
---

# Medium complexity: Implementation, analysis
---
name: implementer
model: sonnet
---

# Low complexity: Documentation, formatting
---
name: docs-writer
model: haiku
---
```

#### Cost Optimization Strategy

**Progressive Enhancement Pattern**:

```
Stage 1: Data Gathering (Haiku)
   ↓
Stage 2: Analysis (Sonnet)
   ↓
Stage 3: Complex Reasoning (Opus - only if needed)
```

**Impact**: Can reduce average token costs by 60%

**Example Implementation**:
```yaml
# Stage 1: Fast data collection
---
name: log-collector
model: haiku
tools: Read, Grep
---

# Stage 2: Pattern analysis
---
name: pattern-analyzer
model: sonnet
tools: Read, Grep, Bash
---

# Stage 3: Root cause diagnosis
---
name: root-cause-investigator
model: opus
tools: Read, Grep, Bash, Edit
---
```

### Performance Benchmarks

| Model | Performance | Speed | Cost | Best For |
|-------|------------|-------|------|----------|
| Haiku 4.5 | 90% of Sonnet | 2x faster | 3x cheaper | Lightweight, frequent invocations |
| Sonnet 4.5 | Baseline | Baseline | Baseline | General purpose |
| Opus 4 | Highest accuracy | Slower | Most expensive | Complex reasoning, critical paths |

### Model Inheritance Patterns

```yaml
# Inherit from main conversation
---
name: consistent-agent
model: inherit
description: Maintains same model as main session
---

# Override with specific model
---
name: speed-agent
model: haiku
description: Fast execution for repetitive tasks
---

# Use default (usually Sonnet)
---
name: default-agent
# No model field
description: Uses configured default subagent model
---
```

### Known Issue

**Bug (2024)**: When using the Task tool to spawn sub-agents, they defaulted to Claude Sonnet 4 instead of inheriting configuration.

**Status**: May be resolved in recent updates, verify in your version.

---

## Permission Modes

### Overview

The `permissionMode` field controls how subagents handle file and command permissions.

### Available Modes

| Mode | Behavior | Use Case | Safety Level |
|------|----------|----------|--------------|
| `default` | Asks for permissions | Standard operation | High |
| `acceptEdits` | Auto-accepts file edits | Isolated file work | Medium |
| `plan` | Read-only analysis | Planning without execution | Highest |
| `bypassPermissions` | Skips ALL permissions | Automation (DANGEROUS) | Lowest |
| `ignore` | (Behavior varies) | Consult docs | Variable |

### Mode Details

#### `default` (Recommended)

Standard permission handling - asks user before:
- File modifications (Edit, Write)
- Command execution (Bash)
- Destructive operations

```yaml
---
name: safe-reviewer
permissionMode: default  # Explicit, but this is default
---
```

#### `acceptEdits`

Automatically accepts file edit permissions, but may still ask for other operations.

**Use Cases**:
- Working on isolated feature branch
- Trusted subagent with scoped file access
- Batch file updates

```yaml
---
name: batch-updater
permissionMode: acceptEdits
tools: Read, Edit, Grep
description: Batch update configuration files
---
```

#### `plan` (Safety Mode)

Read-only mode - analyze and formulate plans without making changes.

**Use Cases**:
- Initial assessment before implementation
- Code review and analysis
- Architecture planning

```yaml
---
name: architecture-planner
permissionMode: plan
tools: Read, Grep, Glob
description: Analyze codebase and create architecture plans
---
```

**Built-in Example**: The Plan Subagent uses this mode.

#### `bypassPermissions` (DANGEROUS)

Skips all permission prompts and safety checks.

**WARNING**: Never use in production or with sensitive codebases!

**Valid Use Cases** (very limited):
- Fully automated CI/CD environments
- Sandboxed test environments
- Throwaway development containers

```yaml
---
name: ci-automation
permissionMode: bypassPermissions
description: Automated CI tasks in sandboxed environment
---
```

### Permission Mode Best Practices

1. **Default to `default`**: Use standard permission handling unless specific reason
2. **Use `plan` for analysis**: Safe for initial exploration and planning
3. **`acceptEdits` for isolation**: Only when working on isolated files/branches
4. **Never `bypassPermissions` in production**: Severe security risk
5. **Document mode choice**: Add comment explaining why non-default mode used

### Dynamic Mode Switching

Switch permission modes based on task progress:

```
Stage 1 (Planning): permissionMode: plan
Stage 2 (Review): permissionMode: default
Stage 3 (Batch Updates): permissionMode: acceptEdits
```

### Mode-Specific Tool Recommendations

```yaml
# Plan mode: Read-only tools
---
permissionMode: plan
tools: Read, Grep, Glob
---

# AcceptEdits: Edit tools
---
permissionMode: acceptEdits
tools: Read, Edit, Grep
---

# Default: Any tools
---
permissionMode: default
tools: Read, Write, Edit, Bash
---
```

---

## Skills Integration

### Overview

The `skills` parameter auto-loads specific skills when a subagent is invoked, combining subagent independence with portable skill expertise.

### Configuration

```yaml
---
name: systematic-debugger
description: Debugs issues using systematic methodology
tools: Read, Grep, Bash, Edit
model: sonnet
skills: systematic-debugging, verification-before-completion
---
```

### How Skills Work with Subagents

1. **Progressive Disclosure**: Skills expand only when triggered, keeping context efficient
2. **Specialized Knowledge**: Skills provide portable expertise (patterns, checklists, workflows)
3. **Combined Benefits**:
   - Subagent = Isolated context + dedicated tools
   - Skill = Portable knowledge + best practices

### Practical Examples

#### Full-Stack Development Agent

```yaml
---
name: fullstack-developer
description: Full-stack feature implementation with best practices
tools: Read, Write, Edit, Grep, Bash
model: sonnet
skills: frontend-dev-guidelines, backend-dev-guidelines, verification-before-completion
---

You implement full-stack features following project guidelines for both frontend and backend.
```

#### Kubernetes Infrastructure Agent

```yaml
---
name: kubernetes-architect
description: Creates production-grade Kubernetes configurations
tools: Read, Write, Edit, Bash
model: sonnet
skills: kubernetes-best-practices, helm-charts, gitops-patterns, security-hardening
---

You create Kubernetes deployments with Helm charts and GitOps, following production best practices.
```

#### Test-Driven Development Agent

```yaml
---
name: tdd-implementer
description: Implements features using test-driven development
tools: Read, Write, Edit, Bash
model: sonnet
skills: testing-anti-patterns, condition-based-waiting, verification-before-completion
---

You follow TDD: write failing test, implement minimal code, verify passing, refactor.
```

### Skills vs Subagents Decision Matrix

| Scenario | Use Skill | Use Subagent | Use Both |
|----------|-----------|--------------|----------|
| Reusable best practices | ✓ | | |
| Isolated context needed | | ✓ | |
| Specialized tool access | | ✓ | |
| Complex workflows | | ✓ | |
| Domain expertise | ✓ | | |
| Expert with best practices | | | ✓ |

**Guideline**:
- **Skill**: Portable knowledge, can be applied in any context
- **Subagent**: Dedicated context with specific tools/permissions
- **Both**: Specialized subagent using best practice skills

### Skill Auto-Loading Syntax

```yaml
# Single skill
skills: systematic-debugging

# Multiple skills (comma-separated)
skills: skill1, skill2, skill3

# Real example
skills: frontend-dev-guidelines, backend-dev-guidelines, error-tracking
```

---

## Built-In Subagents

### Plan Subagent

**Purpose**: Specialized for plan mode (non-execution) - conducts research before presenting plans.

**Configuration**:
- **Model**: Sonnet
- **Tools**: Read, Glob, Grep, Bash (exploration only)
- **Permission Mode**: `plan` (read-only)

**Usage**:
```
"Create a plan for refactoring the authentication module"
```

**Behavior**:
1. Claude internally invokes Plan subagent
2. Subagent explores codebase with read-only tools
3. Subagent searches for relevant files and patterns
4. Returns findings to main agent
5. Main agent presents comprehensive plan

**When Automatically Triggered**:
- User requests a plan
- Main agent in plan mode needs to explore codebase
- Architecture or design decisions need research

---

## Example Implementations

### 1. Code Reviewer

**Purpose**: Expert code review specialist focusing on quality, security, and maintainability.

```yaml
---
name: code-reviewer
description: Expert code reviewer focusing on quality, security, and maintainability. Proactively reviews code for best practices and potential issues.
tools: Read, Grep, Glob, Bash
model: opus
permissionMode: default
skills: verification-before-completion
---

You are a senior code reviewer with expertise in software quality, security, and maintainability.

## Review Areas

### Code Quality
- Naming conventions and readability
- Code duplication (DRY principle)
- Function/method complexity
- Design patterns appropriateness

### Security
- Input validation and sanitization
- SQL injection vulnerabilities
- XSS (Cross-Site Scripting) risks
- Exposed secrets, API keys, or credentials
- Authentication and authorization flaws

### Performance
- Algorithm efficiency
- Database query optimization
- N+1 query patterns
- Memory leaks

### Error Handling
- Proper exception handling
- Graceful degradation
- User-friendly error messages

### Testing
- Test coverage
- Edge case handling
- Mock/stub appropriateness

## Review Process

1. **Read the code** thoroughly
2. **Identify issues** categorized by severity
3. **Provide specific examples** and line numbers
4. **Suggest concrete improvements**
5. **Explain the reasoning** behind each suggestion

## Issue Categories

- **Critical**: Security vulnerabilities, data loss risks, production-breaking bugs
- **Warnings**: Performance issues, poor practices, maintainability concerns
- **Suggestions**: Code style, minor optimizations, best practices

## Output Format

Provide a structured review:

### Critical Issues
- [Issue 1 with file, line, and fix]

### Warnings
- [Issue 2 with file, line, and fix]

### Suggestions
- [Issue 3 with file, line, and improvement]

### Summary
[Overall assessment and priority recommendations]
```

### 2. Debugger

**Purpose**: Debugging specialist for errors, test failures, and unexpected behavior.

```yaml
---
name: debugger
description: Debugging specialist for investigating errors, test failures, and unexpected behavior. Systematically traces root causes.
tools: Read, Grep, Bash, Edit
model: sonnet
permissionMode: default
skills: systematic-debugging, root-cause-tracing, verification-before-completion
---

You are a debugging specialist who systematically investigates and resolves issues.

## Debugging Process

### 1. Capture Error Information
- Full error messages and stack traces
- Reproduction steps
- Expected vs actual behavior
- Environment details (versions, OS, etc.)

### 2. Identify Failure Location
- Trace through stack trace
- Identify exact file and line
- Understand surrounding code context

### 3. Root Cause Analysis
- Why did this fail?
- What data triggered the failure?
- Is this a regression or new issue?
- Are there similar issues elsewhere?

### 4. Implement Minimal Fix
- Fix the specific issue, not refactor
- Add defensive checks if needed
- Preserve existing behavior for passing tests

### 5. Verify Solution
- Run failing tests to confirm fix
- Run full test suite for regressions
- Test edge cases manually if needed

## Debugging Techniques

- **Binary search**: Comment out code to isolate failure
- **Print debugging**: Add logging at key points
- **Stack trace analysis**: Follow the execution path
- **Data inspection**: Examine variable states
- **Comparative analysis**: Compare working vs broken states

## Output

Provide:
1. Root cause explanation
2. Specific fix with file/line references
3. Verification steps taken
4. Any related issues discovered
```

### 3. Data Scientist

**Purpose**: Data analysis expert for SQL queries, BigQuery operations, and data insights.

```yaml
---
name: data-scientist
description: Data analysis expert for SQL queries, BigQuery operations, and generating insights from data.
tools: Read, Bash, Grep, mcp__bigquery__query
model: sonnet
permissionMode: default
---

You are a data scientist specializing in SQL and data analysis.

## Responsibilities

### Query Development
- Write efficient, optimized SQL queries
- Use appropriate indexes and joins
- Avoid full table scans
- Consider query cost and performance

### BigQuery Operations
- Execute queries via command-line tools
- Analyze results and generate insights
- Export data in requested formats
- Manage dataset permissions and quotas

### Data Analysis
- Summarize findings clearly
- Identify trends and patterns
- Create meaningful aggregations
- Suggest visualization approaches

### Cost Optimization
- Estimate query costs before execution
- Use partitioned tables when available
- Leverage caching for repeated queries
- Minimize data scanning

## Process

1. Understand the analytical question
2. Explore schema and available data
3. Write and test query incrementally
4. Execute and capture results
5. Analyze and summarize findings
6. Suggest follow-up analyses if relevant

## Output Format

### Query
```sql
[Optimized SQL query]
```

### Results Summary
[Key findings and insights]

### Performance Notes
- Estimated cost: [cost]
- Execution time: [time]
- Rows scanned: [count]
```

### 4. Performance Analyzer

```yaml
---
name: performance-analyzer
description: Analyzes application performance, identifies bottlenecks, and suggests optimizations.
tools: Read, Grep, Bash
model: sonnet
permissionMode: plan
---

You are a performance optimization specialist.

## Analysis Areas

### Application Performance
- Response time analysis
- CPU and memory profiling
- Async/await patterns
- Caching effectiveness

### Database Performance
- Slow query logs
- Missing indexes
- N+1 query detection
- Connection pool sizing

### Frontend Performance
- Bundle size analysis
- Render performance
- Lazy loading opportunities
- Asset optimization

## Process

1. Gather performance metrics
2. Identify top bottlenecks
3. Analyze root causes
4. Prioritize by impact
5. Suggest specific optimizations

## Output

Deliver findings in priority order with estimated impact.
```

### 5. Security Auditor

```yaml
---
name: security-auditor
description: Conducts security audits, identifies vulnerabilities, and suggests hardening measures.
tools: Read, Grep, Bash
model: opus
permissionMode: plan
skills: defense-in-depth
---

You are a security specialist conducting comprehensive security audits.

## Audit Areas

### Authentication & Authorization
- Credential storage
- Session management
- Access control implementation
- OAuth/JWT security

### Input Validation
- SQL injection risks
- XSS vulnerabilities
- CSRF protection
- Path traversal risks

### Data Protection
- Encryption at rest
- Encryption in transit
- Sensitive data exposure
- PII handling

### Dependencies
- Vulnerable package versions
- Supply chain risks
- License compliance

### Infrastructure
- Secrets management
- Environment configuration
- Network security
- Container security

## Output

Categorized findings with CVE references where applicable and remediation steps.
```

---

## Advanced Workflows

### Three-Stage Pipeline: PM → Architect → Implementer

```yaml
# Stage 1: Requirements Specification
---
name: pm-spec
description: Reads enhancement requests and writes working specifications
tools: Read, Write, Grep
model: sonnet
---

Read the enhancement request, clarify requirements, and write a detailed spec to `spec.md`.
Set status to READY_FOR_ARCH when complete.
```

```yaml
# Stage 2: Architecture Review
---
name: architect-review
description: Validates design against platform constraints and produces ADR
tools: Read, Write, Grep, Bash
model: opus
---

Read `spec.md`, validate against platform constraints, and produce an Architecture Decision Record (ADR).
Write to `architecture.md` and set status to READY_FOR_BUILD.
```

```yaml
# Stage 3: Implementation & Testing
---
name: implementer-tester
description: Implements code, tests, and updates documentation
tools: Read, Write, Edit, Bash
model: sonnet
skills: verification-before-completion, testing-anti-patterns
---

Read `architecture.md`, implement the solution with tests, update docs, and set status to DONE.
```

**Usage**:
```
1. "Use pm-spec to process the new feature request in feature-request.md"
2. [Wait for READY_FOR_ARCH]
3. "Use architect-review to validate the spec"
4. [Wait for READY_FOR_BUILD]
5. "Use implementer-tester to build the feature"
```

### Parallel Feature Development

```yaml
# Backend API
---
name: backend-developer
description: Implements backend API endpoints and business logic
tools: Read, Write, Edit, Bash
model: sonnet
skills: backend-dev-guidelines, error-tracking
---
```

```yaml
# Frontend Components
---
name: frontend-developer
description: Implements UI components and frontend logic
tools: Read, Write, Edit, Bash
model: sonnet
skills: frontend-dev-guidelines
---
```

```yaml
# Test Suite
---
name: test-engineer
description: Creates comprehensive test suites
tools: Read, Write, Edit, Bash
model: sonnet
skills: testing-anti-patterns, condition-based-waiting
---
```

```yaml
# Integration Validator
---
name: integration-tester
description: Validates end-to-end integration
tools: Read, Bash
model: sonnet
---
```

**Usage**:
```
# Parallel execution
1. "Use backend-developer to implement the user profile API"
2. "Use frontend-developer to create the profile UI components"
3. "Use test-engineer to write tests for both"

# Integration
4. [Wait for all three to complete]
5. "Use integration-tester to verify the full flow"
```

### Continuous Improvement Loop

```yaml
# Monitor
---
name: performance-monitor
description: Monitors production metrics and identifies degradation
tools: Read, Bash
model: haiku
---
```

```yaml
# Analyze
---
name: root-cause-analyzer
description: Analyzes performance issues and identifies root causes
tools: Read, Grep, Bash
model: sonnet
skills: root-cause-tracing
---
```

```yaml
# Optimize
---
name: optimizer
description: Implements performance optimizations
tools: Read, Write, Edit, Bash
model: sonnet
---
```

```yaml
# Validate
---
name: improvement-validator
description: Validates performance improvements
tools: Read, Bash
model: sonnet
skills: verification-before-completion
---
```

**Continuous Loop**:
```
Monitor → Analyze → Optimize → Validate → Monitor (repeat)
```

---

## Best Practices

### 1. Start with AI Generation

**Anthropic's Official Recommendation**:
> "We highly recommend generating your initial subagent with Claude and then iterating on it"

**Process**:
1. Describe the subagent you need
2. Let Claude generate the YAML frontmatter and system prompt
3. Test with real tasks
4. Iterate based on results

### 2. Design Focused Responsibility

**Do**: Create single-purpose subagents
```yaml
name: sql-optimizer        # Focused on SQL optimization
name: react-component-dev  # Focused on React components
name: api-security-audit   # Focused on API security
```

**Don't**: Create multi-function subagents
```yaml
name: everything-agent     # Too broad, unfocused
name: helper               # Unclear purpose
```

### 3. Detailed Prompt Engineering

Include in system prompts:
- **Specific instructions**: Exact steps to follow
- **Examples**: Show expected output format
- **Constraints**: What NOT to do
- **Context**: When/why to use certain approaches
- **Quality criteria**: What defines success

**Good Example**:
```markdown
## Process

1. Read the authentication module files
2. Check for these specific issues:
   - Hardcoded credentials
   - Weak password validation (< 8 chars, no special chars)
   - Missing rate limiting
3. For each issue:
   - Cite file and line number
   - Explain the vulnerability
   - Provide a specific code fix
4. Prioritize by severity: Critical > High > Medium > Low

## Constraints

- Do NOT refactor unrelated code
- Do NOT change the public API
- Focus ONLY on security, not performance
```

### 4. Minimal Tool Access (Principle of Least Privilege)

Only grant tools the subagent actually needs:

```yaml
# Analysis: Read-only
tools: Read, Grep, Glob

# Review: Read + Execution
tools: Read, Grep, Bash

# Implementation: Full access
tools: Read, Write, Edit, Grep, Bash
```

**Benefits**:
- Improved security
- Reduced context window usage
- Clearer focus on purpose
- Prevents accidental modifications

### 5. Version Control for Team Collaboration

Store project subagents in `.claude/agents/` and commit to repository:

```bash
git add .claude/agents/
git commit -m "Add code-reviewer subagent"
git push
```

**Benefits**:
- Team uses consistent subagents
- Track subagent evolution
- Code review subagent configurations
- Share best practices across team

### 6. Use Permission Modes Appropriately

```yaml
# Analysis phase: plan mode
permissionMode: plan

# Implementation phase: default or acceptEdits
permissionMode: default

# Never in production: bypassPermissions
# permissionMode: bypassPermissions  # DANGEROUS
```

### 7. Strategic Model Selection

- **Opus**: Critical decisions, complex reasoning, important reviews
- **Sonnet**: General implementation, balanced performance
- **Haiku**: Fast iteration, lightweight tasks, cost optimization

### 8. Test Subagents Before Deployment

1. Create subagent
2. Test with representative tasks
3. Verify output quality
4. Check tool usage appropriateness
5. Iterate on system prompt
6. Deploy to team

### 9. Document Subagent Purpose

Include clear description of:
- **When** to use this subagent
- **What** it does
- **How** it approaches tasks
- **Why** it exists (vs other subagents)

### 10. Monitor and Iterate

- Collect feedback on subagent effectiveness
- Track success/failure rates
- Refine system prompts based on real usage
- Update tool access as needs evolve

---

## Performance Considerations

### Context Efficiency

**Benefit**: Subagents preserve main conversation context
- Main conversation doesn't get polluted with implementation details
- Enables extended sessions without context exhaustion
- Each subagent has fresh context window

**Example**:
```
Main conversation: 1000 tokens (stays clean)
  ├─ Code Reviewer subagent: 5000 tokens (isolated)
  ├─ Implementer subagent: 8000 tokens (isolated)
  └─ Test Runner subagent: 3000 tokens (isolated)

Total effective context: 17,000 tokens across isolated windows
```

### Invocation Latency

**Trade-off**: Subagents start fresh and gather required context

**Overhead**:
- Context gathering: Reading relevant files
- Tool initialization: Setting up tool access
- Model loading: Initializing model (if different)

**Mitigation**:
- Use resumable subagents for multi-step workflows
- Cache analysis results in files for reuse
- Use faster models (Haiku) for lightweight tasks

### Context Limits

Each subagent operates within its own context window:
- **Benefit**: Can handle more total context across all subagents
- **Limitation**: Each individual subagent limited to its model's context window

**Example**:
```
Single agent: 200k token limit total
Multiple subagents: 200k tokens EACH, effectively unlimited with proper orchestration
```

### Cost Optimization

**Progressive Enhancement Pattern** (60% cost reduction possible):

```
Haiku (Fast/Cheap) → Sonnet (Balanced) → Opus (Powerful/Expensive - only if needed)
```

**Real Numbers**:
- Haiku: 3x cheaper, 2x faster than Sonnet
- Sonnet: Baseline cost and speed
- Opus: Most expensive, slower, highest quality

**Application**:
```
Log parsing (Haiku) → Pattern analysis (Sonnet) → Root cause diagnosis (Opus)
```

---

## Known Issues & Limitations

### 1. Resumable Subagents: Missing User Prompts (Critical Bug)

**Issue**: Agent transcript files (`agent-{agentId}.jsonl`) do NOT store user prompts
**Impact**: Resumed agents lack context from user's original request
**Status**: Reported November 2025, unfixed
**Workaround**: Include summary in resume request

```
# Instead of:
"Resume agent abc123"

# Use:
"Resume agent abc123. Previously you analyzed authentication (login, JWT).
Now analyze authorization (roles, permissions)."
```

### 2. Subagents Cannot Directly Communicate

**Limitation**: Subagents receive context FROM main thread but cannot exchange info WITH each other
**Impact**: Multi-stage workflows require file-based handoffs
**Workaround**: Use scratchpad pattern with files

```
Agent A → writes to analysis.md
Agent B → reads from analysis.md, writes to implementation.md
Agent C → reads from implementation.md
```

### 3. MCP Tools Always Available to Main Agent

**Issue**: Cannot configure MCP tools for subagents only
**Impact**: MCP tools consume main agent's context even if only needed for subagents
**Status**: Feature request open
**Workaround**: Use separate Claude Code instances/projects

### 4. Subagent Behavior in Plan Mode (Ambiguity)

**Issue**: When main agent in plan mode delegates to subagent, subagent's permission mode is undefined
**Impact**: Unclear if subagent can execute or is read-only
**Status**: Ambiguous behavior reported
**Recommendation**: Explicitly set `permissionMode: plan` on subagents used in plan mode

### 5. Model Inheritance Bug (Historical)

**Issue**: Task tool subagents defaulted to Sonnet 4 instead of inheriting config
**Status**: Reported 2024, may be fixed in current version
**Verification**: Test model inheritance in your version

### 6. Summary-Based Communication Limitations

**Limitation**: Subagents return summaries, not full context
**Impact**: Critical details may be lost in summarization
**Mitigation**:
- Explicitly instruct subagents what to include in summaries
- Use file outputs for detailed results
- Chain subagents with file-based handoffs

---

## Resources & Community Examples

### Official Documentation

- **Main Docs**: https://code.claude.com/docs/en/sub-agents
- **Agent SDK**: https://docs.claude.com/en/docs/agent-sdk/subagents
- **Best Practices**: https://www.anthropic.com/engineering/claude-code-best-practices

### Community Collections

#### Production-Ready Subagent Collections

1. **awesome-claude-code-subagents** (VoltAgent)
   - GitHub: https://github.com/VoltAgent/awesome-claude-code-subagents
   - 100+ specialized AI agents
   - Domains: Full-stack dev, DevOps, data science, business ops

2. **claude-code-subagents** (0xfurai)
   - GitHub: https://github.com/0xfurai/claude-code-subagents
   - 100+ production-ready agents
   - Organized by development domains

3. **agents** (wshobson)
   - GitHub: https://github.com/wshobson/agents
   - Intelligent automation and multi-agent orchestration
   - Advanced workflow examples

4. **claude-sub-agent** (zhsama)
   - GitHub: https://github.com/zhsama/claude-sub-agent
   - AI-driven development workflow system
   - Multi-phase transformation examples

### Articles & Guides

- **PubNub**: Best practices for Claude Code subagents
- **Sabrina.dev**: Reverse-Engineering Claude Code Using Claude Sub Agents
- **eesel.ai**: Complete guide to Claude Code permissions
- **Medium**: Various tutorials on subagent workflows and patterns

### Example Domains Covered

- **Full-Stack Development**: Frontend, backend, database, API
- **DevOps**: CI/CD, deployment, monitoring, infrastructure
- **Data Science**: SQL, BigQuery, data analysis, visualization
- **Security**: Auditing, penetration testing, vulnerability scanning
- **Testing**: Unit tests, integration tests, E2E tests
- **Documentation**: API docs, README generation, changelog management
- **Performance**: Profiling, optimization, load testing

---

## Quick Reference

### Common Subagent Templates

#### Read-Only Analyzer
```yaml
---
name: analyzer
description: Analyzes [domain] without modifications
tools: Read, Grep, Glob
model: sonnet
permissionMode: plan
---
```

#### Full Implementer
```yaml
---
name: implementer
description: Implements [feature] with tests
tools: Read, Write, Edit, Bash
model: sonnet
permissionMode: default
skills: verification-before-completion
---
```

#### Fast Lightweight Agent
```yaml
---
name: lightweight
description: Fast [task] with cost optimization
tools: Read, Bash
model: haiku
permissionMode: default
---
```

#### Critical Reviewer
```yaml
---
name: reviewer
description: Expert review for [domain]
tools: Read, Grep, Bash
model: opus
permissionMode: default
---
```

### Quick Decision Matrix

| Need | Solution |
|------|----------|
| Isolated context | Use subagent |
| Portable knowledge | Use skill |
| Tool restrictions | Use subagent with `tools` field |
| Fast/cheap execution | Use `model: haiku` |
| Complex reasoning | Use `model: opus` |
| Read-only analysis | Use `permissionMode: plan` |
| Auto-accept edits | Use `permissionMode: acceptEdits` |
| Multi-stage workflow | Chain subagents with file handoffs |
| Reusable across projects | Store in `~/.claude/agents/` |
| Team collaboration | Store in `.claude/agents/` and commit |

### Invocation Patterns

```bash
# Automatic delegation
"Review this code for security issues"

# Explicit invocation
"Use the security-auditor subagent to review this code"

# Chained workflow
"Use analyzer to find issues, then use implementer to fix them"

# Parallel workflow
"Use backend-dev for API, frontend-dev for UI, and test-engineer for tests"

# Resume session
"Resume agent abc123 and continue the analysis"
```

---

## Conclusion

Claude Code subagents enable powerful multi-agent workflows through:
- **Isolation**: Dedicated context windows prevent pollution
- **Specialization**: Focused expertise with custom prompts
- **Flexibility**: Granular control over tools, models, permissions
- **Reusability**: Share across projects and teams
- **Scalability**: Chain and orchestrate complex workflows

**Key Success Factors**:
1. Start with AI-generated subagents, then iterate
2. Design focused, single-purpose subagents
3. Use minimal tool access (principle of least privilege)
4. Strategic model selection (Opus/Sonnet/Haiku)
5. File-based communication for chaining
6. Version control for team collaboration

**Common Pitfalls to Avoid**:
- Multi-function subagents (too broad)
- Over-privileged tool access
- Missing or vague system prompts
- Using `bypassPermissions` outside sandboxes
- Expecting direct subagent-to-subagent communication

By following these patterns and best practices, you can build sophisticated multi-agent systems that scale from simple code reviews to complex enterprise development workflows.

---

**Documentation Version**: 1.0
**Compiled**: 2025-11-18
**Source Material**: Official Claude Code docs + community research + practical examples
