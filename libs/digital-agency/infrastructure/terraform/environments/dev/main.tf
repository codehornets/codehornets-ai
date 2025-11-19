# PainterFlow CRM - Development Infrastructure
# Main Terraform configuration

# Local variables for common values
locals {
  name_prefix = "${var.project_name}-${var.environment}"
  common_tags = merge(var.tags, {
    Environment = var.environment
    Project     = var.project_name
  })
}

# VPC and Networking
module "networking" {
  source = "../../aws/modules/networking"

  vpc_cidr                 = var.vpc_cidr
  availability_zones       = var.availability_zones
  private_subnet_cidrs     = var.private_subnet_cidrs
  public_subnet_cidrs      = var.public_subnet_cidrs
  database_subnet_cidrs    = var.database_subnet_cidrs
  enable_nat_gateway       = var.enable_nat_gateway
  single_nat_gateway       = var.single_nat_gateway
  enable_vpn_gateway       = false

  name_prefix = local.name_prefix
  tags        = local.common_tags
}

# EKS Cluster
module "eks" {
  source = "../../aws/modules/eks"

  cluster_name    = var.cluster_name
  cluster_version = var.cluster_version

  vpc_id             = module.networking.vpc_id
  private_subnet_ids = module.networking.private_subnet_ids
  public_subnet_ids  = module.networking.public_subnet_ids

  node_groups = var.node_groups

  enable_cluster_autoscaler    = var.enable_cluster_autoscaler
  enable_aws_load_balancer_controller = true
  enable_ebs_csi_driver       = true
  enable_efs_csi_driver       = false

  tags = local.common_tags
}

# RDS MySQL Database
module "rds" {
  source = "../../aws/modules/rds"

  identifier                      = "${local.name_prefix}-mysql"
  engine                          = "mysql"
  engine_version                  = var.db_engine_version
  instance_class                  = var.db_instance_class
  allocated_storage               = var.db_allocated_storage
  max_allocated_storage           = var.db_max_allocated_storage
  storage_encrypted               = var.enable_encryption_at_rest

  db_name  = var.db_name
  username = var.db_username
  port     = 3306

  multi_az               = var.db_multi_az
  subnet_ids             = module.networking.database_subnet_ids
  vpc_security_group_ids = [module.networking.database_security_group_id]

  backup_retention_period      = var.db_backup_retention_period
  backup_window                = var.db_backup_window
  maintenance_window           = var.db_maintenance_window
  deletion_protection          = var.db_deletion_protection
  skip_final_snapshot          = var.db_skip_final_snapshot
  final_snapshot_identifier    = "${local.name_prefix}-mysql-final-snapshot"

  performance_insights_enabled = var.db_performance_insights_enabled
  enabled_cloudwatch_logs_exports = var.db_enabled_cloudwatch_logs_exports

  tags = local.common_tags
}

# ElastiCache Redis
module "elasticache" {
  source = "../../aws/modules/elasticache"

  cluster_id                   = "${local.name_prefix}-redis"
  engine                       = "redis"
  engine_version               = var.redis_engine_version
  node_type                    = var.redis_node_type
  num_cache_nodes              = var.redis_num_cache_nodes
  parameter_group_family       = var.redis_parameter_group_family
  port                         = var.redis_port

  subnet_ids             = module.networking.private_subnet_ids
  security_group_ids     = [module.networking.cache_security_group_id]

  automatic_failover_enabled = var.redis_automatic_failover_enabled
  multi_az_enabled           = var.redis_multi_az_enabled
  at_rest_encryption_enabled = var.redis_at_rest_encryption_enabled
  transit_encryption_enabled = var.redis_transit_encryption_enabled

  snapshot_retention_limit = var.redis_snapshot_retention_limit
  snapshot_window          = var.redis_snapshot_window

  tags = local.common_tags
}

# S3 Buckets
module "s3" {
  source = "../../aws/modules/s3"

  for_each = var.s3_buckets

  bucket_name      = each.value.name
  versioning       = each.value.versioning
  lifecycle_rules  = each.value.lifecycle_rules
  encryption       = var.enable_encryption_at_rest

  tags = local.common_tags
}

# ECR Repository
module "ecr" {
  source = "../../aws/modules/ecr"

  repository_name = "${var.project_name}-app"
  image_tag_mutability = "MUTABLE"
  scan_on_push         = false  # Disabled for dev

  lifecycle_policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 10 images"
      selection = {
        tagStatus     = "any"
        countType     = "imageCountMoreThan"
        countNumber   = 10
      }
      action = {
        type = "expire"
      }
    }]
  })

  tags = local.common_tags
}

# Application Load Balancer
module "alb" {
  source = "../../aws/modules/alb"

  name               = var.alb_name
  internal           = var.alb_internal
  vpc_id             = module.networking.vpc_id
  subnets            = module.networking.public_subnet_ids
  security_group_ids = [module.networking.alb_security_group_id]

  enable_deletion_protection = var.alb_enable_deletion_protection
  enable_http2               = var.alb_enable_http2
  enable_waf                 = var.alb_enable_waf
  ssl_policy                 = var.alb_ssl_policy

  tags = local.common_tags
}

# CloudWatch Monitoring
module "monitoring" {
  source = "../../aws/modules/monitoring"
  count  = var.enable_cloudwatch_logs ? 1 : 0

  log_group_name    = "/aws/eks/${var.cluster_name}"
  retention_in_days = var.log_retention_days

  enable_container_insights = var.enable_container_insights

  tags = local.common_tags
}
