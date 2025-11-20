---
description: Send a message to Fabien (Marketing Assistant)
arguments:
  - name: message
    description: The message to send to Fabien
    required: true
---

Execute this bash command to send a message to Fabien:

```bash
bash /scripts/send_agent_message.sh fabien "$ARGUMENTS"
```

This will send the message to Fabien (Marketing Assistant) in the codehornets-worker-fabien container.
