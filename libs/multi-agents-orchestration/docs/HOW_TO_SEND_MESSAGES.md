# How to Send Messages Between Agents

**Status**: ✅ 100% WORKING - Tested and Verified

---

## The Simplest Way (Use This)

### Using Make Commands

```bash
# Send to Anga (coding)
make msg-anga MSG="Review the authentication code"

# Send to Marie (dance)
make msg-marie MSG="Evaluate Emma's dance progress"

# Send to Fabien (marketing)
make msg-fabien MSG="Create social media campaign for recital"

# Send to Orchestrator
make msg-orchestrator MSG="Task completed successfully"
```

**That's it.** This is the simplest, most reliable method.

---

## Alternative Methods

### Method 2: Using the send_message.sh Script Directly

```bash
bash tools/send_message.sh anga "Your message here"
bash tools/send_message.sh marie "Your message here"
bash tools/send_message.sh fabien "Your message here"
bash tools/send_message.sh orchestrator "Your message here"
```

### Method 3: Raw Docker Command (Most Direct)

```bash
docker exec codehornets-worker-anga bash -c "cd /home/agent/workspace && echo 'Your message' | claude -p --dangerously-skip-permissions"
```

---

## Real Examples

### Example 1: Orchestrator Delegates to Anga

```bash
make msg-anga MSG="[Orchestrator]: Implement JWT-based authentication. Requirements: login endpoint, register endpoint, token validation. Store in /workspace/auth/"
```

### Example 2: Anga Responds to Orchestrator

```bash
make msg-orchestrator MSG="[Anga]: Authentication system complete. Files created: /workspace/auth/login.ts, /workspace/auth/register.ts. Ready for testing."
```

### Example 3: Marie Asks Fabien for Help

```bash
make msg-fabien MSG="[Marie]: Need marketing materials for summer recital. Target: parents of dancers aged 8-14. Highlight progress and achievements."
```

---

## How It Works

When you run:
```bash
make msg-anga MSG="Test message"
```

Behind the scenes:
1. Make calls `tools/send_message.sh anga "Test message"`
2. Script maps `anga` → `codehornets-worker-anga` container
3. Executes: `docker exec codehornets-worker-anga bash -c "... | claude -p ..."`
4. Claude receives and processes the message immediately
5. Response appears in Anga's logs

**No user interaction required** - fully automated.

---

## Verification

### Check if Message Was Received

```bash
# View recent logs
make logs-anga

# Real-time monitoring
make logs-anga -f

# Last 30 lines
docker logs codehornets-worker-anga --tail 30
```

### Check Agent Status

```bash
# See if agents are running
docker ps | grep codehornets-worker

# Check heartbeat
cat shared/heartbeats/anga.json
```

---

## Agent Reference

| Agent | Make Command | Specialization |
|-------|-------------|----------------|
| **Anga** | `make msg-anga MSG="..."` | Coding (all languages, frameworks, architecture) |
| **Marie** | `make msg-marie MSG="..."` | Dance teaching (evaluations, choreography) |
| **Fabien** | `make msg-fabien MSG="..."` | Marketing (campaigns, social media, SEO) |
| **Orchestrator** | `make msg-orchestrator MSG="..."` | Task coordination and delegation |

---

## Message Format Best Practices

### Include Sender Identification

```bash
# Good - clear who sent it
make msg-anga MSG="[Orchestrator]: Review authentication code"

# Also good - explicit sender
make msg-marie MSG="[Message from Fabien]: Marketing copy is ready"
```

### Be Specific and Actionable

```bash
# Good - clear requirements
make msg-anga MSG="Implement contact form with fields: name, email, message. Validate email format. Save to /workspace/forms/contact.html"

# Bad - too vague
make msg-anga MSG="Make a form"
```

### Include Context When Needed

```bash
# Good - includes context
make msg-fabien MSG="[Orchestrator]: User requested website redesign. Focus on modern, clean aesthetic. Target audience: tech startups. Brand colors: blue (#0066cc) and white."

# Bad - missing context
make msg-fabien MSG="Redesign website"
```

---

## Troubleshooting

### Command Not Found?

```bash
# Make sure send_message.sh is executable
chmod +x tools/send_message.sh

# Test directly
bash tools/send_message.sh anga "test"
```

### Agent Not Running?

```bash
# Check status
docker ps | grep codehornets-worker-anga

# Start if stopped
docker-compose up -d anga
```

### Message Not Processing?

```bash
# Check agent logs for errors
make logs-anga

# Restart agent if needed
docker restart codehornets-worker-anga
```

---

## Complete Working Example

Here's a full workflow demonstrating inter-agent communication:

### Scenario: User Wants Authentication System

**Step 1: User tells orchestrator**
```bash
make attach-orchestrator
# In Claude session: "Add user authentication to the website"
```

**Step 2: Orchestrator delegates to Anga**
```bash
make msg-anga MSG="[Orchestrator]: Implement JWT-based authentication. Requirements: POST /api/login, POST /api/register, middleware for token validation. Use bcrypt for passwords. Store in /workspace/auth/"
```

**Step 3: Anga completes work and responds**
```bash
make msg-orchestrator MSG="[Anga]: Authentication system implemented. Files: /workspace/auth/login.ts (POST /api/login), /workspace/auth/register.ts (POST /api/register), /workspace/auth/middleware.ts (JWT validation). Using bcrypt with 10 salt rounds. All endpoints tested. Ready for integration."
```

**Step 4: Orchestrator asks Fabien for marketing**
```bash
make msg-fabien MSG="[Orchestrator]: Create marketing copy for new user registration page. Emphasize: security (encrypted passwords, secure tokens), ease of use (simple 2-step signup), privacy (no data sharing). Target: small business owners."
```

**Step 5: Fabien delivers copy**
```bash
make msg-orchestrator MSG="[Fabien]: Registration page copy complete. Headline: 'Secure Your Business in 2 Simple Steps'. Subheading emphasizes bank-level encryption and privacy. CTA: 'Create Your Free Account - No Credit Card Required'. Copy saved to /workspace/marketing/registration-copy.md"
```

---

## Summary

**The Easiest Way to Send Messages:**

```bash
make msg-anga MSG="your message"
make msg-marie MSG="your message"
make msg-fabien MSG="your message"
make msg-orchestrator MSG="your message"
```

**That's all you need to know.**

---

## Additional Resources

- **Full Documentation**: `WORKING_MESSAGE_SYSTEM.md`
- **Simple Guide**: `SIMPLE_MESSAGING_GUIDE.md`
- **Script Source**: `tools/send_message.sh`
- **System Logs**: `make logs-<agent>` (e.g., `make logs-anga`)

---

**The inter-agent communication system is WORKING and READY TO USE!** ✅
