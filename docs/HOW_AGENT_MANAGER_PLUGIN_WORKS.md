# How the Agent Manager Plugin Works

## Architecture Overview

The plugin integrates with Claude Code through 4 component types:

```
Claude Code Session
       ↓
   Loads Plugin
       ↓
   ┌─────────────────────────────────────┐
   │  Agent Manager Plugin               │
   │                                     │
   │  1. Skills (auto-trigger)           │
   │  2. Commands (slash invocation)     │
   │  3. Agents (Task tool)              │
   │  4. Hooks (lifecycle events)        │
   └─────────────────────────────────────┘
```

---

## 1. Plugin Loading

### When Claude Code Starts

```
1. Claude Code scans: .claude/plugins/*/
2. Reads: .claude-plugin/plugin.json from each plugin
3. Registers components:
   - Skills → Trigger system
   - Commands → /command-name
   - Agents → Task tool subagent_type
   - Hooks → Event handlers
```

### Plugin Manifest

**File**: `.claude-plugin/plugin.json`

```json
{
  "name": "agent-manager",
  "components": {
    "agents": ["agents/*.md"],        // Glob pattern
    "skills": ["skills/*/SKILL.md"],  // Finds SKILL.md in subdirs
    "commands": ["commands/*.md"]     // All .md in commands/
  }
}
```

**What happens**:
- `agents/*.md` → Registers `agent-creator` as available sub-agent
- `skills/*/SKILL.md` → Registers `agent-management` skill with triggers
- `commands/*.md` → Registers `/create-agent` command

---

## 2. Skills (Auto-Trigger System)

### How Skill Triggers Work

**File**: `skills/agent-management/SKILL.md`

```yaml
---
triggers:
  keywords:
    - create agent
    - new agent
  intentPatterns:
    - "(?i)create.*agent"
    - "(?i)build.*agent"
  filePaths:
    - "**/.claude/agents/*.md"
---
```

### Trigger Types

#### A. Keyword Triggers
**Activates when**: User message contains exact keywords

```
User: "create agent for code review"
       ↓
Contains "create agent" keyword
       ↓
Skill loads automatically
```

#### B. Intent Pattern Triggers (Regex)
**Activates when**: User message matches regex pattern

```
User: "I want to build an agent"
       ↓
Matches "(?i)build.*agent" pattern
       ↓
Skill loads automatically
```

#### C. File Path Triggers
**Activates when**: User opens/edits matching file

```
User opens: .claude/agents/my-agent.md
       ↓
Matches "**/.claude/agents/*.md" pattern
       ↓
Skill loads automatically
```

### What Happens When Skill Triggers

```
1. User types: "create a new agent"
       ↓
2. Claude Code matches: "create agent" keyword
       ↓
3. Loads: skills/agent-management/SKILL.md
       ↓
4. Appends skill content to system prompt
       ↓
5. Claude responds with skill knowledge
```

**Under the hood**:
```
System Prompt = Base Instructions + SKILL.md content
```

### Progressive Disclosure

Skills use the **500-line rule**:

```markdown
# Quick Start (Always visible)
Brief overview and common usage

## Details (Shown when needed)
More detailed information

## Advanced (Only when relevant)
Complex patterns and edge cases
```

**Benefit**: Keeps context small, expands only when necessary

---

## 3. Slash Commands

### How Commands Work

**File**: `commands/create-agent.md`

```markdown
---
description: Create a new Claude Code agent with interactive template selection
---

# Create Agent Command

[Instructions for Claude on what to do]
```

### Invocation Flow

```
User types: /create-agent code-reviewer
       ↓
Claude Code matches: /create-agent command
       ↓
Loads: commands/create-agent.md
       ↓
Expands to: Full prompt with instructions
       ↓
Claude executes: Following command's instructions
```

**Example**:

User input:
```
/create-agent
```

What Claude sees:
```
Create a new Claude Code agent with interactive template selection.

# Create Agent Command

Create a new specialized Claude Code agent following best practices.

## Usage
/create-agent [agent-name]

[... full command content ...]
```

