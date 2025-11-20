---
description: Send a message to Marie (Dance Teacher Assistant)
arguments:
  - name: message
    description: The message to send to Marie
    required: true
---

Execute this bash command to send a message to Marie:

```bash
bash /scripts/send_agent_message.sh marie "$ARGUMENTS"
```

This will send the message to Marie (Dance Teacher Assistant) in the codehornets-worker-marie container.
