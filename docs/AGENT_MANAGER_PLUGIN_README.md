# Agent Manager Plugin - Installation & Usage

## Overview

Complete plugin for creating and managing Claude Code agents with best practices from official Anthropic documentation.

## What Was Created

### Plugin Structure

```
.claude/plugins/agent-manager/
├── .claude-plugin/
│   └── plugin.json                 # Plugin manifest (REQUIRED)
├── README.md                        # Plugin documentation
├── agents/
│   └── agent-creator.md            # Interactive agent creation assistant
├── skills/
│   └── agent-management/
│       └── SKILL.md                # Complete agent lifecycle management
├── commands/
│   └── create-agent.md             # Quick agent creation command
├── hooks/
│   └── hooks.json                  # Lifecycle hooks
└── STRUCTURE.md                     # Structure reference
```

### Documentation Indexed

All official Claude Code documentation has been indexed and saved to `/home/anga/workspace/beta/codehornets-ai/docs/`:

1. **CLAUDE_CODE_SUBAGENTS_COMPLETE_GUIDE.md** - Sub-agent architecture, configuration, best practices
2. **CLAUDE_CODE_PLUGINS_COMPLETE_GUIDE.md** - Plugin system, marketplace, distribution
3. **CLAUDE_CODE_SKILLS_COMPLETE_GUIDE.md** - Skills framework, triggers, progressive disclosure
4. **CLAUDE_CODE_OUTPUT_STYLES_COMPLETE_GUIDE.md** - Output styles, personality customization
5. **CLAUDE_CODE_HOOKS_GUIDE.md** - Lifecycle hooks, automation, security
6. **CLAUDE_CODE_HEADLESS_COMPLETE_GUIDE.md** - Headless mode, CI/CD, automation
7. **MCP_COMPREHENSIVE_REFERENCE.md** - Model Context Protocol integration
8. **CLAUDE_CODE_TROUBLESHOOTING_GUIDE.md** - Common issues, debugging, solutions

## Installation

### Option 1: Local Plugin (Recommended for Development)

Already installed! The plugin is in `.claude/plugins/agent-manager/`

### Option 2: Link to Project

To use across projects:

```bash
# Create symlink in Claude Code user plugins directory
ln -s "$(pwd)/.claude/plugins/agent-manager" ~/.claude/plugins/agent-manager
```

## Usage

### Method 1: Use the Skill

```bash
# Trigger the agent-management skill
"Create a new code reviewer agent"
"Configure agent for my project"
"Build an agent to generate documentation"
```

The skill auto-activates on keywords like:
- create agent
- new agent
- configure agent
- manage agent

### Method 2: Use the Command

```bash
# Interactive agent creation
/create-agent

# Create specific agent
/create-agent code-reviewer
```

### Method 3: Use the Agent Creator Agent

```typescript
// In Claude Code session
Use Task tool with:
{
  subagent_type: "agent-creator",
  prompt: "Create a code review agent for our React project"
}
```

## Quick Start: Create Your First Agent

### Example 1: Code Reviewer for Marie's Dance Project

Let's enhance Marie with a choreography reviewer:

```bash
# 1. Trigger the creation skill
"Create an agent to review dance choreography"

# 2. Answer questions:
# - Purpose: Review choreography for safety, flow, and musicality
# - Domain: Dance education and choreography
# - Tools: Read (to read choreography files)
# - Personality: Supportive, encouraging, specific feedback
# - Model: Sonnet

# 3. Files generated:
# .claude/agents/choreography-reviewer.md
# .claude/output-styles/choreography-reviewer.md
```

### Example 2: Marketing Content Generator for Fabien

```bash
# 1. Use the command
/create-agent marketing-content

# 2. Select:
# - Type: Custom
# - Description: Create compelling marketing content and social media posts
# - Model: Sonnet
# - Tools: Read, Write, WebSearch
# - Output Style: Yes (creative, enthusiastic)

# 3. Test it:
Use Task tool with subagent_type="marketing-content"
```

