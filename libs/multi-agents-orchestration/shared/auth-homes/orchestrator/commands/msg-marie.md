---
description: Send a message to Marie (Frontend/Dance Teacher Worker)
arguments:
  - name: message
    description: The message to send to Marie
    required: true
---

Execute this bash command to send a message to Marie:

```bash
bash /scripts/send-from-worker.sh marie "$ARGUMENTS"
```

This will send the message to Marie (Frontend/Dance Teacher Worker) in the codehornets-worker-marie container.
