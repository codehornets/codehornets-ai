# CodeHornets AI - Orchestrator Configuration

This file should be copied to the orchestrator's `.claude` directory as `CLAUDE.md` to configure the orchestrator agent with the appropriate system prompt.

## Setup Instructions

1. Copy the orchestrator prompt:
   ```bash
   cp prompts/orchestrator.md shared/auth-homes/orchestrator/CLAUDE.md
   ```

2. Configure hooks for the orchestrator:
   ```bash
   cp hooks-config/orchestrator-hooks.json shared/auth-homes/orchestrator/hooks.json
   ```

3. Start the orchestrator container:
   ```bash
   docker-compose -f docker-compose.hooks.yml up orchestrator
   ```

## System Prompt

The orchestrator uses the prompt from `prompts/orchestrator.md` which defines:

- Role and responsibilities as a task coordinator
- Communication protocols with worker agents
- Task creation and monitoring procedures
- Error handling strategies

## Hooks Configuration

The orchestrator is configured with the following hooks:

### Lifecycle Hooks
- **session_start**: Initialize session and load system prompt
- **user_prompt_submit**: Log user requests for task decomposition
- **tool_execution_start/end**: Track tool usage
- **assistant_response**: Update heartbeat after responses

### File Watchers
- **result_watcher**: Monitor worker result files
- **task_trigger_watcher**: Watch for external trigger files

### Custom Hooks
- **stop**: (Optional) Create tasks on stop events

## Directory Structure

The orchestrator expects the following shared directory structure:

```
shared/
├── auth-homes/orchestrator/    # Orchestrator's .claude config
├── tasks/                      # Task files for workers
│   ├── marie/
│   ├── anga/
│   └── fabien/
├── results/                    # Results from workers
│   ├── marie/
│   ├── anga/
│   └── fabien/
├── triggers/orchestrator/      # External trigger files
├── heartbeats/                 # Agent heartbeat files
├── pipes/                      # Named pipes for IPC
└── watcher-logs/              # Watcher log files
```

## Usage

Once configured, the orchestrator will:

1. Monitor incoming user requests
2. Break down tasks into worker assignments
3. Create task files in worker task directories
4. Monitor worker heartbeats and results
5. Aggregate results and provide final outputs

## Worker Agents

- **Marie** 🩰: Dance Teacher Assistant - Student evaluations, class documentation, choreography organization
- **Anga** 💻: Coding Assistant - Software development (all languages/frameworks), code reviews, architecture design
- **Fabien** 📈: Marketing Assistant - Campaign creation, content marketing, social media, SEO, email marketing
