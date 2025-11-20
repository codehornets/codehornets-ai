# Hooks-Based Agent Communication - Architecture Diagrams

Visual reference for the hooks-based communication system architecture.

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Orchestrator                                │
│                                                                     │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐        │
│  │ Task Manager │───▶│ File Writer  │───▶│ Hook Trigger │        │
│  └──────────────┘    └──────────────┘    └──────────────┘        │
│         │                    │                    │                │
└─────────┼────────────────────┼────────────────────┼────────────────┘
          │                    │                    │
          │                    ▼                    ▼
          │         /shared/tasks/{worker}/   /shared/triggers/{worker}/
          │              *.json                    *.trigger
          │                    │                    │
          │                    │                    │
┌─────────┼────────────────────┼────────────────────┼────────────────┐
│         │         Shared Volumes (Docker/K8s)    │                │
│         │                    │                    │                │
│    ┌────▼─────┐         ┌───▼──────┐        ┌───▼──────┐        │
│    │  Tasks   │         │ Triggers │        │  Pipes   │        │
│    │  Queue   │         │  inotify │        │  Named   │        │
│    └──────────┘         └──────────┘        └──────────┘        │
│         │                    │                    │                │
└─────────┼────────────────────┼────────────────────┼────────────────┘
          │                    │                    │
          │                    ▼                    ▼
          │           ┌─────────────────┐   ┌─────────────┐
          │           │ hook_watcher.py │◀──│ Control Pipe│
          │           │  (background)   │──▶│ Status Pipe │
          │           └─────────────────┘   └─────────────┘
          │                    │
          ▼                    ▼
    ┌──────────────────────────────────────────────────┐
    │              Worker Container                     │
    │  ┌────────────────────────────────────────────┐  │
    │  │         activation_wrapper.py (optional)   │  │
    │  │         - Zero-CPU idle                    │  │
    │  │         - inotify/redis activation         │  │
    │  └────────────────────────────────────────────┘  │
    │                      │                            │
    │                      ▼                            │
    │  ┌────────────────────────────────────────────┐  │
    │  │         Claude Code CLI                    │  │
    │  │         - Hooks config loaded              │  │
    │  │         - Processes tasks                  │  │
    │  │         - Writes results                   │  │
    │  └────────────────────────────────────────────┘  │
    │                      │                            │
    └──────────────────────┼────────────────────────────┘
                          │
                          ▼
                   /shared/results/
                        *.json
```

---

## Container Startup Flow

```
┌───────────────────────────────────────────────────────────────┐
│                  Container Startup                             │
│                                                                │
│  1. entrypoint.sh executed                                    │
│     ├─ Check environment variables                            │
│     ├─ HOOKS_MODE, ACTIVATION_WRAPPER, ACTIVATION_MODE        │
│     └─ WORKER_NAME, REDIS_URL, etc.                          │
│                                                                │
│  2. Install dependencies                                      │
│     ├─ If HOOKS_MODE or ACTIVATION_WRAPPER:                   │
│     └─── pip install watchdog redis reportlab                │
│                                                                │
│  3. Configure output style                                    │
│     ├─ Copy /output-styles/{worker}.md                       │
│     └─ Create settings.local.json                            │
│                                                                │
│  4. Setup hooks (if HOOKS_MODE=1)                            │
│     ├─ Create /home/agent/.claude/hooks/                     │
│     ├─ Copy /hooks-config/{worker}-hooks.json                │
│     ├─ Create named pipes:                                   │
│     │   ├─ mkfifo /shared/pipes/{worker}-control             │
│     │   └─ mkfifo /shared/pipes/{worker}-status              │
│     └─ Start hook_watcher.py in background                   │
│                                                                │
│  5. Start main process                                        │
│     ├─ If ACTIVATION_WRAPPER + HOOKS_MODE: (HYBRID)          │
│     │   └─ python3 /tools/activation_wrapper.py {worker}     │
│     ├─ Elif ACTIVATION_WRAPPER: (EVENT-DRIVEN)               │
│     │   └─ python3 /tools/activation_wrapper.py {worker}     │
│     ├─ Elif HOOKS_MODE: (HOOKS-ONLY)                         │
│     │   └─ claude                                             │
│     └─ Else: (POLLING)                                        │
│         └─ claude                                             │
│                                                                │
└───────────────────────────────────────────────────────────────┘
```

---

## Hook Watcher Flow

```
┌────────────────────────────────────────────────────────────────┐
│             hook_watcher.py Process Flow                       │
│                                                                 │
│  Initialize                                                     │
│  ├─ Setup directories                                          │
│  │   ├─ TRIGGER_DIR = /shared/triggers/{worker}               │
│  │   ├─ PIPE_DIR = /shared/pipes                              │
│  │   └─ HEARTBEAT_DIR = /shared/heartbeats                    │
│  ├─ Create named pipes (if not exist)                         │
│  ├─ Setup signal handlers (SIGTERM, SIGINT)                   │
│  └─ Start heartbeat thread                                     │
│                                                                 │
│  Optional: Connect to Redis                                    │
│  └─ redis.from_url(REDIS_URL)                                 │
│                                                                 │
│  Start background threads                                      │
│  ├─ Control pipe listener (blocking read)                     │
│  │   └─ Accepts commands: status, reload, shutdown            │
│  └─ Heartbeat worker (10s interval)                           │
│      └─ Writes JSON to /shared/heartbeats/{worker}-watcher.json│
│                                                                 │
│  Main loop: Watch triggers                                     │
│  ├─ If watchdog available:                                    │
│  │   ├─ Observer with inotify                                 │
│  │   ├─ on_created() → handle_trigger()                       │
│  │   └─ on_modified() → handle_trigger()                      │
│  └─ Else:                                                      │
│      └─ Polling mode (scan every 0.5s)                        │
│                                                                 │
│  handle_trigger(path)                                          │
│  ├─ Read trigger file (JSON)                                  │
│  ├─ Parse type and ID from filename                           │
│  ├─ Optional: Publish to Redis                                │
│  ├─ Write to status pipe (non-blocking)                       │
│  ├─ Delete trigger file                                       │
│  └─ Log processing                                             │
│                                                                 │
│  On shutdown (SIGTERM)                                         │
│  ├─ Stop heartbeat thread                                     │
│  ├─ Stop observer                                              │
│  ├─ Print final statistics                                    │
│  └─ Exit gracefully                                            │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## Trigger Processing Flow

