# IPC Research Documentation Index

Complete research on bidirectional communication with Docker TUI applications (Claude Code).

## Document Overview

This research provides comprehensive guidance for implementing reliable inter-process communication (IPC) between an orchestrator and interactive Node.js TUI applications running in Docker containers.

### Quick Navigation

- **Just want to start coding?** → Read [ipc-quick-reference.md](./ipc-quick-reference.md) first
- **Need complete technical background?** → Start with [ipc-research-tui-docker-communication.md](./ipc-research-tui-docker-communication.md)
- **Want implementation patterns?** → Go to [implementation-patterns-wrapper-ipc.md](./implementation-patterns-wrapper-ipc.md)
- **Visual learner?** → Check [architecture-diagrams-visual-guide.md](./architecture-diagrams-visual-guide.md)

---

## Document Descriptions

### 1. ipc-research-tui-docker-communication.md (49 KB)

**Comprehensive Research Document**

The complete technical research on all aspects of IPC with Docker TUI applications.

**Contents:**
- Part 1: IPC Mechanisms Comparison (Unix sockets vs named pipes)
- Part 2: PTY (Pseudoterminal) Fundamentals
- Part 3: Node.js PTY Libraries (node-pty, child_pty)
- Part 4: Docker API Integration (dockerode)
- Part 5: Custom Wrapper Implementation Patterns (complete code)
- Part 6: Docker Integration Scenarios
- Part 7: Input Buffering and Flow Control Patterns
- Part 8: Error Handling and Resilience
- Part 9: Comparison Summary and Recommendations
- Part 10: Additional Resources and References
- Appendix: Quick Start Template

**Key Concepts Covered:**
- Unix domain socket architecture and advantages
- PTY (pseudoterminal) pair: master/slave communication
- Docker's attach API and hijacking pattern
- node-pty library with full API reference
- dockerode integration examples
- Complete wrapper server implementation
- Command queuing pattern for sequential execution
- Output capture with line-based parsing
- Connection recovery and resilience patterns
- Health monitoring and auto-restart

**Best For:** Complete understanding, implementation reference, production deployment

**Read Time:** 40-50 minutes

---

### 2. implementation-patterns-wrapper-ipc.md (23 KB)

**Production-Ready Code Patterns**

Eight concrete implementation patterns from minimal to production-grade, with copy-paste ready code.

**Patterns Included:**

1. **Minimal Socket Server** (50 lines)
   - Direct pass-through communication
   - Best for: Quick prototyping

2. **JSON-RPC Command Queue** (150 lines)
   - Structured protocol with command tracking
   - Best for: Structured command execution

3. **Production-Grade Wrapper** (300+ lines)
   - Comprehensive error handling, health monitoring
   - Best for: Enterprise deployments

4. **Docker Compose Integration**
   - Basic and multi-agent setups
   - Best for: Containerized deployments

5. **Client Connection Pool**
   - Connection reuse and pooling
   - Best for: High-throughput orchestrators

6. **Streaming Large Output**
   - Chunked response handling
   - Best for: Commands with large outputs

7. **Error Recovery with Exponential Backoff**
   - Automatic retry and resilience
   - Best for: Unreliable networks

8. **Smart Completion Detection**
   - Multiple completion strategies
   - Best for: Complex command detection

**Additional Sections:**
- Debugging patterns
- Testing patterns with mock PTY
- Summary table with pattern selection guide

**Best For:** Developers ready to implement, copy-paste examples, pattern selection

**Read Time:** 25-30 minutes

---

### 3. ipc-quick-reference.md (13 KB)

**One-Page Cheat Sheet**

Condensed quick reference for all key concepts and common patterns.

**Sections:**
- Problem statement
- Technology stack comparison
- Architecture diagram
- Key concepts at a glance
- Quick start code (copy-paste ready)
- Common patterns (3 essential patterns)
- Timeout guidelines
- Docker compose minimal setup
- Debugging checklist
- Performance optimization tips
- Common issues and fixes
- Environment variables reference
- Files to create
- Decision tree for approach selection
- TL;DR with ultra-minimal example

