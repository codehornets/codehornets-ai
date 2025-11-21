---
description: Send a message to Fabien (DevOps/Marketing Worker)
arguments:
  - name: message
    description: The message to send to Fabien
    required: true
---

Execute this bash command to send a message to Fabien:

```bash
bash /scripts/send-from-worker.sh fabien "$ARGUMENTS"
```

This will send the message to Fabien (DevOps/Marketing Worker) in the codehornets-worker-fabien container.