### Example 3: Security Auditor for Anga

```bash
# 1. Trigger skill
"Build a security audit agent"

# 2. Configure:
# - Type: Security Auditor
# - Model: Sonnet
# - Tools: Read, Grep, Glob, Bash
# - Focus: OWASP Top 10, dependency vulnerabilities
# - Output Style: Technical, specific, actionable

# 3. Generated agent can:
# - Scan for security vulnerabilities
# - Check dependencies for CVEs
# - Review authentication/authorization
# - Identify injection vulnerabilities
```

## Capabilities

### Agent Creation

The plugin helps create:

1. **Specialized Sub-agents** - Expert agents for specific domains
2. **Output Styles** - Custom personalities and communication styles
3. **Skills** - Reusable capabilities with progressive disclosure
4. **Complete Packages** - Integrated agents with all components

### Templates Included

- Code Reviewer
- Documentation Generator  
- Test Creator
- Debugger
- Performance Optimizer
- Security Auditor
- API Developer
- Data Analyst
- Custom (start from scratch)

### Best Practices Built-In

- Progressive disclosure (500-line rule)
- Proper tool configuration
- Permission modes
- YAML frontmatter validation
- Testing checklist
- Documentation standards

## Enhancing Marie

To add capabilities to Marie (dance teaching expert), you can:

### 1. Create Specialized Sub-Agents

```bash
# Student evaluation agent
/create-agent student-evaluator

# Choreography reviewer agent  
/create-agent choreography-reviewer

# Music selection assistant
/create-agent music-selector

# Progress tracking agent
/create-agent progress-tracker
```

### 2. Add Skills

Create reusable skills for Marie:

```yaml
---
name: dance-terminology
description: Expert in dance terminology across styles (ballet, jazz, contemporary)
triggers:
  keywords:
    - dance term
    - terminology
    - definition
---

# Dance Terminology Skill

[Progressive disclosure of dance terminology knowledge]
```

### 3. Configure Hooks

Add automation to Marie's workflow:

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Write",
      "hooks": [{
        "type": "command",
        "command": ".claude/hooks/notify-students.sh"
      }]
    }]
  }
}
```

### 4. Integrate MCP Servers

Connect Marie to external dance resources:

```json
{
  "mcpServers": {
    "dance-library": {
      "command": "npx",
      "args": ["-y", "dance-library-mcp"],
      "env": {
        "API_KEY": "your-key-here"
      }
    }
  }
}
```

## Example: Complete Agent Package

Here's what gets created for a "Student Evaluator" agent:

### 1. Agent Definition
`.claude/agents/student-evaluator.md`:
```yaml
---
name: Student Evaluator
description: Evaluate dance students with constructive feedback
model: sonnet
tools:
  - Read
  - Write
permissions: default
skills:
  - dance-terminology
  - feedback-guidelines
---

# Student Evaluator

Provide constructive evaluation of dance students.

## Evaluation Criteria

1. **Technical Execution** - Alignment, posture, precision
2. **Musicality** - Timing, rhythm, interpretation
3. **Artistry** - Expression, performance quality
4. **Progress** - Improvement over time

## Feedback Format

- Specific observations
- Actionable suggestions
- Celebration of strengths
- Clear next steps
```

### 2. Output Style
`.claude/output-styles/student-evaluator.md`:
```yaml
---
name: Student Evaluator
description: Supportive dance teacher providing constructive evaluation
keep-coding-instructions: false
---

# Supportive Dance Evaluator

Encouraging, specific, and constructive feedback style.

## Tone

- Warm and supportive 🩰
- Specific and detailed
- Celebrating progress
- Clear guidance for improvement

## Format

**Strengths**: What the student does well
**Areas for Growth**: Specific improvements
**Action Steps**: Clear next steps
**Encouragement**: Positive closing
```

### 3. Usage Documentation
`docs/agents/student-evaluator.md`:
```markdown
# Student Evaluator Agent