**Best For:** Quick reference during implementation, onboarding, decision making

**Read Time:** 5-10 minutes

---

### 4. architecture-diagrams-visual-guide.md (48 KB)

**Visual Reference and Diagrams**

Comprehensive visual guide with 15+ ASCII diagrams and architecture visualizations.

**Diagrams Included:**

1. **System Architecture Overview**
   - Complete system layout from host to containers

2. **Communication Flow Sequence**
   - Detailed request-response sequence (6 phases)

3. **Data Flow Diagram**
   - Complete round trip with all phases labeled

4. **State Machine**
   - Command lifecycle with all states
   - Parallel command execution timeline

5. **Network Message Format**
   - JSON-RPC protocol structure
   - Message transmission flow
   - Frame format details

6. **Docker Container Resource Layout**
   - Filesystem structure
   - Unix socket details
   - PTY device details
   - Process tree

7. **Performance Characteristics**
   - Throughput vs payload size graph
   - Command execution timeline
   - Latency breakdown
   - Memory usage diagram

8. **Deployment Architecture Variants**
   - Variant 1: Single wrapper, local orchestrator
   - Variant 2: Single wrapper, distributed agents
   - Variant 3: Kubernetes deployment (with YAML)

9. **Error Handling and Recovery Flow**
   - Multiple error paths
   - Recovery strategies

10. **Monitoring and Metrics Dashboard**
    - Metrics to track
    - Example monitoring output

11. **Summary: Architecture Decision Tree**
    - Scale requirements
    - Network topology
    - Reliability requirements
    - Complexity tolerance

**Best For:** Visual learners, architecture understanding, deployment decisions

**Read Time:** 20-25 minutes

---

## Technology Stack Summary

### Recommended Architecture

```
Communication Layer:  Unix Domain Sockets (/tmp/socket.sock)
PTY Management:       node-pty (Microsoft)
Wrapper Pattern:      Custom proxy with command queue
Protocol:             JSON-RPC 2.0 (newline-delimited)
Execution Model:      Sequential command processing
Output Capture:       Line-based buffering with pattern matching
Flow Control:         Backpressure handling + connection pooling
Deployment:           Docker Compose or Kubernetes
Health Monitoring:    Periodic ping + auto-restart
```

### Why These Technologies

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **IPC Mechanism** | Unix Sockets | Better than named pipes for multi-client, bidirectional, Docker-standard |
| **PTY Library** | node-pty | Mature, Windows-compatible, active maintenance, flow control |
| **Protocol** | JSON-RPC | Structured, standard, supports async/await patterns |
| **Queueing** | Custom | TUIs are inherently sequential, standard queue libraries overkill |
| **Deployment** | Docker Compose | Simpler than Kubernetes for small-medium scale |

---

## Implementation Roadmap

### Phase 1: Understand (1-2 hours)
1. Read ipc-quick-reference.md
2. Review architecture diagrams
3. Understand PTY concepts

### Phase 2: Design (1-2 hours)
1. Choose deployment variant
2. Decide on pattern (minimal vs production)
3. Plan socket location and permissions
4. Design command protocol

### Phase 3: Implement (4-8 hours)
1. Start with Pattern 2 or 3 from implementation-patterns
2. Implement wrapper server (command queue + socket)
3. Implement client library
4. Add error handling
5. Add health monitoring

### Phase 4: Test (2-4 hours)
1. Unit tests with mock PTY
2. Integration tests with real TUI
3. Multi-client stress tests
4. Error scenario tests

### Phase 5: Deploy (1-2 hours)
1. Create Dockerfile for wrapper
2. Setup docker-compose
3. Configure health checks
4. Add monitoring

