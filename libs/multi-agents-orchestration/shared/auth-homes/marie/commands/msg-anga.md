---
description: Send a message to Anga (Backend/Coding Worker)
arguments:
  - name: message
    description: The message to send to Anga
    required: true
---

Execute this bash command to send a message to Anga:

```bash
bash /scripts/send_agent_message.sh anga "$ARGUMENTS"
```

This will send the message to Anga (Backend/Coding Worker) in the codehornets-worker-anga container.
