---
name: agent-management
description: Complete agent lifecycle management including creation, configuration, testing, deployment, and updates
triggers:
  keywords:
    - create agent
    - new agent
    - agent config
    - configure agent
    - manage agent
    - update agent
    - upgrade agent
    - list agents
    - show agents
  intentPatterns:
    - "(?i)create.*agent"
    - "(?i)build.*agent"
    - "(?i)configure.*agent"
    - "(?i)manage.*agent"
    - "(?i)update.*agent"
    - "(?i)upgrade.*agent"
    - "(?i)modify.*agent"
    - "(?i)list.*agents?"
    - "(?i)show.*agents?"
  filePaths:
    - "**/.claude/agents/*.md"
    - "**/agents/*.md"
---

# Agent Management Skill

Complete toolkit for managing Claude Code agents throughout their lifecycle.

## Quick Start

This skill helps you:
1. **Create** new agents with templates
2. **List** available agents and their capabilities
3. **Update** existing agents (tools, model, instructions)
4. **Configure** agent behavior and permissions
5. **Test** agent functionality
6. **Deploy** agents to production

## Available Commands

- `/create-agent [name]` - Create new agent with templates
- `/list-agents [filter]` - Show all available agents
- `/update-agent [name]` - Update existing agent configuration
- Test agents: `Task(subagent_type="name", ...)`

## Agent Creation Workflow

### Step 1: Define Requirements

Questions to answer:
- **What problem does this agent solve?**
- **What domain expertise is needed?**
- **What tools should it access?**
- **What's the expected output?**
- **Who will use it?**

### Step 2: Choose Agent Type

| Type | Use Case | Model | Tools |
|------|----------|-------|-------|
| **Code Reviewer** | Review code quality | Sonnet | Read, Grep, Glob |
| **Documentation** | Generate docs | Sonnet | Read, Write, Grep, Glob |
| **Testing** | Create tests | Sonnet | Read, Write, Edit, Bash |
| **Debugger** | Fix issues | Sonnet | Read, Edit, Bash, Grep |
| **Researcher** | Gather info | Opus | Read, WebFetch, WebSearch |
| **Architect** | Design systems | Opus | Read, Grep, Glob, Write |
| **Optimizer** | Improve performance | Sonnet | Read, Edit, Bash, Grep |

### Step 3: Create Agent File

**Location**: `.claude/agents/{agent-name}.md`

**Template**:
```yaml
---
name: Agent Name
description: One-line purpose
model: sonnet
tools:
  - Read
  - Write
permissions: default
---

# {Agent Name}

Brief overview of agent purpose.

## Responsibilities

1. Primary responsibility
2. Secondary responsibility
3. Additional responsibilities

## Process

1. First step
2. Second step
3. Final step

## Guidelines

- Key guideline 1
- Key guideline 2
- Key guideline 3

## Examples

Example usage scenarios
```

### Step 4: Configure Permissions

Add to `.claude/settings.json`:

```json
{
  "allowedTools": [
    "Read",
    "Write",
    "Edit:*",
    "Bash(npm test:*)",
    "mcp__github__*"
  ]
}
```

### Step 5: Test Agent

Test invocation:
```bash
# Via Task tool
Use Task tool with subagent_type matching your agent name

# Via slash command
/your-agent-name

# Via headless mode
claude -p "Task: use {agent-name} to review code"
```

## Agent Configuration Options

### YAML Frontmatter Fields

```yaml
---
name: string              # Required: Display name
description: string       # Required: Brief purpose (1-2 sentences)
model: sonnet|opus|haiku # Optional: Default sonnet
tools: string[]          # Optional: Specific tools allowed
allowAllTools: boolean   # Optional: Default false
permissions: string      # Optional: default|plan|acceptEdits|bypassPermissions
resumable: boolean       # Optional: For multi-turn workflows
skills: string[]         # Optional: Skills to auto-load
maxTurns: number        # Optional: Max conversation turns
timeout: number         # Optional: Max execution time (seconds)
---
```

