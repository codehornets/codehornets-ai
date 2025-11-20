---
description: Send a message to Orchestrator (Task Coordinator)
arguments:
  - name: message
    description: The message to send to Orchestrator
    required: true
---

Execute this bash command to send a message to Orchestrator:

```bash
bash /scripts/send_agent_message.sh orchestrator "$ARGUMENTS"
```

This will send the message to Orchestrator (Task Coordinator) in the codehornets-orchestrator container.
