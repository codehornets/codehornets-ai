# Multi-Agent Orchestration System

**Simple, powerful orchestration using Claude Code CLI instances**

One orchestrator coordinates three specialized workers - all using full Claude Code CLI instances running in Docker containers.

---

## Quick Start (30 seconds)

```bash
make all
```

That's it! This single command will:
1. Pull the Docker image
2. Authenticate all 4 agents
3. Start the multi-agent system
4. Show you how to connect

Then run:
```bash
make attach
```

And start orchestrating!

---

## What This Is

A multi-agent system where:
- **Orchestrator** - Coordinates tasks and synthesizes results
- **Marie** - Dance teaching expert (student evaluation, choreography)
- **Anga** - Software development expert (code review, architecture)
- **Fabien** - Marketing expert (campaigns, content, social media)

All agents are **full Claude Code CLI instances** running in Docker containers, communicating through a file-based task queue.

---

## Quick Commands

```bash
# Setup (one-time)
make all              # Complete setup
make help             # Show all commands

# Daily use
make start            # Start system
make attach           # Connect to orchestrator
make status           # Check what's running
make logs             # View logs
make stop             # Stop system

# After changing prompts
make rebuild          # Restart with changes
```

---

## Documentation

- **Quick Start**: `QUICKSTART.md` - 30-second setup guide
- **Core System**: `core/README.md` - Detailed system docs
- **Architecture**: `docs/HOW_IT_WORKS.md` - How orchestration works
- **Prompts**: `docs/PROMPTS_STRUCTURE.md` - Domain vs Agent separation
- **Commands**: `docs/MAKE_COMMANDS.md` - Complete command reference

---

## Architecture Highlights

**90.2% performance improvement** through parallel task execution

```
You → Orchestrator → /tasks/{worker}/task.json
                          ↓
                    Workers execute in parallel
                          ↓
                   ← /results/{worker}/result.json
                          ↓
                    Synthesized response
```

**Key Features**:
- ✅ Specialization - Each worker expert in their domain
- ✅ Parallelization - Independent tasks run simultaneously
- ✅ File-Based - Simple, debuggable communication
- ✅ CLI-Based - All agents are full Claude Code instances
- ✅ Clean Separation - Domain knowledge separate from personality

---

**Ready to orchestrate!** 🎯

Run `make all` to get started, or check `QUICKSTART.md` for details.