```
                           ORCHESTRATOR
                                │
                                │ Creates trigger
                                ▼
                    echo '{"task": "..."}' >
                /shared/triggers/marie/task-001.trigger
                                │
                                │ Filesystem event (inotify)
                                │ <1ms latency
                                ▼
                        ┌───────────────┐
                        │ hook_watcher  │
                        │   detects     │
                        └───────┬───────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
                ▼               ▼               ▼
        ┌──────────┐    ┌──────────┐    ┌──────────┐
        │  Parse   │    │ Publish  │    │  Write   │
        │  Trigger │    │   Redis  │    │  Status  │
        │   JSON   │    │  (opt)   │    │   Pipe   │
        └──────────┘    └──────────┘    └──────────┘
                │
                │ Trigger processed
                ▼
        Delete trigger file
                │
                │ Log event
                ▼
    /var/log/marie-watcher.log
                │
                │ Meanwhile, Claude Code
                │ (separate process) may have been
                │ triggered by activation_wrapper
                ▼
        ┌───────────────────────┐
        │  Claude Code CLI      │
        │  executes task        │
        └───────┬───────────────┘
                │
                │ Write result
                ▼
    /shared/results/marie/task-001.json
                │
                │ Optional: Create result trigger
                ▼
    /shared/triggers/orchestrator/marie-result-ready.trigger
                │
                │ Orchestrator's watcher detects
                ▼
        ORCHESTRATOR NOTIFIED
```

---

## Docker Compose Mode Selection

```
                    docker-compose command
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
  No env vars      ACTIVATION_WRAPPER=1    HOOKS_MODE=1
  No profiles        --profile activated    --profile hooks
        │                   │                   │
        │                   │                   │
        ▼                   ▼                   ▼
  ┌──────────┐      ┌──────────────┐     ┌──────────────┐
  │ POLLING  │      │ EVENT-DRIVEN │     │    HOOKS     │
  │  MODE    │      │     MODE     │     │     MODE     │
  └──────────┘      └──────────────┘     └──────────────┘
        │                   │                   │
        ▼                   ▼                   ▼
  Standard CLI    activation_wrapper    hook_watcher +
                      + Claude               Claude
        │                   │                   │
        │                   │                   │
        ▼                   ▼                   ▼
  ~1s latency        <10ms latency        <100ms latency
   ~2% CPU            ~0% CPU idle         ~1% CPU
   Simple             Zero-CPU             Observable


            ACTIVATION_WRAPPER=1 + HOOKS_MODE=1
                  --profile hybrid
                        │
                        ▼
                ┌──────────────┐
                │    HYBRID    │
                │     MODE     │
                └──────────────┘
                        │
                        ▼
            activation_wrapper +
            hook_watcher + Claude
                        │
                        ▼
            <10ms latency + Full observability
                  ~0% CPU idle
              Production Recommended
```

---

## Kubernetes Architecture

