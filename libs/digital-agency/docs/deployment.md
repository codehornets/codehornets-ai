# Deployment Guide

## Overview

This guide covers deploying the Digital Agency Automation system across different environments.

## Prerequisites

- Docker 20.10+
- Kubernetes 1.24+ (for K8s deployment)
- Python 3.9+
- PostgreSQL 14+
- Redis 6+

## Environment Configuration

### Environment Variables

Create a `.env` file:

```bash
# Application
APP_ENV=production
APP_DEBUG=false
SECRET_KEY=your-secret-key-here

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/digital_agency
DATABASE_POOL_SIZE=20

# Redis
REDIS_URL=redis://localhost:6379/0

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# API
API_HOST=0.0.0.0
API_PORT=8000
API_WORKERS=4

# Monitoring
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=INFO
```

## Local Development

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Initialize Database

```bash
python scripts/migrate_db.py up
```

### 3. Start Services

```bash
# Start API
uvicorn api.main:app --reload --port 8000

# Or use the script
python -m api.main
```

### 4. Verify Installation

```bash
curl http://localhost:8000/api/v1/health
```

## Docker Deployment

### Build Images

```bash
# Build API image
docker build -t digital-agency-api:latest -f deployment/docker/Dockerfile.api .

# Build agent image
docker build -t digital-agency-agent:latest -f deployment/docker/Dockerfile.agent .
```

### Run with Docker Compose

```bash
cd deployment/docker
docker-compose up -d
```

### Docker Compose Services

The `docker-compose.yml` includes:
- API server
- PostgreSQL database
- Redis cache
- Agent workers
- Monitoring tools

### Verify Docker Deployment

```bash
docker-compose ps
docker-compose logs -f api
```

## Kubernetes Deployment

### 1. Configure kubectl

```bash
kubectl config use-context your-cluster
```

### 2. Create Namespace

```bash
kubectl create namespace digital-agency
```

### 3. Deploy Secrets

```bash
kubectl create secret generic api-secrets \
  --from-env-file=.env \
  --namespace=digital-agency
```

### 4. Deploy Database

```bash
kubectl apply -f deployment/kubernetes/database/ -n digital-agency
```

### 5. Deploy Redis

```bash
kubectl apply -f deployment/kubernetes/redis/ -n digital-agency
```

### 6. Deploy API

```bash
kubectl apply -f deployment/kubernetes/services/api-deployment.yaml -n digital-agency
kubectl apply -f deployment/kubernetes/services/api-service.yaml -n digital-agency
```

### 7. Deploy Agents

```bash
kubectl apply -f deployment/kubernetes/agents/ -n digital-agency
```

### 8. Deploy Ingress

```bash
kubectl apply -f deployment/kubernetes/ingress/ -n digital-agency
```

### Verify K8s Deployment

```bash
kubectl get pods -n digital-agency
kubectl get services -n digital-agency
kubectl logs -f deployment/api -n digital-agency
```

## Terraform Deployment

### Initialize Terraform

```bash
cd deployment/terraform
terraform init
```

### Plan Deployment

```bash
terraform plan -var-file=environments/production.tfvars
```

### Apply Infrastructure

```bash
terraform apply -var-file=environments/production.tfvars
```

### Terraform Components

- VPC and networking
- EKS cluster
- RDS database
- ElastiCache Redis
- Load balancers
- Security groups
- IAM roles

## Production Deployment

### 1. Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Security scan completed
- [ ] Database migrations ready
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Monitoring configured
- [ ] Backup strategy in place
- [ ] Rollback plan prepared

### 2. Database Migration

```bash
# Backup current database
pg_dump digital_agency > backup_$(date +%Y%m%d).sql

# Run migrations
python scripts/migrate_db.py up

# Verify migrations
python scripts/migrate_db.py list
```

### 3. Deploy API

```bash
# Build production image
docker build -t digital-agency-api:v1.0.0 -f deployment/docker/Dockerfile.api .

# Push to registry
docker push your-registry/digital-agency-api:v1.0.0

# Deploy to K8s
kubectl set image deployment/api api=your-registry/digital-agency-api:v1.0.0 -n digital-agency

# Verify deployment
kubectl rollout status deployment/api -n digital-agency
```

### 4. Deploy Agents

```bash
python scripts/deploy_agent.py domains/marketing/agents/campaign_creator.py \
  --environment prod \
  --version 1.0.0
```

