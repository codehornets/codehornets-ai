# 🚀 Quick Start: End-to-End Testing

## Fastest Way to Test (1 minute)

```bash
# Run automated test
make test-e2e
```

This creates a task, waits 15 seconds, and shows results.

---

## Manual Test with Orchestrator (5 minutes)

### Step 1: Open Two Terminals

**Terminal 1** - Start the workflow monitor:
```bash
make watch-workflow
```

**Terminal 2** - Attach to orchestrator:
```bash
make attach-orchestrator
```

### Step 2: Give Request to Orchestrator

In Terminal 2, type:

```
I need to create a Python function that validates email addresses using regex.
Can you help delegate this to the right agent?
```

### Step 3: Watch the Magic ✨

In **Terminal 1**, you'll see:

```
📋 anga: 1 task(s)      # Task created
🚀 Auto-woke anga       # Worker woken
📊 anga: 1 result(s)    # Task processed
📦 anga: 1 archived     # Task archived
```

### Step 4: Verify Success

```bash
make view-archive
```

Should show:
```
anga: 1 total (1 success, 0 failed)
```

---

## What Just Happened?

```
You → Orchestrator → Task File
                        ↓
                    Monitor Detects (< 3s)
                        ↓
                    Auto-Wake Worker (via automation)
                        ↓
                    Worker Processes
                        ↓
                    Result Created
                        ↓
                    Archive (< 15s)
                        ↓
                    Queue Cleaned ✅
```

---

## Common Commands

```bash
make reset-test          # Clean everything
make watch-workflow      # Real-time monitor
make attach-orchestrator # Talk to orchestrator
make view-archive        # See completed tasks
make logs-monitor        # Check monitor logs
make status              # System health
```

---

## Test Different Workers

### Marie (Dance Teaching)
```
Create a React component for a user profile card
```

### Anga (Coding)
```
Create a REST API endpoint for user authentication
```

### Fabien (Marketing)
```
Set up Docker Compose with Redis and PostgreSQL
```

---

## Troubleshooting

**Task not processing?**
```bash
make logs-monitor  # Check monitor
make wake-anga     # Manual wake
```

**Need fresh start?**
```bash
make reset-test
```

---

## Full Documentation

See `TESTING_GUIDE.md` for complete testing documentation.

---

**Ready? Start here:**
```bash
make test-orchestrator-flow
```