```
                         KUBERNETES CLUSTER
    ┌────────────────────────────────────────────────────────┐
    │                                                         │
    │  Namespace: codehornets-ai                             │
    │  ┌──────────────────────────────────────────────────┐  │
    │  │                                                   │  │
    │  │  ConfigMaps                                       │  │
    │  │  ├─ hooks-config (hook JSON files)               │  │
    │  │  ├─ entrypoint-script (startup script)           │  │
    │  │  ├─ tools-scripts (watcher, wrapper)             │  │
    │  │  └─ output-styles (worker styles)                │  │
    │  │                                                   │  │
    │  │  Secrets                                          │  │
    │  │  ├─ claude-auth (auth tokens)                    │  │
    │  │  └─ redis-password (if using Redis)              │  │
    │  │                                                   │  │
    │  └──────────────────────────────────────────────────┘  │
    │                         │                               │
    │                         │ Mounted into pods             │
    │                         ▼                               │
    │  ┌──────────────────────────────────────────────────┐  │
    │  │                 Deployments                       │  │
    │  │                                                   │  │
    │  │  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │  │
    │  │  │ orchestrator│  │    marie    │  │   anga   │ │  │
    │  │  │  replicas:1 │  │  replicas:1 │  │replicas:1│ │  │
    │  │  └─────────────┘  └─────────────┘  └──────────┘ │  │
    │  │         │                 │                │     │  │
    │  └─────────┼─────────────────┼────────────────┼─────┘  │
    │            │                 │                │         │
    │            ▼                 ▼                ▼         │
    │  ┌──────────────────────────────────────────────────┐  │
    │  │                   Pods                            │  │
    │  │  ┌────────────────────────────────────────────┐  │  │
    │  │  │  Init Containers:                          │  │  │
    │  │  │  └─ init-directories                       │  │  │
    │  │  │     └─ Create /shared/{triggers,pipes,...} │  │  │
    │  │  │                                            │  │  │
    │  │  │  Main Container:                           │  │  │
    │  │  │  ├─ Image: claude-code                     │  │  │
    │  │  │  ├─ Entrypoint: /tools/entrypoint.sh       │  │  │
    │  │  │  ├─ Environment:                           │  │  │
    │  │  │  │   ├─ HOOKS_MODE=1                       │  │  │
    │  │  │  │   ├─ WORKER_NAME=marie                  │  │  │
    │  │  │  │   └─ REDIS_URL=...                      │  │  │
    │  │  │  ├─ Volumes:                               │  │  │
    │  │  │  │   ├─ PVC: auth, workspace              │  │  │
    │  │  │  │   ├─ ConfigMap: hooks, tools            │  │  │
    │  │  │  │   └─ EmptyDir: triggers, pipes (tmpfs)  │  │  │
    │  │  │  ├─ Probes:                                │  │  │
    │  │  │  │   ├─ Liveness: heartbeat file          │  │  │
    │  │  │  │   └─ Readiness: heartbeat file         │  │  │
    │  │  │  └─ Resources:                             │  │  │
    │  │  │      ├─ Requests: 250m CPU, 512Mi memory   │  │  │
    │  │  │      └─ Limits: 1 CPU, 2Gi memory          │  │  │
    │  │  └────────────────────────────────────────────┘  │  │
    │  └──────────────────────────────────────────────────┘  │
    │            │                                            │
    │            │ Health checks every 10s                    │
    │            ▼                                            │
    │  ┌──────────────────────────────────────────────────┐  │
    │  │           /shared/heartbeats/                     │  │
    │  │           {worker}-watcher.json                   │  │
    │  └──────────────────────────────────────────────────┘  │
    │                                                         │
    └─────────────────────────────────────────────────────────┘
```

---

## CI/CD Pipeline

```
        GitHub Push/PR
              │
              ▼
    ┌────────────────────────┐
    │   GitHub Actions       │
    │   .github/workflows/   │
    │   test-hooks.yml       │
    └───────────┬────────────┘
                │
        ┌───────┼───────┐
        │       │       │
        ▼       ▼       ▼
    ┌─────┐ ┌─────┐ ┌──────┐
    │Test │ │Test │ │Security│
    │Hooks│ │Hybrid│ │Scan  │
    │Mode │ │Mode │ │Trivy │
    └──┬──┘ └──┬──┘ └───┬──┘
       │       │        │
       └───────┼────────┘
               │
               │ All pass
               ▼
         ┌───────────┐
         │   Build   │
         │   Image   │
         └─────┬─────┘
               │
               ▼
         ┌───────────┐
         │   Push    │
         │  Registry │
         └─────┬─────┘
               │
               ▼
       ┌───────────────┐
       │    Deploy     │
       │  Kubernetes   │
       │  (if main)    │
       └───────────────┘
```

---

## Monitoring Flow

```
    Worker Pods
    │
    ├─ Container logs
    │  └─ docker logs / kubectl logs
    │       │
    │       └─→ Aggregated by Fluentd/Fluent Bit
    │            │
    │            └─→ Elasticsearch / Loki
    │                 │
    │                 └─→ Kibana / Grafana
    │
    ├─ Watcher logs
    │  └─ /var/log/{worker}-watcher.log
    │       │
    │       └─→ Parsed by Prometheus exporter
    │            │
    │            └─→ Prometheus
    │                 │
    │                 └─→ Grafana dashboards
    │
    ├─ Heartbeat files
    │  └─ /shared/heartbeats/{worker}-watcher.json
    │       │
    │       └─→ Kubernetes probes
    │            │
    │            └─→ Pod status
    │                 │
    │                 └─→ Alertmanager
    │                      │
    │                      └─→ PagerDuty / Slack
    │
    └─ Metrics (optional)
       └─ Prometheus endpoint :9090/metrics
            │
            └─→ Prometheus scrape
                 │
                 └─→ Grafana dashboards
```

---

These diagrams provide a comprehensive visual reference for understanding the hooks-based agent communication system architecture, data flow, and deployment patterns.