## Purpose
Evaluate dance students with constructive, specific feedback.

## Invocation
Use Task tool: `subagent_type: "student-evaluator"`

## Example
"Evaluate Sarah's ballet performance from video transcript"
```

## Testing Your Agents

### Validation Checklist

After creating an agent:

- [ ] YAML frontmatter is valid
- [ ] Agent file exists in `.claude/agents/`
- [ ] Tools are configured in settings.json
- [ ] Output style created (if custom personality)
- [ ] Test invocation works
- [ ] Example prompts tested
- [ ] Documentation updated
- [ ] Added to version control

### Test Commands

```bash
# Validate YAML
cat .claude/agents/my-agent.md | python3 -c "import yaml, sys; yaml.safe_load(sys.stdin)"

# Test agent
claude
# Then: Use Task tool with your agent

# Headless test
claude -p "Use my-agent to review this code" --output-format json
```

## Advanced Usage

### Multi-Agent Workflows

Create orchestrator agents that coordinate specialists:

```yaml
---
name: Dance Program Manager
description: Coordinates student evaluation, curriculum planning, and progress tracking
model: sonnet
tools:
  - Task
  - Read
  - Write
---

# Dance Program Manager

Orchestrate multiple specialist agents:

1. **Student Evaluator** - Assess performance
2. **Progress Tracker** - Monitor improvement
3. **Curriculum Planner** - Adjust lesson plans
4. **Music Selector** - Choose appropriate music
```

### Resumable Agents

For long-running tasks:

```yaml
---
name: Curriculum Developer
description: Develop comprehensive dance curriculum over multiple sessions
resumable: true
model: sonnet
---
```

### MCP Integration

Create agents that use external services:

```yaml
---
name: Music Library Agent
description: Search and recommend music from external library
model: sonnet
tools:
  - mcp__music_library__search
  - mcp__music_library__get_details
  - Read
  - Write
---
```

## Troubleshooting

### Agent Not Found
**Solution**: Check `.claude/agents/` directory and YAML frontmatter

### Tools Not Available
**Solution**: Add to `allowedTools` in `.claude/settings.json`

### Wrong Personality
**Solution**: Separate personality (output style) from instructions (agent definition)

### Context Too Large
**Solution**: Use progressive disclosure - start minimal, expand when needed

## Next Steps

1. **Explore Templates** - Check `.claude/plugins/agent-manager/agents/agent-creator.md`
2. **Read Documentation** - Full guides in `/docs/`
3. **Create First Agent** - Use `/create-agent` command
4. **Test Thoroughly** - Use validation checklist
5. **Iterate** - Improve based on usage

## Resources

### Plugin Files
- Plugin manifest: `.claude/plugins/agent-manager/plugin.json`
- Agent creator: `.claude/plugins/agent-manager/agents/agent-creator.md`
- Management skill: `.claude/plugins/agent-manager/skills/agent-management/SKILL.md`
- Create command: `.claude/plugins/agent-manager/commands/create-agent.md`

### Documentation
- `/docs/CLAUDE_CODE_SUBAGENTS_COMPLETE_GUIDE.md` - Complete sub-agent reference
- `/docs/CLAUDE_CODE_OUTPUT_STYLES_COMPLETE_GUIDE.md` - Output styles guide
- `/docs/CLAUDE_CODE_SKILLS_COMPLETE_GUIDE.md` - Skills framework
- `/docs/CLAUDE_CODE_PLUGINS_COMPLETE_GUIDE.md` - Plugin development
- Plus 4 more comprehensive guides in `/docs/`

### Examples
- Current project agents: `.claude/agents/`
- Marie's output style: `core/output-styles/marie.md`
- Anga's output style: `core/output-styles/anga.md`
- Fabien's output style: `core/output-styles/fabien.md`

---

**Ready to create powerful agents!** 🚀

Start with `/create-agent` or trigger the skill with "create a new agent"