### Arguments

Commands support `$ARGUMENTS`:

```
/create-agent my-agent-name
              ↑
              This becomes $ARGUMENTS
```

In command file:
```markdown
The agent name is: $ARGUMENTS
```

---

## 4. Sub-Agents (Task Tool)

### How Agent Components Work

**File**: `agents/agent-creator.md`

```yaml
---
name: Agent Creator
description: Create specialized Claude Code sub-agents
model: sonnet
tools:
  - Read
  - Write
  - Edit
---

# Instructions for the agent
[What the agent does]
```

### Invocation Flow

```
User or Claude uses Task tool:
{
  subagent_type: "agent-creator",
  prompt: "Create a code review agent"
}
       ↓
Claude Code finds: agents/agent-creator.md
       ↓
Creates new context window with:
  - Agent instructions (from .md file)
  - Specified tools only
  - Model specified (sonnet)
       ↓
Agent executes independently
       ↓
Returns result to parent
```

### Context Isolation

```
Parent Claude Session
  ├─> Task(agent-creator)
  │     └─> New isolated context
  │           - Only sees agent-creator.md instructions
  │           - Only has specified tools
  │           - Independent conversation
  │     ↓
  │   Completes and returns
  │     ↓
  └─> Receives result
```

**Key point**: Sub-agents don't share context with parent. Clean slate each invocation.

---

## 5. Hooks (Lifecycle Events)

### How Hooks Work

**File**: `hooks/hooks.json`

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": "",
        "hooks": [{
          "type": "command",
          "command": "echo '✅ Plugin Loaded' >&2"
        }]
      }
    ]
  }
}
```

### Execution Flow

```
User submits prompt
       ↓
Before Claude processes:
  Hook runs: echo '✅ Plugin Loaded' >&2
       ↓
Hook completes (exit 0)
       ↓
Claude processes prompt normally
```

### Available Hook Events

| Event | When | Can Block |
|-------|------|-----------|
| SessionStart | Session begins | No |
| UserPromptSubmit | User sends message | Yes |
| PreToolUse | Before tool executes | Yes |
| PostToolUse | After tool executes | Yes* |
| Stop | Agent finishes | Yes |

*Tool already executed, but can block future actions

---

## Complete Usage Flow

### Scenario 1: Using the Skill (Auto-Trigger)

```
┌─────────────────────────────────────┐
│ User: "create a new agent"          │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ Trigger System                      │
│ - Matches keyword: "create agent"   │
│ - Loads: agent-management SKILL.md  │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ Skill Content Added to Context      │
│ - Agent creation workflow           │
│ - Templates available               │
│ - Best practices                    │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ Claude Responds                     │
│ "I'll help you create an agent.     │
│  What type do you need?"            │
│ - Lists templates                   │
│ - Asks configuration questions      │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ User: "Code reviewer"               │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ Claude Creates Files                │
│ - Uses Write tool                   │
│ - Creates .claude/agents/code-      │
│   reviewer.md                       │
│ - Creates output style if needed    │
│ - Updates settings.json             │
└─────────────────────────────────────┘
```

### Scenario 2: Using Slash Command

```
┌─────────────────────────────────────┐
│ User: /create-agent                 │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ Command System                      │
│ - Matches: /create-agent            │
│ - Loads: commands/create-agent.md   │
│ - Expands to full prompt            │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ Claude Receives Expanded Prompt     │
│ "Create a new specialized Claude    │
│  Code agent following best           │
│  practices..."                      │
│ [Full command instructions]         │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ Claude Uses AskUserQuestion         │
│ - Agent Type?                       │
│ - Model?                            │
│ - Tools?                            │
│ - Custom personality?               │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ User Answers Questions              │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ Claude Generates Files              │
│ Based on template and answers       │
└─────────────────────────────────────┘
```

### Scenario 3: Using Sub-Agent Directly

```
┌─────────────────────────────────────┐
│ Claude or User Calls Task Tool     │
│ Task(                               │
│   subagent_type="agent-creator",    │
│   prompt="Create security agent"    │
│ )                                   │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ New Context Window Created          │
│ - Loads: agents/agent-creator.md    │
│ - Tools: Read, Write, Edit, Bash    │
│ - Model: Sonnet                     │
│ - Isolated from parent              │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ Agent Creator Executes              │
│ - Reads indexed documentation       │
│ - Asks clarifying questions         │
│ - Generates agent files             │
│ - Tests configuration               │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ Returns Result to Parent            │
│ "Created security-auditor agent:    │
│  - .claude/agents/security-         │
│    auditor.md                       │
│  - Configured tools                 │
│  - Ready to test"                   │
└─────────────────────────────────────┘
```

---

## Technical Details

### Skill Loading Mechanism

```python
# Pseudo-code of what Claude Code does

