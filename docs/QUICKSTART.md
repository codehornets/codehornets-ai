# Quick Start Guide

Get your multi-agent orchestration system running in 4 steps!

## Prerequisites

- Docker installed and running
- Make (usually pre-installed on macOS/Linux, install via chocolatey on Windows)

## Setup (One-Time)

### Easiest Way - Single Command

```bash
# Complete setup with one command
make all
```

This will:
1. Pull the Docker image
2. Authenticate all 4 agents (opens browser 4 times)
3. Start the multi-agent system
4. Show you how to connect

**That's it!** Follow the instructions to attach to orchestrator.

### Manual Setup (Alternative)

If you prefer step-by-step:

```bash
# From the root directory

# 1. Pull Docker image
make pull

# 2. Authenticate all agents (opens browser 4 times)
make auth-all

# 3. Start the system
make start

# 4. Attach to orchestrator
make attach
```

## Try These Commands

Once attached to the orchestrator, try:

```
"Evaluate all dance students"
"Review the authentication code"
"Create a social media campaign"
"Have Marie evaluate students and Fabien create social posts"
```

## Common Operations

```bash
# Check what's running
make status

# View logs
make logs

# Stop the system
make stop

# Restart after changing prompts
make rebuild

# See all commands
make help
```

## Detaching Without Stopping

When attached to a container:
- Press **Ctrl+P**, then **Ctrl+Q** to detach without stopping

## What's Happening

1. **You talk to orchestrator** - Give it complex requests
2. **Orchestrator analyzes** - Determines which workers needed
3. **Workers execute** - Marie (dance), Anga (coding), Fabien (marketing)
4. **Orchestrator synthesizes** - Combines results and responds

All communication happens through files in `core/shared/`:
- `tasks/` - Orchestrator writes tasks here
- `results/` - Workers write results here

## Architecture

```
You → Orchestrator → Task Files → Workers
                    ↓
                  Results ← Workers
                    ↓
                 Response
```

## Troubleshooting

**Containers won't start?**
```bash
make check-auth  # Verify all agents authenticated
make logs        # Check for errors
```

**Workers not responding?**
```bash
make check-tasks   # See if tasks are queued
make attach-marie  # Attach to worker to debug
```

**Need to reset?**
```bash
make clean         # Full cleanup
make start         # Fresh start
```

## Learn More

- **Full Documentation**: `core/README.md`
- **Architecture Details**: `docs/HOW_IT_WORKS.md`
- **Prompt Structure**: `docs/PROMPTS_STRUCTURE.md`

---

**Ready to orchestrate!** 🎯