### Phase 6: Monitor & Optimize (ongoing)
1. Track metrics from Part 9 of research
2. Adjust timeouts based on command types
3. Optimize buffer sizes
4. Scale if needed

---

## Decision Matrix: Which Document to Read

```
Your Situation                          Primary Doc              Secondary Docs
──────────────────────────────────────────────────────────────────────────────

Building first version                  Quick Reference          Implementation Patterns

Need to understand all details           Full Research            Architecture Diagrams

Choosing between approaches              Architecture Diagrams   Comparison (Part 9)

Implementing wrapper server              Implementation Patterns Full Research (Part 5)

Debugging connection issues              Quick Reference         Full Research (Part 8)

Deploying to production                  Architecture Diagrams   Implementation Patterns

Scaling to multiple agents               Architecture Diagrams   Variants section

Optimizing performance                   Full Research (Part 7)  Performance section

Understanding error recovery             Full Research (Part 8)  Implementation Pattern 7

Choosing IPC mechanism                   Full Research (Part 1)  Comparison summary

Integrating with Orchestrator            Implementation Pattern  Full Research (Part 4)
                                         2 or 5

Building health monitoring               Full Research (Part 8)  Architecture Diagrams

Kubernetes deployment                    Architecture Diagrams   Variant 3 section
                                         (Variant 3)
```

---

## Key Findings Summary

### 1. Unix Domain Sockets Win

For Docker TUI communication, Unix domain sockets are superior to named pipes:
- **Bidirectional**: Full duplex communication
- **Multi-client**: Server handles multiple clients simultaneously
- **Docker-standard**: Used by `/var/run/docker.sock`
- **Performance**: Better for large messages (>10KB)
- **Security**: File permission based access control

### 2. PTY Required for TUI

Interactive terminal applications (like Claude Code) need a pseudoterminal:
- **master side**: Wrapper process (reads/writes control)
- **slave side**: TUI process (sees as controlling terminal)
- **node-pty**: Most mature library (Microsoft maintained)
- **Flow control**: Essential to prevent buffer overflow

### 3. Sequential Execution Necessary

TUI applications are inherently sequential:
- Cannot execute multiple commands simultaneously
- Requires command queueing
- Need completion detection (prompt matching)
- Commands must be processed one at a time

### 4. Three Viable Patterns

| Pattern | When to Use | Complexity |
|---------|------------|-----------|
| Minimal (50 lines) | Prototyping only | Low |
| JSON-RPC (150 lines) | Small deployments | Medium |
| Production (300+ lines) | Enterprise use | High |

### 5. Docker Deployment Simplest

Docker Compose with shared socket volume:
- Minimal network overhead (Unix socket)
- Easy multi-container setup
- Volume mount for socket sharing
- Health checks built-in

### 6. Error Handling Critical

Production wrapper must include:
- Command timeout handling
- Connection recovery
- Automatic restart on crash
- Health monitoring
- Graceful degradation

---

## File Structure

All research documents are located in:
```
C:/workspace/@codehornets-ai/libs/multi-agents-orchestration/docs/
```

Main IPC research files:
- `ipc-research-tui-docker-communication.md` (49 KB) - Complete research
- `implementation-patterns-wrapper-ipc.md` (23 KB) - Code patterns
- `ipc-quick-reference.md` (13 KB) - Quick reference
- `architecture-diagrams-visual-guide.md` (48 KB) - Visual guide
- `IPC-RESEARCH-INDEX.md` (this file) - Navigation and summary

---

## Next Steps

1. **Start here**: Read ipc-quick-reference.md (10 minutes)
2. **Learn architecture**: Review architecture-diagrams-visual-guide.md (20 minutes)
3. **Pick pattern**: Choose from implementation-patterns-wrapper-ipc.md (5 minutes)
4. **Reference deep dive**: Use ipc-research-tui-docker-communication.md as needed
5. **Implement**: Start with Pattern 2 or 3, then iterate

