# Agent Manager Plugin - Quick Start

## TL;DR

Plugin gives you 4 ways to create/manage agents:

1. **Just talk**: "create a new agent" → Auto-triggers skill
2. **Slash command**: `/create-agent` → Interactive wizard
3. **Expert mode**: `Task(subagent_type="agent-creator")` → Sub-agent
4. **Auto-pilot**: Hooks run automatically

## 30-Second Demo

```bash
# Method 1: Auto-trigger
"I need to create agent to review code"
→ Skill loads automatically
→ Claude guides you through creation

# Method 2: Slash command
/create-agent code-reviewer
→ Interactive questions
→ Files generated

# Method 3: Sub-agent
Task(subagent_type="agent-creator",
     prompt="Create security auditor")
→ Expert agent takes over
→ Returns complete agent
```

## How It Works (Simple Version)

### Plugin Structure
```
agent-manager/
├── .claude-plugin/plugin.json    ← "I exist!"
├── skills/SKILL.md               ← Auto-loads knowledge
├── commands/create-agent.md      ← /create-agent
└── agents/agent-creator.md       ← Expert sub-agent
```

### Flow Diagram
```
User Input
    ↓
┌───────────────────┐
│ "create agent"    │ ← Keyword trigger
│ /create-agent     │ ← Slash command
│ Task(agent-...)   │ ← Direct call
└───────────────────┘
    ↓
┌───────────────────┐
│ Plugin Routes     │
│ Request to:       │
│ - Skill           │
│ - Command         │
│ - Sub-agent       │
└───────────────────┘
    ↓
┌───────────────────┐
│ Component Loads   │
│ & Executes        │
└───────────────────┘
    ↓
┌───────────────────┐
│ Agent Created!    │
└───────────────────┘
```

## Example Usage

### Create Marie's Student Evaluator

**Step 1**: Trigger the plugin
```
"Create an agent to evaluate dance students"
```

**Step 2**: Answer questions
```
Claude: What type of agent?
You: Student evaluator for dance

Claude: Which model?
You: Sonnet

Claude: Tools needed?
You: Read, Write

Claude: Custom personality?
You: Yes - supportive and encouraging
```

**Step 3**: Files created automatically
```
.claude/agents/student-evaluator.md          ← What it does
.claude/output-styles/student-evaluator.md   ← How it talks
.claude/settings.json                         ← Updated permissions
```

**Step 4**: Use it
```typescript
Task(
  subagent_type="student-evaluator",
  prompt="Evaluate Sarah's ballet performance"
)
```

## Component Breakdown

### 1. Skills (Auto-Trigger)
**Triggers**: Keywords, regex, file paths
**Action**: Loads knowledge into context
**Use case**: Quick help, guided workflows

```
User: "create agent"
  ↓
Keyword match
  ↓
Skill loads → Claude has agent creation knowledge
```

### 2. Commands (Slash)
**Triggers**: `/command-name`
**Action**: Expands to full prompt
**Use case**: Repeatable workflows

```
/create-agent
  ↓
Expands to full instructions
  ↓
Claude follows command steps
```

### 3. Sub-Agents (Task)
**Triggers**: Task tool invocation
**Action**: New isolated context
**Use case**: Complex tasks, delegation

```
Task(subagent_type="agent-creator")
  ↓
New context window
  ↓
Expert agent executes
  ↓
Returns result
```

### 4. Hooks (Lifecycle)
**Triggers**: Events (session start, tool use, etc.)
**Action**: Runs shell commands
**Use case**: Automation, validation

```
Session starts
  ↓
Hook runs script
  ↓
Injects context / validates / logs
```

## Key Concepts

### Progressive Disclosure
Skills start small, grow as needed:
```
First show: Quick overview (200 lines)
User needs more: Show details (300 lines)
Advanced usage: Show everything (400 lines)
```

### Context Isolation
Sub-agents don't inherit parent's context:
```
Parent: 50,000 tokens used
  ↓
Spawn sub-agent
  ↓
Sub-agent: 0 tokens (fresh start)
  ↓
Returns: Only result (minimal tokens)
```

### Component Composition
All components work together:
```
Skill → Provides knowledge
Command → Guides workflow
Sub-agent → Executes complex tasks
Hooks → Automates repetitive tasks
```

## Testing the Plugin

### Verify Installation
```bash
ls -la .claude/plugins/agent-manager/.claude-plugin/plugin.json
```

### Test Each Component

**Skill**:
```
"create a new agent"
→ Should auto-load skill
→ Claude guides you
```

**Command**:
```
/create-agent
→ Should ask questions
→ Creates files
```

**Sub-agent**:
```typescript
Task(subagent_type="agent-creator", prompt="Test")
→ Should spawn agent
→ Returns result
```

**Hook**:
```
Start session
→ Check stderr for: "✅ Agent Manager Plugin Loaded"
```

## Common Patterns

### Pattern 1: Quick Creation
```
User: "create code review agent"
→ Skill guides through creation
→ Files generated
→ Ready to use
```

### Pattern 2: Batch Creation
```
/create-agent reviewer
/create-agent tester
/create-agent docs-generator
→ Create multiple agents quickly
```

### Pattern 3: Complex Creation
```typescript
Task(
  subagent_type="agent-creator",
  prompt="Create agent for Marie: student evaluator
         with progress tracking, constructive feedback,
         and integration with student records"
)
→ Expert handles complexity
→ Returns complete solution
```

## Files Generated

When you create an agent, plugin generates:

```
.claude/agents/{name}.md
  ↓ Agent definition
  ↓ - What it does
  ↓ - How it works
  ↓ - Tools it uses

.claude/output-styles/{name}.md (optional)
  ↓ Personality
  ↓ - Communication style
  ↓ - Response format
  ↓ - Tone and approach

.claude/settings.json (updated)
  ↓ Tool permissions
  ↓ - allowedTools added
  ↓ - Configuration updated

docs/agents/{name}.md (optional)
  ↓ Usage documentation
  ↓ - How to invoke
  ↓ - Examples
  ↓ - Best practices
```

## Next Steps

1. **Try the skill**: "create a new agent"
2. **Try the command**: `/create-agent`
3. **Read full guide**: `HOW_AGENT_MANAGER_PLUGIN_WORKS.md`
4. **Enhance Marie**: Create student-evaluator agent
5. **Explore docs**: `/home/anga/workspace/beta/codehornets-ai/docs/`

## Resources

- **Full technical guide**: `HOW_AGENT_MANAGER_PLUGIN_WORKS.md` (817 lines)
- **Plugin README**: `AGENT_MANAGER_PLUGIN_README.md`
- **Structure reference**: `.claude/plugins/agent-manager/STRUCTURE.md`
- **Documentation index**: `docs/CLAUDE_CODE_*.md` (8 guides)

## Quick Reference

| Want to... | Use... | Syntax |
|------------|--------|--------|
| Get guidance | Skill | "create agent" |
| Interactive wizard | Command | `/create-agent` |
| Complex creation | Sub-agent | `Task(subagent_type="agent-creator")` |
| Automation | Hook | Auto-runs on events |

---

**Ready to create agents!** 🚀

Try: "create an agent to evaluate dance students"
