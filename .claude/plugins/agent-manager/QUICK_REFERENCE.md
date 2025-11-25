# Agent Manager Plugin - Quick Reference

## Commands

### /create-agent [name]
Create new agent with interactive wizard

**Examples**:
```bash
/create-agent                    # Interactive mode
/create-agent code-reviewer      # Create with name
```

**What it does**:
1. Asks agent type (Code Reviewer, Docs, Testing, etc.)
2. Configures model, tools, permissions
3. Creates agent files
4. Adds to settings.json

**Output**:
- `.claude/agents/{name}.md`
- `.claude/output-styles/{name}.md` (if custom personality)
- Updates `.claude/settings.json`

---

### /list-agents [filter]
Show all available agents

**Examples**:
```bash
/list-agents                     # All agents
/list-agents --detailed          # Full configuration
/list-agents --by-model          # Group by model
/list-agents project             # Project agents only
```

**Filters**:
- `--detailed` - Include full config
- `--by-model` - Group by Haiku/Sonnet/Opus
- `--by-domain` - Group by purpose
- `project` - Only `.claude/agents/`
- `user` - Only `~/.claude/agents/`
- `plugin` - Plugin-provided agents

**Output**:
```
Available Agents (3):
1. code-reviewer [sonnet]
   Tools: Read, Grep, Glob
2. student-evaluator [sonnet]
   Tools: Read, Write
3. docs-generator [sonnet]
   Tools: Read, Write, Grep, Glob
```

---

### /update-agent [name]
Update existing agent configuration

**Examples**:
```bash
/update-agent code-reviewer      # Interactive update
```

**What you can update**:
1. **Tools** - Add: Write, Edit, Bash, WebFetch, WebSearch, Task
2. **Model** - Change: Haiku ↔ Sonnet ↔ Opus
3. **Instructions** - Modify behavior and guidelines
4. **Output Style** - Update personality and tone
5. **Skills** - Add integrated skills
6. **Full Upgrade** - Apply latest best practices

**Interactive prompts**:
```
What to update?
1. Add Tools
2. Remove Tools
3. Change Model
4. Update Instructions
5. Update Output Style
6. Add Skills
7. Full Upgrade

Choose: 1 (Add Tools)
Which tools? Write, Edit
```

**Safety**:
- Creates backup before changes
- Validates YAML syntax
- Tests agent loads
- Offers rollback if issues

---

## Natural Language Triggers

The `agent-management` skill auto-loads on these keywords:

### Creation
```
"create agent"
"create a new agent"
"I need to create agent for testing"
"build an agent to review code"
```

### Listing
```
"list agents"
"list all agents"
"show available agents"
"what agents do I have"
```

### Updating
```
"update agent"
"update my code-reviewer"
"upgrade student-evaluator"
"modify agent configuration"
```

---

## Common Workflows

### 1. Create → Test → Use
```bash
# Create
/create-agent code-reviewer

# Test configuration
cat .claude/agents/code-reviewer.md

# Use
Task(subagent_type="code-reviewer", prompt="Review this code...")
```

### 2. List → Select → Update
```bash
# See what exists
/list-agents

# Update specific agent
/update-agent code-reviewer

# Add tools: Write, Edit
```

### 3. Create Multiple → List → Organize
```bash
# Create several agents
/create-agent reviewer
/create-agent tester
/create-agent docs

# See all
/list-agents --by-domain
```

---

## Invocation Patterns

### Direct Command
```bash
/create-agent my-agent
/list-agents --detailed
/update-agent my-agent
```

### Natural Language
```
"create a new agent"
→ Skill loads, guides creation

"list all my agents"
→ Skill loads, shows agents

"update code-reviewer agent"
→ Skill loads, guides update
```

### Sub-Agent Call
```typescript
Task(
  subagent_type="agent-creator",
  prompt="Create security auditor agent with OWASP focus"
)
```

---

## File Locations

### Plugin Structure
```
.claude/plugins/agent-manager/
├── .claude-plugin/
│   └── plugin.json
├── commands/
│   ├── create-agent.md
│   ├── list-agents.md
│   └── update-agent.md
├── skills/
│   └── agent-management/
│       └── SKILL.md
├── agents/
│   └── agent-creator.md
└── hooks/
    └── hooks.json
```

### Generated Files
```
.claude/agents/
├── code-reviewer.md
├── student-evaluator.md
└── docs-generator.md

.claude/output-styles/
├── code-reviewer.md
├── student-evaluator.md
└── docs-generator.md

.claude/settings.json (updated with tool permissions)
```

---

## Quick Examples

### Create Dance Student Evaluator
```bash
/create-agent student-evaluator

Type: Custom
Description: Evaluate dance students with constructive feedback
Model: sonnet
Tools: Read, Write
Personality: Supportive and encouraging

✅ Created student-evaluator
```

### List All Agents
```bash
/list-agents

1. code-reviewer [sonnet]
2. student-evaluator [sonnet]
3. docs-generator [sonnet]
```

### Update Agent with New Tools
```bash
/update-agent code-reviewer

What to update? Add Tools
Which tools? Write, Edit

✅ Updated code-reviewer
   Added: Write, Edit
```

### Use Agent
```typescript
Task(
  subagent_type="student-evaluator",
  prompt="Evaluate Sarah's ballet performance: [details]"
)
```

---

## Tips

1. **Use /list-agents first** - See what exists before creating duplicates
2. **Start with templates** - Faster than custom agents
3. **Test after creation** - Verify agent works: `Task(subagent_type="name")`
4. **Update incrementally** - Add one tool/feature at a time
5. **Check settings.json** - Ensure tools are allowed
6. **Use natural language** - Triggers work better than you think!

---

## Troubleshooting

### Agent not found
```bash
# Verify exists
ls -la .claude/agents/my-agent.md

# Check plugin loaded
/list-agents
```

### Tools not available
```bash
# Add to settings.json
{
  "allowedTools": ["Read", "Write", "Edit"]
}
```

### Skill not triggering
```bash
# Use exact keywords
"create agent"  ✓
"create an agent"  ✓
"make agent"  ✗ (no trigger)
```

---

**Ready to manage agents!** 🚀

Start with: `/create-agent` or "create a new agent"