---

## Source Materials and References

Research based on 15+ authoritative sources:

**Official Documentation:**
- [node-pty GitHub](https://github.com/microsoft/node-pty)
- [dockerode GitHub](https://github.com/apocas/dockerode)
- [Node.js child_process API](https://nodejs.org/api/child_process.html)
- [Node.js TTY API](https://nodejs.org/api/tty.html)
- [Docker Remote API](https://docs.docker.com/engine/api/)

**Deep Technical Articles:**
- [Linux PTY - How docker attach Works](https://iximiuz.com/en/posts/linux-pty-what-powers-docker-attach-functionality/)
- [IPC Performance Comparison](https://www.baeldung.com/linux/ipc-performance-comparison)
- [Unix Domain Sockets](https://troydhanson.github.io/network/Unix_domain_sockets.html)
- [Real-Time Developer Sandboxes](https://thinhdanggroup.github.io/realtime-developer-sandbox/)

**Stack Overflow Q&A:**
- Docker stdin/stdout bidirectional communication
- node-pty with Docker containers
- Command queuing patterns
- PTY timing and flow control

---

## Document Statistics

| Document | Size | Read Time | Code Examples | Diagrams |
|----------|------|-----------|---------------|----------|
| Full Research | 49 KB | 40-50 min | 12+ | 2 |
| Implementation Patterns | 23 KB | 25-30 min | 8 patterns | 1 |
| Quick Reference | 13 KB | 5-10 min | 2 | 3 |
| Architecture Diagrams | 48 KB | 20-25 min | 5 | 15+ |
| **Total** | **133 KB** | **90-115 min** | **27+** | **21+** |

---

## Getting Help

### Common Questions

**Q: Should I use named pipes or Unix sockets?**
A: Use Unix domain sockets. See Part 1 of Full Research.

**Q: Which PTY library is best?**
A: node-pty (Microsoft). See Part 3 of Full Research.

**Q: Can I run multiple wrappers?**
A: Yes, see Variant 3 in Architecture Diagrams.

**Q: How do I handle large outputs?**
A: See Pattern 6 in Implementation Patterns.

**Q: What's the minimum viable wrapper?**
A: See Pattern 1 in Implementation Patterns (50 lines).

**Q: How do I deploy to Kubernetes?**
A: See Variant 3 in Architecture Diagrams.

### Troubleshooting

For debugging issues, see:
- ipc-quick-reference.md section "Debugging Checklist"
- ipc-quick-reference.md section "Common Issues and Fixes"
- implementation-patterns-wrapper-ipc.md section "Debugging Patterns"

---

## Version and Updates

**Document Version:** 1.0
**Last Updated:** November 22, 2025
**Research Date Range:** Current (2025)
**Status:** Complete and production-ready

---

## License and Attribution

This research synthesizes information from:
- Official Docker and Node.js documentation
- Academic research on IPC mechanisms
- Open-source project implementations
- Industry best practices

All code examples are original and provided for implementation reference.

---

## Appendix: One-Minute Summary

Need the absolute minimum? Here's the essence:

**The Problem:** Communicate with Claude Code (TUI) running in Docker from external orchestrator.

**The Solution:**
1. Create a wrapper process using node-pty that spawns Claude Code as child PTY
2. Listen on Unix socket (/tmp/claude.sock) for external commands
3. Queue commands and execute sequentially (TUIs are sequential)
4. Capture output by detecting shell prompt
5. Return results as JSON to client

**The Code:** Start with Pattern 2 in implementation-patterns-wrapper-ipc.md (150 lines)

**The Deployment:** Use docker-compose with shared volume for socket

**The Production:** Add health monitoring, error handling, retries (Pattern 3)

**Time to MVP:** 2-4 hours
**Time to Production:** 1-2 days including tests and deployment

---

**Ready to implement?** Start with ipc-quick-reference.md →
