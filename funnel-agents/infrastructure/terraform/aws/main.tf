# =============================================================================
# FunnelAgents - AWS ECS Infrastructure
# Multi-service deployment using ECS Fargate
# =============================================================================

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }

  # Remote state storage (required for production)
  backend "s3" {
    bucket         = "funnelagents-terraform-state"
    key            = "aws/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "funnelagents-terraform-lock"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = merge(
      var.common_tags,
      {
        Project     = var.project_name
        Environment = var.environment
        ManagedBy   = "Terraform"
      }
    )
  }
}

# =============================================================================
# Data Sources
# =============================================================================

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# =============================================================================
# VPC Module
# =============================================================================

module "vpc" {
  source = "./modules/vpc"

  environment          = var.environment
  vpc_cidr             = var.vpc_cidr
  availability_zones   = slice(data.aws_availability_zones.available.names, 0, min(3, length(data.aws_availability_zones.available.names)))
  private_subnet_cidrs = var.private_subnet_cidrs
  public_subnet_cidrs  = var.public_subnet_cidrs

  tags = var.common_tags
}

# =============================================================================
# ECR Repositories
# =============================================================================

# ECR for backend services
resource "aws_ecr_repository" "backend_services" {
  for_each = toset(var.backend_services)

  name                 = "${var.project_name}-${each.key}"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = merge(
    var.common_tags,
    {
      Service = each.key
    }
  )
}

# ECR for web-ui
resource "aws_ecr_repository" "web_ui" {
  count = var.enable_web_ui ? 1 : 0

  name                 = "${var.project_name}-web-ui"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = var.common_tags
}

# ECR for n8n
resource "aws_ecr_repository" "n8n" {
  name                 = "${var.project_name}-n8n"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = var.common_tags
}

# =============================================================================
# Secrets Manager - Secure credential storage
# =============================================================================

# Generate random passwords
resource "random_password" "db_password" {
  count   = var.db_password == "" ? 1 : 0
  length  = 32
  special = true
}

resource "random_password" "jwt_secret" {
  count   = var.jwt_secret == "" ? 1 : 0
  length  = 64
  special = false
}

resource "random_password" "n8n_encryption_key" {
  count   = var.n8n_encryption_key == "" ? 1 : 0
  length  = 32
  special = false
}

# Store database credentials
resource "aws_secretsmanager_secret" "db_credentials" {
  name_prefix             = "${var.project_name}-${var.environment}-db-"
  description             = "PostgreSQL credentials for FunnelAgents ${var.environment}"
  recovery_window_in_days = var.environment == "production" ? 30 : 7

  tags = merge(
    var.common_tags,
    {
      Name = "${var.project_name}-${var.environment}-db-credentials"
    }
  )
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = var.db_username
    password = var.db_password != "" ? var.db_password : random_password.db_password[0].result
    engine   = "postgres"
    host     = module.rds.db_instance_endpoint
    port     = 5432
    dbname   = var.db_name
  })

  depends_on = [module.rds]
}

# Store JWT secret
resource "aws_secretsmanager_secret" "jwt_secret" {
  name_prefix             = "${var.project_name}-${var.environment}-jwt-"
  description             = "JWT secret for FunnelAgents ${var.environment}"
  recovery_window_in_days = var.environment == "production" ? 30 : 7

  tags = var.common_tags
}

resource "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id = aws_secretsmanager_secret.jwt_secret.id
  secret_string = jsonencode({
    secret     = var.jwt_secret != "" ? var.jwt_secret : random_password.jwt_secret[0].result
    expiration = var.jwt_expiration
  })
}

# Store n8n encryption key
resource "aws_secretsmanager_secret" "n8n_encryption_key" {
  name_prefix             = "${var.project_name}-${var.environment}-n8n-"
  description             = "n8n encryption key for FunnelAgents ${var.environment}"
  recovery_window_in_days = var.environment == "production" ? 30 : 7

  tags = var.common_tags
}

resource "aws_secretsmanager_secret_version" "n8n_encryption_key" {
  secret_id = aws_secretsmanager_secret.n8n_encryption_key.id
  secret_string = jsonencode({
    encryption_key = var.n8n_encryption_key != "" ? var.n8n_encryption_key : random_password.n8n_encryption_key[0].result
  })
}

# =============================================================================
# RDS PostgreSQL Database
# =============================================================================

module "rds" {
  source = "./modules/rds"

