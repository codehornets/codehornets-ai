# HandyMate CRM - Infrastructure

This directory contains all infrastructure-as-code, deployment configurations, and operational scripts for HandyMate CRM across multiple platforms.

## 📁 Directory Structure

```
infrastructure/
├── terraform/          # Multi-cloud IaC (AWS, GCP, Azure)
│   ├── aws/           # AWS ECS/Fargate deployment
│   ├── gcp/           # Google Cloud Run deployment
│   ├── azure/         # Azure Container Apps deployment
│   └── environments/  # Environment-specific configs (dev, staging, production)
├── docker/            # Docker Compose for local development
├── kubernetes/        # Kubernetes manifests (base + overlays)
├── railway/           # Railway PaaS deployment
├── render/            # Render PaaS deployment
└── systemd/           # systemd service definitions
```

## 🚀 Quick Start

### Local Development
```bash
# From project root
make dev-setup      # Complete local environment setup
make up             # Start all Docker services (22 containers)
make logs           # View logs for all services
make test-all       # Run tests for all 8 modules
```

### Cloud Deployment

#### AWS (ECS Fargate)
```bash
make aws-init               # Initialize Terraform backend
make aws-plan ENV=prod      # Preview changes
make aws-deploy ENV=prod    # Deploy to AWS
make aws-status             # Check deployment status
```

#### Google Cloud Platform (Cloud Run)
```bash
make gcp-deploy ENV=prod    # Deploy to GCP
make gcp-status             # Check deployment status
```

#### Azure (Container Apps)
```bash
make azure-deploy ENV=prod  # Deploy to Azure
make azure-status           # Check deployment status
```

#### Railway (PaaS)
```bash
make railway-deploy         # Deploy to Railway
```

#### Render (PaaS)
```bash
make render-deploy          # Deploy to Render
```

### Kubernetes
```bash
make k8s-apply              # Deploy to Kubernetes cluster
make k8s-status             # Check deployment status
make k8s-logs MODULE=developer  # View module logs
```

## 📚 Documentation

- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) - Multi-cloud deployment instructions
- [Infrastructure Validation](docs/INFRASTRUCTURE_VALIDATION_AND_COST_ANALYSIS.md) - Cost analysis & validation
- [Cloud Cost Analysis](docs/CLOUD_COST_ANALYSIS_2025.md) - 2025 cost projections
- [Structure Guide](docs/STRUCTURE.md) - Infrastructure organization

## 🛠️ Key Commands

### Development & Testing
| Command | Description |
|---------|-------------|
| `make dev-setup` | Complete local environment setup |
| `make up` | Start all Docker services |
| `make down` | Stop all Docker services |
| `make test-all` | Run tests for all modules |
| `make lint` | Run code quality checks |
| `make security-scan` | Run security scanning |

### Database Operations
| Command | Description |
|---------|-------------|
| `make db-migrate-all` | Run migrations for all modules |
| `make db-seed-all` | Seed databases for all modules |
| `make db-reset` | Reset all databases |

### Cloud Deployment
| Command | Description |
|---------|-------------|
| `make aws-deploy ENV=prod` | Deploy to AWS ECS |
| `make gcp-deploy ENV=prod` | Deploy to GCP Cloud Run |
| `make azure-deploy ENV=prod` | Deploy to Azure Container Apps |
| `make railway-deploy` | Deploy to Railway |
| `make render-deploy` | Deploy to Render |
| `make k8s-apply` | Deploy to Kubernetes |

### Monitoring
| Command | Description |
|---------|-------------|
| `make status` | Show comprehensive deployment status |
| `make health-check` | Run health checks on all services |
| `make logs` | View logs for all services |

## 🏗️ Infrastructure Components

### CRM Modules (8 Total)
All modules deployed with the same architecture pattern:
- **developer** - Developer/freelancer management CRM
- **dancer** - Dance studio/instructor management CRM
- **painter** - Artist/painting services CRM
- **driver** - Transportation/delivery CRM
- **influencer** - Social media influencer CRM
- **hunter** - Recruitment/headhunter CRM
- **seller** - Sales/e-commerce CRM
- **trader** - Trading/brokerage CRM