def load_plugin_skills(plugin_dir):
    manifest = read_json(f"{plugin_dir}/.claude-plugin/plugin.json")

    for pattern in manifest["components"]["skills"]:
        skill_files = glob(f"{plugin_dir}/{pattern}")

        for skill_file in skill_files:
            skill = parse_skill(skill_file)

            # Register triggers
            for keyword in skill.triggers.keywords:
                register_keyword_trigger(keyword, skill)

            for pattern in skill.triggers.intentPatterns:
                register_regex_trigger(pattern, skill)

            for path in skill.triggers.filePaths:
                register_path_trigger(path, skill)

def on_user_message(message):
    # Check all registered triggers
    matched_skills = []

    for skill in registered_skills:
        if matches_keyword(message, skill.keywords):
            matched_skills.append(skill)
        elif matches_regex(message, skill.patterns):
            matched_skills.append(skill)

    # Load matched skills into context
    for skill in matched_skills:
        append_to_system_prompt(skill.content)
```

### Command Expansion

```python
def process_slash_command(command_text):
    # Parse: /create-agent my-agent
    parts = command_text.split(" ", 1)
    command_name = parts[0]  # "/create-agent"
    arguments = parts[1] if len(parts) > 1 else ""  # "my-agent"

    # Find command file
    command_file = find_command_file(command_name)

    # Read and expand
    content = read_file(command_file)
    expanded = content.replace("$ARGUMENTS", arguments)

    # Create special message
    return {
        "role": "user",
        "content": expanded
    }
```

### Sub-Agent Execution

```python
def invoke_subagent(subagent_type, prompt):
    # Find agent definition
    agent_file = find_agent_file(subagent_type)
    agent_config = parse_yaml_frontmatter(agent_file)

    # Create isolated context
    context = {
        "model": agent_config.model,
        "tools": agent_config.tools,
        "system_prompt": read_agent_instructions(agent_file),
        "conversation_history": []  # Fresh start
    }

    # Execute with prompt
    response = execute_claude_session(
        context=context,
        user_prompt=prompt
    )

    # Return result to parent
    return response