### 5. Smoke Tests

```bash
# Test health endpoint
curl https://api.yourdomain.com/api/v1/health

# Test authentication
curl -H "Authorization: Bearer $TOKEN" \
  https://api.yourdomain.com/api/v1/agents

# Test agent creation
curl -X POST https://api.yourdomain.com/api/v1/agents \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Agent","domain":"marketing"}'
```

## Scaling

### Horizontal Pod Autoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Manual Scaling

```bash
# Scale API
kubectl scale deployment/api --replicas=5 -n digital-agency

# Scale specific agent
kubectl scale deployment/marketing-agent --replicas=3 -n digital-agency
```

## Monitoring

### Metrics

Access Prometheus metrics:
```
http://monitoring.yourdomain.com/metrics
```

### Dashboards

Access Grafana dashboards:
```
http://monitoring.yourdomain.com/grafana
```

### Logs

View centralized logs:
```bash
# Kubernetes
kubectl logs -f deployment/api -n digital-agency

# ELK Stack
http://logs.yourdomain.com
```

### Alerts

Configure alerts in `monitoring/alerts.py` or Prometheus alerting rules.

## Backup and Recovery

### Database Backup

```bash
# Automated daily backup
0 2 * * * pg_dump digital_agency > /backups/db_$(date +\%Y\%m\%d).sql

# Backup to S3
aws s3 cp /backups/db_$(date +%Y%m%d).sql s3://your-backup-bucket/
```

### Restore from Backup

```bash
# Restore database
psql digital_agency < backup_20250115.sql

# Verify restoration
psql digital_agency -c "SELECT COUNT(*) FROM agents;"
```

### Configuration Backup

```bash
# Backup K8s configurations
kubectl get all -n digital-agency -o yaml > k8s-backup.yaml

# Backup secrets
kubectl get secrets -n digital-agency -o yaml > secrets-backup.yaml
```

## Rollback Procedures

### Rollback Deployment

```bash
# K8s rollback
kubectl rollout undo deployment/api -n digital-agency

# Rollback to specific revision
kubectl rollout undo deployment/api --to-revision=2 -n digital-agency
```

### Rollback Database

```bash
# Run down migration
python scripts/migrate_db.py down migration_name

# Restore from backup
psql digital_agency < backup_20250115.sql
```

## Security

### SSL/TLS Configuration

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: tls-secret
type: kubernetes.io/tls
data:
  tls.crt: <base64-encoded-cert>
  tls.key: <base64-encoded-key>
```

### Network Policies

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-network-policy
spec:
  podSelector:
    matchLabels:
      app: api
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          role: frontend
    ports:
    - protocol: TCP
      port: 8000
```

### Security Best Practices

1. Use secrets for sensitive data
2. Enable RBAC in Kubernetes
3. Regular security updates
4. Network isolation
5. Audit logging
6. Rate limiting
7. Input validation

## Troubleshooting

### Common Issues

**API not starting:**
```bash
# Check logs
kubectl logs deployment/api -n digital-agency

# Check pod status
kubectl describe pod <pod-name> -n digital-agency
```

**Database connection issues:**
```bash
# Test connection
kubectl run -it --rm debug --image=postgres:14 --restart=Never -- \
  psql -h postgres -U user -d digital_agency
```

**Agent not processing tasks:**
```bash
# Check agent logs
kubectl logs deployment/marketing-agent -n digital-agency

# Check agent status
curl http://api/v1/agents/{agent_id}
```

## Performance Tuning

### API Performance

```python
# Increase workers
uvicorn api.main:app --workers 8 --port 8000

# Enable caching
ENABLE_CACHE=true
CACHE_TTL=300
```

### Database Optimization

```sql
-- Add indexes
CREATE INDEX idx_tasks_agent_id ON tasks(agent_id);
CREATE INDEX idx_tasks_status ON tasks(status);

-- Vacuum regularly
VACUUM ANALYZE;
```

### Resource Limits

```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "500m"
  limits:
    memory: "512Mi"
    cpu: "1000m"
```

## Maintenance

### Regular Tasks

- Daily: Check logs for errors
- Weekly: Review metrics and performance
- Monthly: Update dependencies
- Quarterly: Security audit

### Updates

```bash
# Update application
docker pull your-registry/digital-agency-api:latest
kubectl rollout restart deployment/api -n digital-agency

# Update dependencies
pip install --upgrade -r requirements.txt
```