### Terraform Modules (Multi-Cloud)

#### AWS Resources
- **vpc** - VPC, subnets, NAT gateways, security groups
- **rds** - MySQL 8.0 with Multi-AZ HA (8 databases + n8n)
- **elasticache** - Redis 7.0 for caching and queues
- **s3** - S3 buckets with intelligent tiering
- **ecr** - Container registry (9 repositories)
- **alb** - Application Load Balancer with SSL
- **ecs** - ECS Fargate services (8 CRM + 1 n8n + 8 workers)
- **secretsmanager** - Secrets with auto-rotation

#### GCP Resources
- **cloud-run** - Serverless container deployments
- **cloud-sql** - Managed MySQL instances
- **memorystore** - Managed Redis
- **artifact-registry** - Container images

#### Azure Resources
- **container-apps** - Serverless containers
- **database-mysql** - Managed MySQL
- **redis-cache** - Azure Cache for Redis
- **acr** - Azure Container Registry

### Kubernetes Resources
- **base/** - Core manifests (deployments, services, ingress)
- **overlays/** - Environment-specific configs (dev, staging, production)
- **argocd/** - GitOps deployment automation

## 🔒 Security

- **Secrets Management** - AWS Secrets Manager with auto-rotation
- **Encryption** - At-rest and in-transit encryption for all data
- **Network Isolation** - VPC private subnets, security groups
- **IAM Roles** - Least privilege access with task-specific roles
- **Auto-generated Passwords** - 32-character random passwords
- **Container Security** - Automated vulnerability scanning in CI/CD
- **SSL/TLS** - HTTPS enforcement with ACM certificates

## 💰 Cost Optimization

### AWS Production (Optimized)
- **ECS Fargate** - Auto-scaling based on CPU/memory metrics
- **RDS MySQL** - Multi-AZ with read replicas for high traffic
- **ElastiCache Redis** - Cluster mode for distributed caching
- **S3** - Intelligent-Tiering for automatic cost optimization
- **Estimated Cost**: $1,047/month (with reserved instances)

### PaaS Alternatives (Lower Cost)
- **Railway** - ~$20-50/month for small workloads
- **Render** - ~$25-75/month with auto-scaling
- **GCP Cloud Run** - Pay-per-request, ideal for variable traffic
- **Azure Container Apps** - Consumption-based pricing

See [Cloud Cost Analysis 2025](docs/CLOUD_COST_ANALYSIS_2025.md) for detailed breakdowns.

## 🏢 Deployment Platforms

| Platform | Use Case | Cost | Scalability | Complexity |
|----------|----------|------|-------------|------------|
| **AWS ECS** | Production, high traffic | $$$ | Excellent | High |
| **GCP Cloud Run** | Serverless, variable traffic | $$ | Excellent | Medium |
| **Azure Container Apps** | Enterprise, Azure ecosystem | $$$ | Excellent | High |
| **Railway** | Quick deployment, small teams | $ | Good | Low |
| **Render** | Simplicity, managed services | $$ | Good | Low |
| **Kubernetes** | Full control, multi-cloud | $$$ | Excellent | Very High |
| **Docker Local** | Development, testing | Free | N/A | Low |

## 📞 Support

For infrastructure issues:
1. Check the [Makefile](../Makefile) for available commands: `make help`
2. Review [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) for platform-specific instructions
3. Check [Infrastructure Validation](docs/INFRASTRUCTURE_VALIDATION_AND_COST_ANALYSIS.md) for known issues
4. Review logs: `make logs` or platform-specific dashboards

## 🔄 Platform Support Matrix

| Feature | AWS | GCP | Azure | Railway | Render | K8s |
|---------|-----|-----|-------|---------|--------|-----|
| Auto-scaling | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Load balancing | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| SSL certificates | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Database HA | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| Redis caching | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Container registry | ECR | Artifact | ACR | Built-in | Built-in | Any |
| Cost optimization | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| One-command deploy | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