### Permission Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| `default` | Asks user for permission | Interactive development |
| `plan` | Shows plan before executing | Code changes requiring review |
| `acceptEdits` | Auto-approves file edits | Trusted automation |
| `bypassPermissions` | No permission prompts | CI/CD pipelines |

### Tool Configuration

**Specific tools**:
```yaml
tools:
  - Read
  - Write
  - Edit
  - Bash(npm test:*)
  - mcp__github__create_issue
```

**All tools**:
```yaml
allowAllTools: true
```

**No tools** (instructions only):
```yaml
tools: []
allowAllTools: false
```

## Output Style Integration

### When to Use Output Styles

Use output styles for **personality and tone**:
- Custom greeting/banner
- Response formatting
- Communication style
- Non-technical behavior

Use agent definition for **capabilities and process**:
- What the agent does
- How it does it
- Technical guidelines
- Tool usage patterns

### Creating Output Style

**Location**: `.claude/output-styles/{style-name}.md` or `core/output-styles/{style-name}.md`

**Template**:
```yaml
---
name: Style Name
description: Personality description
keep-coding-instructions: true
---

# Personality

Warm, professional expert in {domain}.

## Communication Style

- Clear and concise
- Specific examples
- Technical accuracy
- Supportive tone

## Response Format

Always structure responses:
1. Quick summary
2. Detailed explanation
3. Code examples
4. Next steps

## Banner

═══════════════════════════════════════
  🎯 {Agent Name} v1.0
  ⚡ {Tagline}
═══════════════════════════════════════
```

**Configure**:
```json
{
  "outputStyle": "style-name"
}
```

## Testing & Validation

### Pre-Deployment Checklist

- [ ] **Agent file exists** in correct location
- [ ] **YAML frontmatter valid** (check with YAML validator)
- [ ] **Tools specified** or allowAllTools set
- [ ] **Description clear** (1-2 sentences)
- [ ] **Instructions complete** with examples
- [ ] **Permissions configured** in settings.json
- [ ] **Output style created** (if custom personality)
- [ ] **Test invocation works**
- [ ] **Error handling tested**
- [ ] **Documentation updated**

### Test Commands

**Test agent definition**:
```bash
# Check YAML is valid
cat .claude/agents/my-agent.md | grep -A 20 "^---$" | head -n 21 | python3 -c "import yaml, sys; yaml.safe_load(sys.stdin)"

# Test invocation (interactive)
claude
# Then use: /task or invoke via Task tool
```

**Test output style**:
```bash
# Verify file exists
ls -la .claude/output-styles/my-style.md

# Check settings.json
cat .claude/settings.local.json | jq '.outputStyle'
```

**Test with headless**:
```bash
claude -p "Use the {agent-name} agent to review this file: src/index.ts" --output-format json
```

### Common Test Scenarios

1. **Happy path**: Agent completes task successfully
2. **Missing tools**: Agent needs tool not in allowedTools
3. **Invalid input**: Agent receives unexpected input
4. **Error conditions**: Agent encounters errors
5. **Permission denied**: User denies permission
6. **Timeout**: Task takes too long

## Advanced Patterns

### Multi-Agent Coordination

**Pattern**: Orchestrator delegates to specialists

```yaml
---
name: Orchestrator
description: Coordinates multiple specialist agents
model: sonnet
tools:
  - Read
  - Task
---

# Orchestrator

When given complex request:

1. **Analyze** - Break into sub-tasks
2. **Delegate** - Assign to specialist agents:
   - Code review → code-reviewer agent
   - Documentation → docs-generator agent
   - Testing → test-creator agent
3. **Synthesize** - Combine results
4. **Report** - Unified response
```

### Resumable Workflows

**Pattern**: Long-running multi-turn tasks

```yaml
---
name: Migration Assistant
description: Handles complex multi-step migrations
resumable: true
model: sonnet
---

# Migration Assistant

For multi-step migrations:

1. **Plan** - Create migration plan (save state)
2. **Execute** - Run migration steps (resume if needed)
3. **Validate** - Check results (resume if errors)
4. **Report** - Final status

Use agentId to resume:
- First call: Creates new agent, returns agentId
- Subsequent calls: Resume with same agentId
```

