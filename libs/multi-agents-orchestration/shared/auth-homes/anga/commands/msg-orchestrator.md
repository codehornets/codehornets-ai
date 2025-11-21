---
description: Send a message to Orchestrator (Coordinator)
arguments:
  - name: message
    description: The message to send to Orchestrator
    required: true
---

Execute this bash command to send a message to Orchestrator:

```bash
bash /scripts/send-from-worker.sh orchestrator "$ARGUMENTS"
```

This will send the message from this worker to the Orchestrator container.
