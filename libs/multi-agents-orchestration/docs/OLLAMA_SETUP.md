# Ollama Setup for AI-Powered Recaps

The monitor daemon can use Ollama (local LLM) for intelligent system recaps. This is completely optional - the monitor works fine with rule-based analysis.

## What You Get with Ollama

**Without Ollama (default):**
```
--- Recap ---
✓ All workers are active. 📋 1 task(s) pending.
```

**With Ollama:**
```
--- AI Recap ---
System is healthy with all workers active. Anga has 1 pending task
waiting to be processed. Consider waking Anga to start task processing.
Marie and Fabien are idle and ready for work.
```

## Installation

### Linux / WSL2

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull the model (small, fast 1B parameter model)
ollama pull llama3.2:1b

# Verify it's running
ollama list

# Test it
ollama run llama3.2:1b "Hello"
```

### macOS

```bash
# Download from https://ollama.com/download
# Or use Homebrew
brew install ollama

# Start Ollama service
ollama serve &

# Pull the model
ollama pull llama3.2:1b
```

### Windows

1. Download from https://ollama.com/download
2. Install Ollama
3. Open PowerShell/CMD:
```powershell
ollama pull llama3.2:1b
```

## Restart Monitor to Enable

After installing Ollama:

```bash
# Restart the monitor daemon
make stop-monitor && make start-monitor

# Check logs to confirm
make logs-monitor
```

You should see:
```
✓ Ollama detected - AI recaps enabled
```

## Troubleshooting

### Monitor Not Detecting Ollama

**Check Ollama is running:**
```bash
curl http://localhost:11434/api/tags
```

Should return JSON with available models.

**Check Docker can reach host:**
```bash
# From inside monitor container
docker exec codehornets-svc-monitor curl http://host.docker.internal:11434/api/tags
```

### Connection Refused

Ollama must be accessible from Docker containers. The monitor tries multiple endpoints:
1. `http://host.docker.internal:11434` (Docker Desktop)
2. `http://172.17.0.1:11434` (Linux docker0)
3. `http://ollama:11434` (If Ollama service exists)

**Linux users:** Ensure Ollama listens on all interfaces:
```bash
# Check Ollama service
sudo systemctl status ollama

# If needed, configure to listen on 0.0.0.0
sudo systemctl edit ollama
# Add:
# [Service]
# Environment="OLLAMA_HOST=0.0.0.0"

sudo systemctl restart ollama
```

### Model Not Found

```bash
# List available models
ollama list

# Pull the model if missing
ollama pull llama3.2:1b
```

## Model Options

You can use different models by setting the environment variable:

```bash
# In .env file
LLM_MODEL=llama3.2:1b        # Default (fastest, ~1GB)
LLM_MODEL=llama3.2:3b        # Better quality (~2GB)
LLM_MODEL=llama3.1:8b        # Best quality (~4.7GB)
```

Then restart monitor:
```bash
make stop-monitor && make start-monitor
```

## Performance Impact

- **Model size:** llama3.2:1b = ~1GB RAM
- **Inference time:** ~1-2 seconds per recap
- **Frequency:** Recaps run every 30 seconds
- **CPU usage:** Minimal (only during recap generation)

The small 1B model is sufficient for system status summaries and uses very little resources.

## Disabling Ollama

No action needed - if Ollama is not installed, the monitor automatically uses rule-based recaps.

To explicitly prevent Ollama usage even if installed:
```bash
# Remove LLM_MODEL from docker-compose.yml or set to empty
LLM_MODEL=
```

## API Keys

Ollama runs 100% locally - no API keys, no external services, no data leaves your machine.