  environment           = var.environment
  identifier            = "${var.project_name}-${var.environment}"
  instance_class        = var.db_instance_class
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  engine_version        = var.db_engine_version
  database_name         = var.db_name
  master_username       = var.db_username
  master_password       = var.db_password != "" ? var.db_password : random_password.db_password[0].result
  vpc_id                = module.vpc.vpc_id
  subnet_ids            = module.vpc.private_subnet_ids
  allowed_cidr_blocks   = module.vpc.private_subnet_cidrs

  backup_retention_period = var.environment == "production" ? 7 : 1
  multi_az                = var.environment == "production" ? true : false
  skip_final_snapshot     = var.environment != "production"

  tags = var.common_tags
}

# =============================================================================
# ElastiCache Redis Cluster
# =============================================================================

module "elasticache" {
  source = "./modules/elasticache"

  environment         = var.environment
  cluster_id          = "${var.project_name}-${var.environment}"
  node_type           = var.redis_node_type
  num_cache_nodes     = var.redis_num_nodes
  engine_version      = var.redis_version
  vpc_id              = module.vpc.vpc_id
  subnet_ids          = module.vpc.private_subnet_ids
  allowed_cidr_blocks = module.vpc.private_subnet_cidrs

  tags = var.common_tags
}

# =============================================================================
# ECS Cluster
# =============================================================================

resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-${var.environment}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = var.common_tags
}

resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 1
    base              = 1
  }
}

# =============================================================================
# CloudWatch Log Groups
# =============================================================================

# Log groups for backend services
resource "aws_cloudwatch_log_group" "backend_services" {
  for_each = toset(var.backend_services)

  name              = "/ecs/${var.project_name}/${each.key}"
  retention_in_days = var.environment == "production" ? 30 : 7

  tags = merge(
    var.common_tags,
    {
      Service = each.key
    }
  )
}

# Log group for web-ui
resource "aws_cloudwatch_log_group" "web_ui" {
  count = var.enable_web_ui ? 1 : 0

  name              = "/ecs/${var.project_name}/web-ui"
  retention_in_days = var.environment == "production" ? 30 : 7

  tags = var.common_tags
}

# Log group for n8n
resource "aws_cloudwatch_log_group" "n8n" {
  name              = "/ecs/${var.project_name}/n8n"
  retention_in_days = var.environment == "production" ? 30 : 7

  tags = var.common_tags
}

# Log groups for n8n workers
resource "aws_cloudwatch_log_group" "n8n_workers" {
  for_each = toset(var.n8n_workers)

  name              = "/ecs/${var.project_name}/n8n-worker-${each.key}"
  retention_in_days = var.environment == "production" ? 30 : 7

  tags = merge(
    var.common_tags,
    {
      Worker = each.key
      Type   = "n8n-worker"
    }
  )
}

# =============================================================================
# IAM Roles
# =============================================================================

# ECS Task Execution Role
resource "aws_iam_role" "ecs_task_execution" {
  name = "${var.project_name}-${var.environment}-ecs-execution"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = var.common_tags
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ECR access policy
resource "aws_iam_role_policy" "ecs_task_execution_ecr" {
  name = "ecr-access"
  role = aws_iam_role.ecs_task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage"
        ]
        Resource = "*"
      }
    ]
  })
}

# Secrets Manager access policy
resource "aws_iam_role_policy" "ecs_task_execution_secrets" {
  name = "secrets-access"
  role = aws_iam_role.ecs_task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          aws_secretsmanager_secret.db_credentials.arn,
          aws_secretsmanager_secret.jwt_secret.arn,
          aws_secretsmanager_secret.n8n_encryption_key.arn
        ]
      }
    ]
  })
}

# ECS Task Role
resource "aws_iam_role" "ecs_task" {
  name = "${var.project_name}-${var.environment}-ecs-task"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = var.common_tags
}

# =============================================================================
# Security Groups
# =============================================================================

# ALB Security Group
resource "aws_security_group" "alb" {
  name        = "${var.project_name}-${var.environment}-alb"
  description = "Security group for Application Load Balancer"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description = "HTTP from Internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from Internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    var.common_tags,
    {
      Name = "${var.project_name}-${var.environment}-alb"
    }
  )
}

# ECS Tasks Security Group
resource "aws_security_group" "ecs_tasks" {
  name        = "${var.project_name}-${var.environment}-ecs-tasks"
  description = "Security group for ECS tasks"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description     = "Traffic from ALB"
    from_port       = 0
    to_port         = 65535
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description = "Traffic from within VPC"
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    var.common_tags,
    {
      Name = "${var.project_name}-${var.environment}-ecs-tasks"
    }
  )
}

