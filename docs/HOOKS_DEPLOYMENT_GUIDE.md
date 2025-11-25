# Hooks-Based Agent Communication - Deployment Guide

Comprehensive guide for deploying hooks-based agent communication from Docker Compose to production Kubernetes.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Local Development (Docker Compose)](#local-development)
4. [Production Deployment (Kubernetes)](#production-deployment)
5. [Multi-Mode Support](#multi-mode-support)
6. [Performance Optimization](#performance-optimization)
7. [Troubleshooting](#troubleshooting)

---

## Overview

The hooks-based communication system provides three deployment modes:

1. **Polling Mode** (default) - Simple, no dependencies
2. **Event-Driven Mode** (activation_wrapper.py) - Zero-CPU idle, instant wakeup
3. **Hooks Mode** (NEW) - Claude Code hooks integration with file triggers and named pipes
4. **Hybrid Mode** - Combines event-driven + hooks for production

### Key Features

- **File-based triggers**: Filesystem events for task notifications
- **Named pipes**: Low-latency bidirectional IPC
- **Hook watchers**: Background processes monitoring triggers
- **Observable**: Comprehensive logging and health checks
- **Backward compatible**: All existing modes still work
- **Production-ready**: Zero-downtime deployments, secrets management

---

## Architecture

### Component Overview

```
┌─────────────────┐
│  Orchestrator   │
│                 │
│  Assigns tasks  │
└────────┬────────┘
         │
         │ Creates trigger files
         │
         ▼
┌─────────────────────────────────────┐
│  Shared Volumes                     │
│                                     │
│  /shared/triggers/{worker}/         │
│  /shared/pipes/{worker}-{control}   │
│  /shared/watcher-logs/              │
│  /shared/heartbeats/                │
└─────────────────────────────────────┘
         │
         │ Monitored by hook_watcher.py
         │
         ▼
┌────────────────────────────────────┐
│  Workers (marie, anga, fabien)    │
│                                    │
│  ┌──────────────────────────────┐ │
│  │ hook_watcher.py (background) │ │
│  │  - inotify on triggers/      │ │
│  │  - listens on control pipe   │ │
│  │  - publishes to Redis        │ │
│  └──────────────────────────────┘ │
│                                    │
│  ┌──────────────────────────────┐ │
│  │ Claude Code CLI (foreground) │ │
│  │  - Hooks config loaded       │ │
│  │  - Processes tasks           │ │
│  │  - Writes results            │ │
│  └──────────────────────────────┘ │
└────────────────────────────────────┘
```

### Directory Structure

```
infrastructure/docker/codehornets-ai/
├── docker-compose.hooks.yml        # Multi-mode Docker Compose
├── hooks-config/                   # Hook configurations
│   ├── marie-hooks.json
│   ├── anga-hooks.json
│   └── fabien-hooks.json
├── shared/
│   ├── triggers/                   # File-based triggers
│   │   ├── marie/
│   │   ├── anga/
│   │   ├── fabien/
│   │   └── orchestrator/
│   ├── pipes/                      # Named pipes
│   │   ├── marie-control
│   │   ├── marie-status
│   │   ├── anga-control
│   │   └── ...
│   ├── watcher-logs/              # Watcher logs
│   │   ├── marie-watcher.log
│   │   └── ...
│   └── heartbeats/                # Health monitoring
│       ├── marie-watcher.json
│       └── ...
└── ...

tools/
├── entrypoint.sh                  # Container entrypoint
├── hook_watcher.py                # Hook watcher daemon
├── activation_wrapper.py          # Event-driven wrapper
└── test_hooks.sh                  # Integration tests
```

---

## Local Development

### Prerequisites

```bash
# Required
docker >= 24.0
docker-compose >= 2.20
make

# Optional (for testing)
jq
inotify-tools
python3 with watchdog, redis
```

### Quick Start

```bash
# 1. Clone repository
git clone https://github.com/codehornets/codehornets-ai.git
cd codehornets-ai

# 2. Pull Claude Code image
make pull

# 3. Fix permissions
make fix-permissions

# 4. Authenticate agents (one-time)
make auth-all

# 5. Start hooks mode
make start-hooks

# 6. Check status
make hooks-status

# 7. View watcher logs
make logs-watcher-marie

# 8. Run tests
make test-hooks

# 9. Attach to orchestrator
make attach
```

### Mode Selection

#### Polling Mode (Default - Simplest)
```bash
docker-compose up
```
- Workers poll every 1s
- No dependencies
- Great for development

#### Event-Driven Mode (Zero-CPU Idle)
```bash
ACTIVATION_WRAPPER=1 docker-compose --profile activated up
```
- Instant wakeup with inotify/Redis
- 0% CPU when idle
- Requires watchdog library

#### Hooks Mode (NEW)
```bash
HOOKS_MODE=1 docker-compose -f docker-compose.hooks.yml --profile hooks up
```
- File triggers + named pipes
- Claude Code hooks integration
- Observable watcher logs

#### Hybrid Mode (Production)
```bash
ACTIVATION_WRAPPER=1 HOOKS_MODE=1 docker-compose -f docker-compose.hooks.yml --profile hybrid up
```
- activation_wrapper.py for zero-CPU
- hook_watcher.py for hooks
- Best of both worlds

### Available Commands

```bash
# Hooks system
make start-hooks          # Start hooks mode
make stop-hooks           # Stop hooks mode
make restart-hooks        # Restart hooks mode
make start-hybrid         # Start hybrid mode

# Monitoring
make hooks-status         # Check system status
make logs-watcher-marie   # View Marie's watcher logs
make logs-watcher-anga    # View Anga's watcher logs
make check-triggers       # Check trigger files
make check-pipes          # Check named pipes

# Testing
make test-hooks           # Run integration tests

# Cleanup
make clean-triggers       # Clean trigger files
make stop-hooks           # Stop and remove containers
```

---

## Production Deployment

### Kubernetes Setup

#### Prerequisites

```bash
# Required
kubectl >= 1.28
helm >= 3.12 (optional)
kubernetes cluster (GKE, EKS, AKS, or self-hosted)

# Recommended
cert-manager (for TLS)
ingress-nginx or traefik
prometheus-operator (monitoring)
```

#### Step 1: Create Namespace

```bash
kubectl create namespace codehornets-ai
kubectl label namespace codehornets-ai istio-injection=enabled  # if using Istio
```

#### Step 2: Create Secrets

```bash
# Claude authentication tokens (from local auth)
kubectl create secret generic claude-auth \
  --from-file=orchestrator=infrastructure/docker/codehornets-ai/shared/auth-homes/orchestrator/.credentials.json \
  --from-file=marie=infrastructure/docker/codehornets-ai/shared/auth-homes/marie/.credentials.json \
  --from-file=anga=infrastructure/docker/codehornets-ai/shared/auth-homes/anga/.credentials.json \
  --from-file=fabien=infrastructure/docker/codehornets-ai/shared/auth-homes/fabien/.credentials.json \
  -n codehornets-ai

# Redis password (if using Redis)
kubectl create secret generic redis-password \
  --from-literal=password=$(openssl rand -base64 32) \
  -n codehornets-ai

# Verify secrets
kubectl get secrets -n codehornets-ai
```

#### Step 3: Deploy ConfigMaps

```bash
# Hook configurations
kubectl apply -f infrastructure/kubernetes/hooks/configmap-hooks.yaml

# Tools scripts
kubectl create configmap tools-scripts \
  --from-file=hook_watcher.py=tools/hook_watcher.py \
  --from-file=activation_wrapper.py=tools/activation_wrapper.py \
  -n codehornets-ai

# Output styles
kubectl create configmap output-styles \
  --from-file=marie.md=infrastructure/docker/codehornets-ai/output-styles/marie.md \
  --from-file=anga.md=infrastructure/docker/codehornets-ai/output-styles/anga.md \
  --from-file=fabien.md=infrastructure/docker/codehornets-ai/output-styles/fabien.md \
  -n codehornets-ai
```

#### Step 4: Deploy Storage

```bash
# Persistent volumes for authentication and workspaces
kubectl apply -f infrastructure/kubernetes/hooks/pvc.yaml

# Verify PVCs
kubectl get pvc -n codehornets-ai
```

#### Step 5: Deploy Redis (Optional)

```bash
# Using Helm (recommended)
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install redis bitnami/redis \
  --set auth.password=$(kubectl get secret redis-password -n codehornets-ai -o jsonpath='{.data.password}' | base64 -d) \
  --set master.persistence.enabled=true \
  --set master.persistence.size=1Gi \
  -n codehornets-ai

# Or using kubectl
kubectl apply -f infrastructure/kubernetes/hooks/redis.yaml
```

#### Step 6: Deploy Workers

```bash
# Deploy Marie
kubectl apply -f infrastructure/kubernetes/hooks/deployment-marie.yaml

# Deploy Anga
kubectl apply -f infrastructure/kubernetes/hooks/deployment-anga.yaml

# Deploy Fabien
kubectl apply -f infrastructure/kubernetes/hooks/deployment-fabien.yaml

# Deploy Orchestrator
kubectl apply -f infrastructure/kubernetes/hooks/deployment-orchestrator.yaml

# Check deployments
kubectl get deployments -n codehornets-ai
kubectl get pods -n codehornets-ai
```

#### Step 7: Expose Services (Optional)

```bash
# Create services
kubectl apply -f infrastructure/kubernetes/hooks/service.yaml

# Create ingress (if needed)
kubectl apply -f infrastructure/kubernetes/hooks/ingress.yaml
```

#### Step 8: Verify Deployment

```bash
# Check pod status
kubectl get pods -n codehornets-ai

# Check logs
kubectl logs -f deployment/marie -n codehornets-ai

# Check watcher logs
kubectl exec -it deployment/marie -n codehornets-ai -- tail -f /var/log/marie-watcher.log

# Check heartbeats
kubectl exec -it deployment/marie -n codehornets-ai -- cat /shared/heartbeats/marie-watcher.json
```

### Helm Chart (Recommended for Production)

```bash
# Install with Helm
helm install codehornets-ai ./infrastructure/helm/codehornets-ai \
  --namespace codehornets-ai \
  --create-namespace \
  --values infrastructure/helm/codehornets-ai/values-production.yaml

# Upgrade
helm upgrade codehornets-ai ./infrastructure/helm/codehornets-ai \
  --namespace codehornets-ai \
  --values infrastructure/helm/codehornets-ai/values-production.yaml

# Rollback
helm rollback codehornets-ai -n codehornets-ai
```

### Zero-Downtime Deployments

```yaml
# Deployment strategy
spec:
  replicas: 1  # Only 1 replica per worker (stateful)
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 0
      maxUnavailable: 1

  # Graceful shutdown
  terminationGracePeriodSeconds: 60

  # Health checks
  livenessProbe:
    exec:
      command: [test, -f, /shared/heartbeats/marie-watcher.json]
    initialDelaySeconds: 30
    periodSeconds: 30

  readinessProbe:
    exec:
      command: [test, -f, /shared/heartbeats/marie-watcher.json]
    initialDelaySeconds: 15
    periodSeconds: 10
```

---

## Multi-Mode Support

### Environment Variables

| Variable | Values | Description |
|----------|--------|-------------|
| `HOOKS_MODE` | `1` or empty | Enable hooks-based communication |
| `ACTIVATION_WRAPPER` | `1` or empty | Enable activation_wrapper.py |
| `ACTIVATION_MODE` | `inotify`, `redis`, `polling` | Activation method for wrapper |
| `REDIS_URL` | `redis://host:port` | Redis connection string |
| `TRIGGER_DIR` | `/shared/triggers` | Trigger files directory |
| `PIPE_DIR` | `/shared/pipes` | Named pipes directory |
| `HEARTBEAT_DIR` | `/shared/heartbeats` | Heartbeat files directory |
| `HEARTBEAT_INTERVAL` | `10` (seconds) | Heartbeat frequency |

### Mode Comparison

| Feature | Polling | Event-Driven | Hooks | Hybrid |
|---------|---------|--------------|-------|--------|
| **Latency** | ~1s | <10ms | <100ms | <10ms |
| **CPU (idle)** | ~2% | ~0% | ~1% | ~0% |
| **Dependencies** | None | watchdog, redis | watchdog | watchdog, redis |
| **Complexity** | ⭐ Simple | ⭐⭐ Moderate | ⭐⭐ Moderate | ⭐⭐⭐ Complex |
| **Observability** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Production Ready** | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## Performance Optimization

### Docker Compose Optimizations

```yaml
# Use BuildKit for faster builds
environment:
  DOCKER_BUILDKIT: 1

# Optimize volume mounts
volumes:
  - type: bind
    source: ./shared/triggers
    target: /shared/triggers
    bind:
      propagation: cached

# Resource limits
deploy:
  resources:
    limits:
      cpus: '1.0'
      memory: 2G
    reservations:
      cpus: '0.25'
      memory: 512M
```

### Kubernetes Optimizations

```yaml
# Resource requests and limits
resources:
  requests:
    memory: "512Mi"
    cpu: "250m"
  limits:
    memory: "2Gi"
    cpu: "1000m"

# Node affinity (spread workers across nodes)
affinity:
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        podAffinityTerm:
          labelSelector:
            matchLabels:
              app: codehornets-ai
          topologyKey: kubernetes.io/hostname

# Use local storage for triggers/pipes
volumes:
  - name: shared-triggers
    emptyDir:
      medium: Memory  # Use tmpfs for ultra-fast access
```

### Performance Benchmarks

```bash
# Run latency benchmark
make test-hooks

# Expected results:
# - Polling mode: ~1000ms average
# - Event-driven: <10ms average
# - Hooks mode: <100ms average
# - Hybrid mode: <10ms average
```

---

## Monitoring and Observability

### Health Checks

```bash
# Kubernetes health checks
kubectl get pods -n codehornets-ai
kubectl describe pod marie-xxx -n codehornets-ai

# Check watcher logs
kubectl logs -f deployment/marie -n codehornets-ai -c marie
kubectl exec -it deployment/marie -n codehornets-ai -- tail -f /var/log/marie-watcher.log

# Check heartbeats
kubectl exec -it deployment/marie -n codehornets-ai -- cat /shared/heartbeats/marie-watcher.json
```

### Prometheus Metrics (Optional)

```yaml
# Add metrics endpoint to hook_watcher.py
apiVersion: v1
kind: Service
metadata:
  name: marie-metrics
  labels:
    app: codehornets-ai
    worker: marie
spec:
  ports:
    - port: 9090
      name: metrics
  selector:
    app: codehornets-ai
    worker: marie
```

### Grafana Dashboard

Import dashboard from `infrastructure/monitoring/grafana-dashboard.json`:

- Trigger processing rate
- Average latency
- Error rate
- CPU/memory usage
- Heartbeat status

---

## Troubleshooting

See [HOOKS_TROUBLESHOOTING.md](./HOOKS_TROUBLESHOOTING.md) for comprehensive troubleshooting guide.

### Quick Diagnostics

```bash
# Check system status
make hooks-status

# Check container logs
docker logs marie -f

# Check watcher logs
tail -f infrastructure/docker/codehornets-ai/shared/watcher-logs/marie-watcher.log

# Check triggers
ls -la infrastructure/docker/codehornets-ai/shared/triggers/marie/

# Check pipes
ls -la infrastructure/docker/codehornets-ai/shared/pipes/

# Test manual trigger
echo '{"test": true}' > infrastructure/docker/codehornets-ai/shared/triggers/marie/test.trigger

# Restart system
make restart-hooks
```

---

## Next Steps

1. **Development**: Start with polling mode, switch to hooks for testing
2. **Staging**: Use hybrid mode with full observability
3. **Production**: Deploy to Kubernetes with zero-downtime strategy
4. **Monitoring**: Set up Prometheus/Grafana dashboards
5. **Scaling**: Consider multi-region deployment with Redis Cluster

## Additional Resources

- [Inter-Agent Communication Patterns](./INTER_AGENT_COMMUNICATION_PATTERNS.md)
- [Hooks Troubleshooting Guide](./HOOKS_TROUBLESHOOTING.md)
- [Claude Code Hooks Documentation](https://docs.anthropic.com/claude-code/hooks)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
