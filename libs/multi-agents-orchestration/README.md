# CodeHornets AI - Multi-Agent Orchestration System

A Docker-based multi-agent AI system using Claude Code with one orchestrator and three specialized worker agents.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Orchestrator                           │
│  (Task Decomposition, Delegation, Result Aggregation)      │
└────────────────┬────────────────┬─────────────┬────────────┘
                 │                │             │
         ┌───────▼──────┐  ┌──────▼──────┐  ┌──▼──────────┐
         │    Marie     │  │    Anga     │  │   Fabien    │
         │  (Frontend)  │  │  (Backend)  │  │  (DevOps)   │
         └──────────────┘  └─────────────┘  └─────────────┘
```

## Components

### Orchestrator
- Receives high-level tasks from users
- Breaks down tasks into subtasks
- Delegates to appropriate workers
- Monitors progress and aggregates results

### Worker Agents
- **Marie** 🩰: Dance Teacher Assistant - Student evaluations, class documentation, choreography organization, studio management
- **Anga** 💻: Coding Assistant - Software development (all languages/frameworks), code reviews, bug fixing, architecture design, testing
- **Fabien** 📈: Marketing Assistant - Campaign creation, content marketing, social media, SEO, email marketing, analytics

## Directory Structure

```
codehornets-ai/infrastructure/docker/codehornets-ai-hooks/
├── docker-compose.hooks.yml       # Docker Compose configuration
├── CLAUDE.md                      # Setup documentation
├── README.md                      # This file
├── prompts/
│   └── orchestrator.md           # Orchestrator system prompt
├── hooks-config/
│   └── orchestrator-hooks.json   # Hook configuration
├── tools/
│   ├── entrypoint.sh             # Worker container initialization
│   ├── orchestrator_entrypoint.sh # Orchestrator initialization
│   ├── monitor_daemon.py         # System monitoring daemon
│   ├── create_worker_task.py     # Task creation CLI tool
│   ├── archive_task.py           # Task archiving tool
│   ├── wake_worker.sh            # Worker activation script
│   └── helpers/                  # Supporting scripts (9 files)
│       ├── setup/                # Setup (1): auto-theme-select.sh
│       ├── tasks/                # Task management (3): create/test/reset
│       └── monitoring/           # Monitoring (5): hooks, watchers, notifications
└── shared/                       # Runtime artifacts (mounted volumes)
    ├── auth-homes/               # Per-agent .claude configurations
    │   ├── orchestrator/
    │   ├── marie/
    │   ├── anga/
    │   └── fabien/
    ├── tasks/                    # Task files for workers
    │   ├── marie/
    │   ├── anga/
    │   └── fabien/
    ├── results/                  # Result files from workers
    │   ├── marie/
    │   ├── anga/
    │   └── fabien/
    ├── heartbeats/              # Agent health status (JSON)
    ├── triggers/                # External trigger files
    │   ├── orchestrator/
    │   ├── marie/
    │   ├── anga/
    │   └── fabien/
    ├── pipes/                   # Named pipes for IPC
    ├── watcher-logs/           # Log files
    └── workspaces/             # Agent working directories
        ├── marie/
        ├── anga/
        └── fabien/
```

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Claude Code with active web session

### Setup

1. **Ensure you're authenticated with Claude Code**
   - Web session authentication is used (no API key needed)

2. **Configure the orchestrator:**
   ```bash
   cd codehornets-ai/infrastructure/docker/codehornets-ai-hooks

   # Copy orchestrator prompt to its .claude directory
   cp prompts/orchestrator.md shared/auth-homes/orchestrator/CLAUDE.md

   # Copy hooks configuration
   cp hooks-config/orchestrator-hooks.json shared/auth-homes/orchestrator/hooks.json
   ```

3. **Start all agents:**
   ```bash
   docker-compose -f docker-compose.hooks.yml up
   ```

4. **Start individual agents:**
   ```bash
   # Just the orchestrator
   docker-compose -f docker-compose.hooks.yml up orchestrator

   # Specific worker
   docker-compose -f docker-compose.hooks.yml up marie
   ```

5. **View logs:**
   ```bash
   # All agents
   docker-compose -f docker-compose.hooks.yml logs -f

   # Specific agent
   docker-compose -f docker-compose.hooks.yml logs -f anga
   ```

## Communication Protocol

### Task Creation

The orchestrator creates tasks for workers by writing JSON files:

```bash
python tools/create_worker_task.py anga \
  "Implement user authentication API" \
  "Create REST API endpoints for user login, logout, and session management" \
  --priority high \
  --duration 2h