# =============================================================================
# Application Load Balancer
# =============================================================================

resource "aws_lb" "main" {
  name               = "${var.project_name}-${var.environment}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = module.vpc.public_subnet_ids

  enable_deletion_protection       = var.environment == "production"
  enable_http2                     = true
  enable_cross_zone_load_balancing = true

  tags = var.common_tags
}

# Target Groups for backend services
resource "aws_lb_target_group" "backend_services" {
  for_each = toset(var.backend_services)

  name        = "${substr(var.project_name, 0, 8)}-${substr(each.key, 0, 12)}-${substr(var.environment, 0, 4)}"
  port        = var.service_ports[each.key]
  protocol    = "HTTP"
  vpc_id      = module.vpc.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200-399"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 3
  }

  deregistration_delay = 30

  tags = merge(
    var.common_tags,
    {
      Service = each.key
    }
  )
}

# Target Group for web-ui
resource "aws_lb_target_group" "web_ui" {
  count = var.enable_web_ui ? 1 : 0

  name        = "${var.project_name}-web-ui-${var.environment}"
  port        = var.service_ports["web-ui"]
  protocol    = "HTTP"
  vpc_id      = module.vpc.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200-399"
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 3
  }

  deregistration_delay = 30

  tags = var.common_tags
}

# Target Group for n8n
resource "aws_lb_target_group" "n8n" {
  name        = "${var.project_name}-n8n-${var.environment}"
  port        = var.service_ports["n8n"]
  protocol    = "HTTP"
  vpc_id      = module.vpc.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200-399"
    path                = "/healthz"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 3
  }

  deregistration_delay = 30

  tags = var.common_tags
}

# ALB Listener (HTTP)
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend_services["api-gateway"].arn
  }

  tags = var.common_tags
}

# Listener Rules for n8n
resource "aws_lb_listener_rule" "n8n" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.n8n.arn
  }

  condition {
    path_pattern {
      values = ["/n8n/*", "/webhook/*"]
    }
  }

  tags = var.common_tags
}

# =============================================================================
# S3 Bucket for file storage
# =============================================================================

resource "aws_s3_bucket" "storage" {
  bucket = "${var.project_name}-${var.environment}-storage"

  tags = var.common_tags
}

resource "aws_s3_bucket_versioning" "storage" {
  bucket = aws_s3_bucket.storage.id

  versioning_configuration {
    status = var.environment == "production" ? "Enabled" : "Suspended"
  }
}

resource "aws_s3_bucket_public_access_block" "storage" {
  bucket = aws_s3_bucket.storage.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "storage" {
  bucket = aws_s3_bucket.storage.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# =============================================================================
# Outputs
# =============================================================================

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "ecs_cluster_arn" {
  description = "ECS cluster ARN"
  value       = aws_ecs_cluster.main.arn
}

output "alb_dns_name" {
  description = "Application Load Balancer DNS name"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Application Load Balancer Zone ID"
  value       = aws_lb.main.zone_id
}

output "db_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = module.rds.db_endpoint
  sensitive   = true
}

output "redis_endpoint" {
  description = "ElastiCache Redis endpoint"
  value       = module.elasticache.redis_endpoint
}

output "ecr_repositories" {
  description = "ECR repository URLs"
  value = merge(
    {
      for k, v in aws_ecr_repository.backend_services : k => v.repository_url
    },
    {
      n8n = aws_ecr_repository.n8n.repository_url
    },
    var.enable_web_ui ? {
      web-ui = aws_ecr_repository.web_ui[0].repository_url
    } : {}
  )
}

output "s3_bucket_name" {
  description = "S3 bucket for file storage"
  value       = aws_s3_bucket.storage.bucket
}

output "ecs_task_execution_role_arn" {
  description = "ECS task execution role ARN"
  value       = aws_iam_role.ecs_task_execution.arn
}

output "ecs_task_role_arn" {
  description = "ECS task role ARN"
  value       = aws_iam_role.ecs_task.arn
}

output "ecs_security_group_id" {
  description = "ECS tasks security group ID"
  value       = aws_security_group.ecs_tasks.id
}

output "private_subnet_ids" {
  description = "Private subnet IDs for ECS tasks"
  value       = module.vpc.private_subnet_ids
}

output "service_target_groups" {
  description = "Target group ARNs for each service"
  value = {
    for k, v in aws_lb_target_group.backend_services : k => v.arn
  }
}