### Skill Integration

**Pattern**: Auto-load relevant skills

```yaml
---
name: React Expert
description: React development specialist
skills:
  - frontend-dev-guidelines
  - react-patterns
  - testing-library
model: sonnet
---

# React Expert

Skills auto-loaded:
- frontend-dev-guidelines → component structure
- react-patterns → hooks, state management
- testing-library → component testing

Agent has immediate access to all skill knowledge.
```

## Production Deployment

### Versioning

Track agent versions:
```yaml
---
name: Code Reviewer
description: Expert code review
version: 2.1.0
changelog: |
  2.1.0 - Added security vulnerability detection
  2.0.0 - Redesigned review process
  1.0.0 - Initial release
---
```

### Documentation

Create README for each agent:

**`.claude/agents/README.md`**:
```markdown
# Project Agents

## Available Agents

### code-reviewer
**Purpose**: Automated code review with security focus
**Invoke**: Use Task tool with subagent_type="code-reviewer"
**Model**: Sonnet
**Tools**: Read, Grep, Glob

### docs-generator
**Purpose**: Generate documentation from code
**Invoke**: /generate-docs or Task tool
**Model**: Sonnet
**Tools**: Read, Write, Grep, Glob

## Usage Examples

[Provide specific examples]
```

### CI/CD Integration

**GitHub Actions**:
```yaml
name: Agent Review
on: [pull_request]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Code Review Agent
        run: |
          claude -p "Use code-reviewer agent to review changes in this PR" \
            --output-format json \
            --permission-mode bypassPermissions
        env:
          CLAUDE_CODE_API_KEY: ${{ secrets.CLAUDE_API_KEY }}
```

### Monitoring

Track agent usage:
```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "echo \"$(date -Iseconds) | ${TOOL_NAME} | ${SESSION_ID}\" >> ~/.claude/agent-usage.log"
      }]
    }]
  }
}
```

## Troubleshooting

### Agent Not Found

**Symptom**: "Unknown agent" error

**Solutions**:
1. Check file location: `.claude/agents/{name}.md`
2. Verify YAML frontmatter has `name` field
3. Check for YAML syntax errors
4. Ensure file is readable (chmod 644)

### Tools Not Available

**Symptom**: "Tool not allowed" error

**Solutions**:
1. Add to allowedTools in settings.json
2. Or set `allowAllTools: true` in agent
3. Check MCP configuration if using MCP tools
4. Verify tool name matches exactly (case-sensitive)

### Agent Behaves Incorrectly

**Symptom**: Agent doesn't follow instructions

**Solutions**:
1. Check instructions are clear and specific
2. Provide examples in agent definition
3. Test with different prompts
4. Review output style if personality conflicts
5. Simplify instructions, add progressively

### Performance Issues

**Symptom**: Agent is slow or times out

**Solutions**:
1. Use Haiku model for simple tasks
2. Set timeout limit in frontmatter
3. Reduce context size in instructions
4. Break into smaller sub-agents
5. Cache frequently used data

## References

All comprehensive guides available in `/home/anga/workspace/beta/codehornets-ai/docs/`:

- `CLAUDE_CODE_SUBAGENTS_COMPLETE_GUIDE.md` - Sub-agent architecture
- `CLAUDE_CODE_OUTPUT_STYLES_COMPLETE_GUIDE.md` - Output styles
- `CLAUDE_CODE_SKILLS_COMPLETE_GUIDE.md` - Skills system
- `CLAUDE_CODE_PLUGINS_COMPLETE_GUIDE.md` - Plugin development
- `CLAUDE_CODE_HOOKS_GUIDE.md` - Lifecycle hooks
- `CLAUDE_CODE_HEADLESS_COMPLETE_GUIDE.md` - Automation
- `MCP_COMPREHENSIVE_REFERENCE.md` - MCP integration

---

**Ready to manage agents!** What agent would you like to create or update?