```

Task file format:
```json
{
  "task_id": "task-abc123def456",
  "title": "Create calculator module",
  "description": "Implement Python calculator with basic arithmetic operations",
  "priority": "high",
  "dependencies": [],
  "estimated_duration": "30m",
  "created_at": "2025-11-19T12:00:00Z",
  "status": "pending",
  "assigned_to": "anga"
}
```

### Result Submission

Workers write results to their result directory:

```json
{
  "task_id": "task-abc123def456",
  "status": "completed",
  "output": "Calculator module implemented successfully",
  "artifacts": ["calculator.py", "test_calculator.py"],
  "completed_at": "2025-11-19T14:30:00Z",
  "notes": "Added all basic arithmetic operations with comprehensive tests"
}
```

### Heartbeat Monitoring

Each agent maintains a heartbeat file:

```json
{
  "agent_name": "anga",
  "status": "busy",
  "last_updated": "2025-11-19T14:15:30Z",
  "current_task": "task-abc123def456",
  "tasks_completed": 42
}
```

## Tools

### create_worker_task.py

CLI tool for creating worker tasks:

```bash
# Basic usage
python tools/create_worker_task.py <worker> <title> <description>

# With options for Marie (dance teaching)
python tools/create_worker_task.py marie \
  "Document ballet class" \
  "Create class notes for Tuesday advanced ballet session" \
  --priority medium \
  --duration 30m \
  --dependencies task-xyz789

# Output as JSON for Fabien (marketing)
python tools/create_worker_task.py fabien \
  "Create email campaign" \
  "Design welcome email sequence for new students" \
  --json
```

### hook_watcher.py

File watcher for monitoring results and triggers:

```bash
# Watch for results (runs automatically in orchestrator)
python tools/helpers/monitoring/hook_watcher.py watch_results orchestrator

# Watch for triggers
python tools/helpers/monitoring/hook_watcher.py watch_triggers orchestrator

# One-shot handlers (called by hooks)
python tools/helpers/monitoring/hook_watcher.py handle_result orchestrator
python tools/helpers/monitoring/hook_watcher.py handle_trigger orchestrator
```

## Hooks System

The orchestrator uses Claude Code hooks to respond to events:

- **session_start**: Initialize session, load system prompt
- **user_prompt_submit**: Log requests, prepare for task decomposition
- **tool_execution_start/end**: Track tool usage for monitoring
- **assistant_response**: Update heartbeat after generating responses
- **stop**: (Optional) Create tasks on stop events

## Monitoring

### Check Agent Status

```bash
# View heartbeats
cat shared/heartbeats/orchestrator.json
cat shared/heartbeats/marie.json
cat shared/heartbeats/anga.json
cat shared/heartbeats/fabien.json

# View logs
tail -f shared/watcher-logs/hook-watcher.log
tail -f shared/watcher-logs/orchestrator.log
```

### Task Status

```bash
# List pending tasks
ls shared/tasks/*/

# List completed results
ls shared/results/*/
```

## Troubleshooting

### Agent Not Starting

1. Check Docker logs:
   ```bash
   docker-compose -f docker-compose.hooks.yml logs orchestrator
   ```

2. Verify API key is set:
   ```bash
   echo $ANTHROPIC_API_KEY
   ```

3. Check file permissions:
   ```bash
   ls -la tools/
   ```

### Tasks Not Being Created

1. Check task directory permissions
2. Verify the orchestrator has write access to `shared/tasks/`
3. Review orchestrator logs in `shared/watcher-logs/`

### Workers Not Receiving Tasks

1. Check worker heartbeats for status
2. Verify task files exist in worker task directories
3. Ensure workers have read access to their task directories

## Advanced Configuration

### Custom Worker Specializations

Edit the orchestrator prompt (`prompts/orchestrator.md`) to define custom worker specializations.

### Adding New Workers

1. Add worker to `docker-compose.hooks.yml`
2. Create directories in `shared/`: `auth-homes/`, `tasks/`, `results/`, `triggers/`, `workspaces/`
3. Update orchestrator prompt with worker specialization
4. Update watchers in `hooks-config/orchestrator-hooks.json`

### Custom Hooks

Add custom hooks to `hooks-config/orchestrator-hooks.json`:

```json
{
  "custom_hook_name": {
    "enabled": true,
    "command": "python /workspace/tools/your_script.py",
    "description": "Your custom hook description"
  }
}
```

## Security Notes

- API keys are passed as environment variables
- Each agent has isolated `.claude` configuration
- Shared volumes use appropriate permissions
- Workers have separate workspaces to prevent conflicts

## License

This is part of the CodeHornets AI project.

## Documentation

- **Quick Start**: [QUICKSTART.md](QUICKSTART.md) - Step-by-step setup guide
- **Testing Guide**: [docs/TESTING_GUIDE.md](docs/TESTING_GUIDE.md) - Comprehensive testing workflows
- **Development Guide**: [docs/DEVELOPMENT_GUIDE.md](docs/DEVELOPMENT_GUIDE.md) - Developer onboarding and workflows
- **Cleanup Guide**: [docs/CLEANUP_GUIDE.md](docs/CLEANUP_GUIDE.md) - Maintenance and cleanup procedures
- **Architecture Notes**: [docs/ARCHITECTURE_NOTES.md](docs/ARCHITECTURE_NOTES.md) - System architecture details

## Support

For issues or questions, please refer to the documentation above or check system status:

```bash
make status      # Check agent status
make heartbeat   # Check health
make logs        # View logs
make help        # Show all available commands
```
