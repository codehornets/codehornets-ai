# HandyMate - ECS Task Definitions and Services

# ECS Task Definitions for CRM Modules
resource "aws_ecs_task_definition" "app_modules" {
  for_each = toset(var.app_modules)

  family                   = "${var.project_name}-${each.key}-${var.environment}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = try(var.module_configs[each.key].cpu, var.ecs_cpu)
  memory                   = try(var.module_configs[each.key].memory, var.ecs_memory)
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = each.key
      image     = "${aws_ecr_repository.app_modules[each.key].repository_url}:${var.container_image_tag}"
      essential = true

      portMappings = [
        {
          containerPort = 80
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "APP_ENV"
          value = var.environment
        },
        {
          name  = "APP_DEBUG"
          value = var.environment == "production" ? "false" : "true"
        },
        {
          name  = "APP_MODULE"
          value = each.key
        },
        {
          name  = "DB_CONNECTION"
          value = "mysql"
        },
        {
          name  = "DB_HOST"
          value = module.rds.db_endpoint
        },
        {
          name  = "DB_PORT"
          value = "3306"
        },
        {
          name  = "DB_DATABASE"
          value = "handymate_${each.key}"
        },
        {
          name  = "DB_USERNAME"
          value = var.db_username
        },
        {
          name  = "REDIS_HOST"
          value = module.elasticache.redis_endpoint
        },
        {
          name  = "REDIS_PORT"
          value = "6379"
        },
        {
          name  = "REDIS_PASSWORD"
          value = ""
        },
        {
          name  = "CACHE_DRIVER"
          value = "redis"
        },
        {
          name  = "QUEUE_CONNECTION"
          value = "redis"
        },
        {
          name  = "SESSION_DRIVER"
          value = "redis"
        },
        {
          name  = "N8N_WEBHOOK_URL"
          value = "http://${aws_lb.main.dns_name}/workflow/webhook"
        }
      ]

      secrets = [
        {
          name      = "DB_PASSWORD"
          valueFrom = "${aws_secretsmanager_secret.db_credentials.arn}:password::"
        },
        {
          name      = "APP_KEY"
          valueFrom = "${aws_secretsmanager_secret.app_keys[each.key].arn}:app_key::"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.app_modules[each.key].name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = merge(
    var.common_tags,
    {
      Module = each.key
    }
  )
}

# ECS Services for CRM Modules
resource "aws_ecs_service" "app_modules" {
  for_each = toset(var.app_modules)

  name            = "${var.project_name}-${each.key}-${var.environment}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app_modules[each.key].arn
  desired_count   = try(var.module_configs[each.key].desired_count, var.ecs_desired_count)

  launch_type = "FARGATE"

  network_configuration {
    subnets          = module.vpc.private_subnet_ids
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app_modules[each.key].arn
    container_name   = each.key
    container_port   = 80
  }


  enable_execute_command = var.environment != "production"

  tags = merge(
    var.common_tags,
    {
      Module = each.key
    }
  )

  depends_on = [
    aws_lb_listener.http,
    aws_lb_target_group.app_modules
  ]
}

# Auto Scaling for CRM Modules
resource "aws_appautoscaling_target" "app_modules" {
  for_each = toset(var.app_modules)

  max_capacity       = try(var.module_configs[each.key].max_capacity, var.ecs_max_capacity)
  min_capacity       = try(var.module_configs[each.key].min_capacity, var.ecs_min_capacity)
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.app_modules[each.key].name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# Auto Scaling Policy - CPU Based
resource "aws_appautoscaling_policy" "app_modules_cpu" {
  for_each = toset(var.app_modules)

  name               = "${var.project_name}-${each.key}-cpu-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.app_modules[each.key].resource_id
  scalable_dimension = aws_appautoscaling_target.app_modules[each.key].scalable_dimension
  service_namespace  = aws_appautoscaling_target.app_modules[each.key].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Auto Scaling Policy - Memory Based
resource "aws_appautoscaling_policy" "app_modules_memory" {
  for_each = toset(var.app_modules)

  name               = "${var.project_name}-${each.key}-memory-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.app_modules[each.key].resource_id
  scalable_dimension = aws_appautoscaling_target.app_modules[each.key].scalable_dimension
  service_namespace  = aws_appautoscaling_target.app_modules[each.key].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value       = 80.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# ========================================
# n8n Main Service
# ========================================

resource "aws_ecs_task_definition" "n8n" {
  family                   = "${var.project_name}-n8n-${var.environment}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.n8n_cpu
  memory                   = var.n8n_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "n8n"
      image     = "${aws_ecr_repository.n8n.repository_url}:${var.container_image_tag}"
      essential = true

      portMappings = [
        {
          containerPort = 5678
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "N8N_HOST"
          value = "n8n.${var.domain_name}"
        },
        {
          name  = "N8N_PORT"
          value = "5678"
        },
        {
          name  = "N8N_PROTOCOL"
          value = var.certificate_arn != "" ? "https" : "http"
        },
        {
          name  = "WEBHOOK_URL"
          value = var.certificate_arn != "" ? "https://n8n.${var.domain_name}" : "http://n8n.${var.domain_name}"
        },
        {
          name  = "DB_TYPE"
          value = "mysqldb"
        },
        {
          name  = "DB_MYSQLDB_HOST"
          value = module.rds.db_endpoint
        },
        {
          name  = "DB_MYSQLDB_PORT"
          value = "3306"
        },
        {
          name  = "DB_MYSQLDB_DATABASE"
          value = "handymate_n8n"
        },
        {
          name  = "DB_MYSQLDB_USER"
          value = var.db_username
        },
        {
          name  = "EXECUTIONS_MODE"
          value = "queue"
        },
        {
          name  = "QUEUE_BULL_REDIS_HOST"
          value = module.elasticache.redis_endpoint
        },
        {
          name  = "QUEUE_BULL_REDIS_PORT"
          value = "6379"
        },
        {
          name  = "QUEUE_HEALTH_CHECK_ACTIVE"
          value = "true"
        },
        {
          name  = "N8N_DIAGNOSTICS_ENABLED"
          value = "false"
        },
        {
          name  = "N8N_LOG_LEVEL"
          value = var.environment == "production" ? "info" : "debug"
        }
      ]

      secrets = [
        {
          name      = "DB_MYSQLDB_PASSWORD"
          valueFrom = "${aws_secretsmanager_secret.db_credentials.arn}:password::"
        },
        {
          name      = "N8N_ENCRYPTION_KEY"
          valueFrom = "${aws_secretsmanager_secret.n8n_encryption_key.arn}:encryption_key::"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.n8n.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:5678/healthz || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 90
      }
    }
  ])

  tags = var.common_tags
}

resource "aws_ecs_service" "n8n" {
  name            = "${var.project_name}-n8n-${var.environment}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.n8n.arn
  desired_count   = 1

  launch_type = "FARGATE"

  network_configuration {
    subnets          = module.vpc.private_subnet_ids
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.n8n.arn
    container_name   = "n8n"
    container_port   = 5678
  }


  enable_execute_command = var.environment != "production"

  tags = var.common_tags

  depends_on = [
    aws_lb_listener.http,
    aws_lb_target_group.n8n
  ]
}

# ========================================
# n8n Worker Services (one per module)
# ========================================

resource "aws_ecs_task_definition" "n8n_workers" {
  for_each = toset(var.app_modules)

  family                   = "${var.project_name}-n8n-worker-${each.key}-${var.environment}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.n8n_worker_cpu
  memory                   = var.n8n_worker_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "n8n-worker-${each.key}"
      image     = "${aws_ecr_repository.n8n.repository_url}:${var.container_image_tag}"
      essential = true
      command   = ["n8n", "worker"]

      environment = [
        {
          name  = "WORKER_APP"
          value = each.key
        },
        {
          name  = "WORKER_ID"
          value = "${each.key}-worker"
        },
        {
          name  = "DB_TYPE"
          value = "mysqldb"
        },
        {
          name  = "DB_MYSQLDB_HOST"
          value = module.rds.db_endpoint
        },
        {
          name  = "DB_MYSQLDB_PORT"
          value = "3306"
        },
        {
          name  = "DB_MYSQLDB_DATABASE"
          value = "handymate_n8n"
        },
        {
          name  = "DB_MYSQLDB_USER"
          value = var.db_username
        },
        {
          name  = "EXECUTIONS_MODE"
          value = "queue"
        },
        {
          name  = "QUEUE_BULL_REDIS_HOST"
          value = module.elasticache.redis_endpoint
        },
        {
          name  = "QUEUE_BULL_REDIS_PORT"
          value = "6379"
        },
        {
          name  = "QUEUE_BULL_PREFIX"
          value = "n8n:${each.key}"
        },
        {
          name  = "N8N_LOG_LEVEL"
          value = var.environment == "production" ? "info" : "debug"
        }
      ]

      secrets = [
        {
          name      = "DB_MYSQLDB_PASSWORD"
          valueFrom = "${aws_secretsmanager_secret.db_credentials.arn}:password::"
        },
        {
          name      = "N8N_ENCRYPTION_KEY"
          valueFrom = "${aws_secretsmanager_secret.n8n_encryption_key.arn}:encryption_key::"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.n8n_workers[each.key].name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])

  tags = merge(
    var.common_tags,
    {
      Module = each.key
      Type   = "n8n-worker"
    }
  )
}

resource "aws_ecs_service" "n8n_workers" {
  for_each = toset(var.app_modules)

  name            = "${var.project_name}-n8n-worker-${each.key}-${var.environment}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.n8n_workers[each.key].arn
  desired_count   = 1

  launch_type = "FARGATE"

  network_configuration {
    subnets          = module.vpc.private_subnet_ids
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  enable_execute_command = var.environment != "production"

  tags = merge(
    var.common_tags,
    {
      Module = each.key
      Type   = "n8n-worker"
    }
  )
}
