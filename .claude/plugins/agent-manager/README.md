# Agent Manager Plugin

Comprehensive toolkit for creating and managing Claude Code agents, output styles, skills, and sub-agents.

## Features

- **Agent Creation**: Create specialized sub-agents with best practices
- **Agent Updates**: Modify tools, model, instructions, and configuration
- **Agent Listing**: View all available agents with capabilities
- **Output Style Management**: Design and configure agent personalities
- **Skill Development**: Build reusable skills with progressive disclosure
- **Template Generation**: Quick-start templates for common agent types

## Components

### Agents
- `agent-creator` - Interactive agent creation assistant

### Skills
- `agent-management` - Complete agent lifecycle management (create, list, update, test, deploy)

### Commands
- `/create-agent [name]` - Create new sub-agent with templates
- `/list-agents [filter]` - Show all available agents
- `/update-agent [name]` - Update existing agent configuration
- Test agents: `Task(subagent_type="name", ...)`

## Usage

### Quick Start

```bash
# Create new agent
/create-agent student-evaluator

# List all agents
/list-agents

# Update existing agent
/update-agent student-evaluator

# Use agent
Task(subagent_type="student-evaluator", prompt="Evaluate Sarah's performance")
```

### Natural Language

The skill auto-triggers on keywords:

```
"create a new agent"          → Skill guides creation
"list all agents"             → Shows available agents
"update my code-reviewer"     → Interactive update wizard
"upgrade agent to opus model" → Model upgrade workflow
```

### Command Reference

| Command | Purpose | Example |
|---------|---------|---------|
| `/create-agent` | Create new agent | `/create-agent code-reviewer` |
| `/list-agents` | Show all agents | `/list-agents --detailed` |
| `/update-agent` | Modify agent | `/update-agent my-agent` |

## Documentation

This plugin leverages comprehensive Claude Code documentation:
- Sub-agents architecture
- Plugin system
- Skills framework
- Output styles
- Hooks system
- MCP integration
- Headless automation