```

---

## Practical Examples

### Example 1: Keyword Trigger in Action

**User input**:
```
"I need to create agent for reviewing code"
```

**What happens**:
1. Keyword match: "create agent" ✓
2. Load skill: `agent-management/SKILL.md`
3. System prompt now includes:
   ```
   [Base Claude Code instructions]

   [Agent Management Skill content:]
   Complete toolkit for managing Claude Code agents...

   ## Agent Creation Workflow
   ### Step 1: Define Requirements
   [etc...]
   ```
4. Claude responds with skill knowledge

### Example 2: Regex Trigger

**User input**:
```
"How do I build an agent to test my code?"
```

**What happens**:
1. Regex match: `(?i)build.*agent` ✓
2. Loads same skill
3. Claude has all agent creation knowledge

### Example 3: File Path Trigger

**User opens**:
```
.claude/agents/my-agent.md
```

**What happens**:
1. File path match: `**/.claude/agents/*.md` ✓
2. Skill loads automatically
3. Claude ready to help with agent editing

### Example 4: Command with Arguments

**User types**:
```
/create-agent security-auditor
```

**Command file receives**:
```
$ARGUMENTS = "security-auditor"
```

**Command can use it**:
```markdown
Creating agent named: $ARGUMENTS

The agent will be saved to: .claude/agents/$ARGUMENTS.md
```

### Example 5: Sub-Agent Chain

**Parent Claude**:
```typescript
// User asks to create an agent
// Parent delegates to specialist

Task({
  subagent_type: "agent-creator",
  prompt: "Create a code review agent with security focus"
})
```

**agent-creator sub-agent**:
```
[New isolated session]
- Reads documentation
- Asks questions if needed
- Generates files
- Returns: "Created security-focused code-reviewer"
```

**Parent receives**:
```
"The agent-creator successfully created your agent.
 Files created:
 - .claude/agents/code-reviewer.md
 - .claude/output-styles/code-reviewer.md"
```

---

## Configuration Files

### Plugin Discovery

Claude Code looks in these locations:
```
1. ~/.claude/plugins/*/              # User-level (all projects)
2. .claude/plugins/*/                # Project-level
3. /path/to/plugin/                  # Direct path (advanced)
```

Each must have:
```
plugin-name/
  └── .claude-plugin/
      └── plugin.json
```

### Component Registration

```json
{
  "components": {
    "agents": ["agents/*.md"],        // All .md in agents/
    "skills": ["skills/*/SKILL.md"],  // SKILL.md in skill subdirs
    "commands": ["commands/*.md"],    // All .md in commands/
    "hooks": ["hooks/hooks.json"]     // Hook configuration
  }
}
```

Glob patterns supported:
- `*.md` - All .md files
- `*/SKILL.md` - SKILL.md in any subdir
- `**/*.md` - Recursive .md files

---

## Performance & Context Management

### Skill Loading (Minimal Impact)

```
Skills only load when triggered
   ↓
Not added to every conversation
   ↓
Keeps context small
```

### Progressive Disclosure

```
Initial load: ~200 lines (overview)
   ↓
User needs details
   ↓
Shows: ~300 more lines (details)
   ↓
User needs advanced
   ↓
Shows: ~400 more lines (advanced)
```

**Total**: 900 lines, but loaded progressively

### Sub-Agent Isolation

```
Parent context: 50,000 tokens used
   ↓
Spawns sub-agent
   ↓
Sub-agent context: 0 tokens (fresh start)
   ↓
Sub-agent completes: 5,000 tokens used
   ↓
Returns to parent: +500 tokens (just result)
```

**Benefit**: Sub-agents don't inherit parent's context bloat

---

## Debugging

### Check Plugin Loaded

```bash
# List loaded plugins
ls -la .claude/plugins/

# Verify structure
ls -la .claude/plugins/agent-manager/.claude-plugin/plugin.json
```

### Test Skill Trigger

```bash
# Start Claude Code
claude

# Type trigger keyword
"create agent"

# Should see skill activate
```

### Test Command

```bash
# In Claude Code session
/create-agent

# Should expand command prompt
```

### Test Sub-Agent

```typescript
// Use Task tool
Task({
  subagent_type: "agent-creator",
  prompt: "Test"
})

// Should invoke agent
```

### Verbose Mode

```bash
# See what's loading
claude --verbose

# See all skill triggers
# See all command expansions
# See all plugin registrations
```

---

## Summary: Component Interaction

```
User Action
    ↓
┌───────────────────────────────────┐
│ Trigger System                    │
│ - Keywords                        │
│ - Regex patterns                  │
│ - File paths                      │
│ - Slash commands                  │
└───────────────────────────────────┘
    ↓
┌───────────────────────────────────┐
│ Component Loader                  │
│ - Skills → Append to system       │
│ - Commands → Expand to prompt     │
│ - Agents → Spawn sub-agent        │
│ - Hooks → Run lifecycle scripts   │
└───────────────────────────────────┘
    ↓
┌───────────────────────────────────┐
│ Claude Processes with Plugin      │
│ Knowledge & Capabilities          │
└───────────────────────────────────┘
```

---

**The plugin is modular**: Each component works independently, but they complement each other to provide a complete agent management system.
