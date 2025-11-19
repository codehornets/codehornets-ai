# HandyMate - GCP Infrastructure
# Multi-module CRM deployment using Cloud Run

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }

  # Remote state storage (recommended for production)
  # backend "gcs" {
  #   bucket = "handymate-terraform-state"
  #   prefix = "terraform/state"
  # }
}

provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
}

# Data sources
data "google_project" "project" {
  project_id = var.gcp_project_id
}

# Enable required APIs
resource "google_project_service" "required_apis" {
  for_each = toset([
    "run.googleapis.com",
    "vpcaccess.googleapis.com",
    "sqladmin.googleapis.com",
    "redis.googleapis.com",
    "artifactregistry.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "compute.googleapis.com",
    "servicenetworking.googleapis.com",
    "secretmanager.googleapis.com"
  ])

  project = var.gcp_project_id
  service = each.key

  disable_on_destroy = false
}

# VPC Network
resource "google_compute_network" "main" {
  name                    = "${var.project_name}-${var.environment}"
  auto_create_subnetworks = false

  depends_on = [google_project_service.required_apis]
}

# Subnet
resource "google_compute_subnetwork" "main" {
  name          = "${var.project_name}-${var.environment}-subnet"
  ip_cidr_range = var.subnet_cidr
  region        = var.gcp_region
  network       = google_compute_network.main.id

  private_ip_google_access = true
}

# VPC Access Connector for Cloud Run
resource "google_vpc_access_connector" "connector" {
  name          = "${var.project_name}-${var.environment}-connector"
  region        = var.gcp_region
  network       = google_compute_network.main.name
  ip_cidr_range = var.vpc_connector_cidr

  depends_on = [google_project_service.required_apis]
}

# Private IP allocation for Cloud SQL
resource "google_compute_global_address" "private_ip" {
  name          = "${var.project_name}-${var.environment}-sql-ip"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.main.id
}

resource "google_service_networking_connection" "private_vpc_connection" {
  network                 = google_compute_network.main.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip.name]

  depends_on = [google_project_service.required_apis]
}

# Artifact Registry for container images
resource "google_artifact_registry_repository" "main" {
  location      = var.gcp_region
  repository_id = "${var.project_name}-${var.environment}"
  description   = "Container registry for HandyMate CRM modules"
  format        = "DOCKER"

  depends_on = [google_project_service.required_apis]
}

# Cloud SQL MySQL Instance
resource "google_sql_database_instance" "main" {
  name             = "${var.project_name}-${var.environment}-${random_id.db_suffix.hex}"
  database_version = "MYSQL_8_0"
  region           = var.gcp_region

  settings {
    tier              = var.db_tier
    availability_type = var.environment == "production" ? "REGIONAL" : "ZONAL"
    disk_type         = "PD_SSD"
    disk_size         = var.db_disk_size
    disk_autoresize   = true

    backup_configuration {
      enabled                        = true
      start_time                     = "03:00"
      point_in_time_recovery_enabled = var.environment == "production"
      transaction_log_retention_days = var.environment == "production" ? 7 : 1
      backup_retention_settings {
        retained_backups = var.environment == "production" ? 30 : 7
      }
    }

    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.main.id
    }

    maintenance_window {
      day          = 7 # Sunday
      hour         = 3
      update_track = "stable"
    }

    insights_config {
      query_insights_enabled  = true
      query_string_length     = 1024
      record_application_tags = true
      record_client_address   = true
    }

    database_flags {
      name  = "max_connections"
      value = "1000"
    }

    database_flags {
      name  = "slow_query_log"
      value = "on"
    }
  }

  deletion_protection = var.environment == "production"

  depends_on = [
    google_service_networking_connection.private_vpc_connection,
    google_project_service.required_apis
  ]
}

resource "random_id" "db_suffix" {
  byte_length = 4
}

# Cloud SQL Databases (one per module + one for n8n)
resource "google_sql_database" "app_modules" {
  for_each = toset(concat(var.app_modules, ["n8n"]))

  name     = "handymate_${each.key}"
  instance = google_sql_database_instance.main.name
}

# Cloud SQL User
resource "google_sql_user" "main" {
  name     = var.db_username
  instance = google_sql_database_instance.main.name
  password = var.db_password
}

# Memorystore Redis Instance
resource "google_redis_instance" "main" {
  name               = "${var.project_name}-${var.environment}"
  tier               = var.redis_tier
  memory_size_gb     = var.redis_memory_gb
  region             = var.gcp_region
  redis_version      = "REDIS_7_0"
  display_name       = "HandyMate ${var.environment} Redis"
  authorized_network = google_compute_network.main.id
  connect_mode       = "PRIVATE_SERVICE_ACCESS"

  redis_configs = {
    maxmemory-policy = "allkeys-lru"
  }

  depends_on = [
    google_service_networking_connection.private_vpc_connection,
    google_project_service.required_apis
  ]
}

# Secret Manager for sensitive data
resource "google_secret_manager_secret" "db_password" {
  secret_id = "${var.project_name}-${var.environment}-db-password"

  replication {
    auto {}
  }

  depends_on = [google_project_service.required_apis]
}

resource "google_secret_manager_secret_version" "db_password" {
  secret      = google_secret_manager_secret.db_password.id
  secret_data = var.db_password
}

resource "google_secret_manager_secret" "n8n_encryption_key" {
  secret_id = "${var.project_name}-${var.environment}-n8n-encryption-key"

  replication {
    auto {}
  }

  depends_on = [google_project_service.required_apis]
}

resource "google_secret_manager_secret_version" "n8n_encryption_key" {
  secret      = google_secret_manager_secret.n8n_encryption_key.id
  secret_data = var.n8n_encryption_key != "" ? var.n8n_encryption_key : random_password.n8n_encryption_key.result
}

resource "random_password" "n8n_encryption_key" {
  length  = 32
  special = true
}

# Cloud Storage Bucket for file storage
resource "google_storage_bucket" "storage" {
  name          = "${var.project_name}-${var.environment}-storage-${random_id.bucket_suffix.hex}"
  location      = var.gcp_region
  force_destroy = var.environment != "production"

  uniform_bucket_level_access = true

  versioning {
    enabled = var.environment == "production"
  }

  lifecycle_rule {
    condition {
      age = 90
    }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# Cloud Run Service Account
resource "google_service_account" "cloud_run" {
  account_id   = "${var.project_name}-${var.environment}-run"
  display_name = "Cloud Run Service Account for HandyMate"
}

# IAM permissions for service account
resource "google_project_iam_member" "cloud_run_sql" {
  project = var.gcp_project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.cloud_run.email}"
}

resource "google_project_iam_member" "cloud_run_secrets" {
  project = var.gcp_project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.cloud_run.email}"
}

resource "google_storage_bucket_iam_member" "cloud_run_storage" {
  bucket = google_storage_bucket.storage.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.cloud_run.email}"
}

# Cloud Run Services for CRM Modules
resource "google_cloud_run_v2_service" "app_modules" {
  for_each = toset(var.app_modules)

  name     = "${var.project_name}-${each.key}-${var.environment}"
  location = var.gcp_region

  template {
    service_account = google_service_account.cloud_run.email

    vpc_access {
      connector = google_vpc_access_connector.connector.id
      egress    = "PRIVATE_RANGES_ONLY"
    }

    scaling {
      min_instance_count = var.environment == "production" ? 1 : 0
      max_instance_count = var.cloud_run_max_instances
    }

    containers {
      image = "${var.gcp_region}-docker.pkg.dev/${var.gcp_project_id}/${google_artifact_registry_repository.main.repository_id}/${each.key}:${var.container_image_tag}"

      resources {
        limits = {
          cpu    = "1000m"
          memory = "512Mi"
        }
      }

      ports {
        container_port = 80
      }

      env {
        name  = "APP_ENV"
        value = var.environment
      }

      env {
        name  = "APP_DEBUG"
        value = var.environment == "production" ? "false" : "true"
      }

      env {
        name  = "APP_MODULE"
        value = each.key
      }

      env {
        name  = "DB_CONNECTION"
        value = "mysql"
      }

      env {
        name  = "DB_HOST"
        value = google_sql_database_instance.main.private_ip_address
      }

      env {
        name  = "DB_PORT"
        value = "3306"
      }

      env {
        name  = "DB_DATABASE"
        value = "handymate_${each.key}"
      }

      env {
        name  = "DB_USERNAME"
        value = var.db_username
      }

      env {
        name = "DB_PASSWORD"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.db_password.secret_id
            version = "latest"
          }
        }
      }

      env {
        name  = "REDIS_HOST"
        value = google_redis_instance.main.host
      }

      env {
        name  = "REDIS_PORT"
        value = tostring(google_redis_instance.main.port)
      }

      env {
        name  = "CACHE_DRIVER"
        value = "redis"
      }

      env {
        name  = "QUEUE_CONNECTION"
        value = "redis"
      }

      env {
        name  = "SESSION_DRIVER"
        value = "redis"
      }

      startup_probe {
        http_get {
          path = "/health"
          port = 80
        }
        initial_delay_seconds = 10
        timeout_seconds       = 3
        period_seconds        = 10
        failure_threshold     = 3
      }

      liveness_probe {
        http_get {
          path = "/health"
          port = 80
        }
        initial_delay_seconds = 30
        timeout_seconds       = 3
        period_seconds        = 30
        failure_threshold     = 3
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  depends_on = [
    google_project_service.required_apis,
    google_vpc_access_connector.connector,
    google_sql_database.app_modules
  ]
}

# Cloud Run IAM - Allow unauthenticated access (configure as needed)
resource "google_cloud_run_v2_service_iam_member" "app_modules_public" {
  for_each = toset(var.app_modules)

  location = google_cloud_run_v2_service.app_modules[each.key].location
  name     = google_cloud_run_v2_service.app_modules[each.key].name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Cloud Run Service for n8n
resource "google_cloud_run_v2_service" "n8n" {
  name     = "${var.project_name}-n8n-${var.environment}"
  location = var.gcp_region

  template {
    service_account = google_service_account.cloud_run.email

    vpc_access {
      connector = google_vpc_access_connector.connector.id
      egress    = "PRIVATE_RANGES_ONLY"
    }

    scaling {
      min_instance_count = 1
      max_instance_count = 2
    }

    containers {
      image = "${var.gcp_region}-docker.pkg.dev/${var.gcp_project_id}/${google_artifact_registry_repository.main.repository_id}/n8n:${var.container_image_tag}"

      resources {
        limits = {
          cpu    = "2000m"
          memory = "2Gi"
        }
      }

      ports {
        container_port = 5678
      }

      env {
        name  = "N8N_PORT"
        value = "5678"
      }

      env {
        name  = "N8N_PROTOCOL"
        value = "https"
      }

      env {
        name  = "DB_TYPE"
        value = "mysqldb"
      }

      env {
        name  = "DB_MYSQLDB_HOST"
        value = google_sql_database_instance.main.private_ip_address
      }

      env {
        name  = "DB_MYSQLDB_PORT"
        value = "3306"
      }

      env {
        name  = "DB_MYSQLDB_DATABASE"
        value = "handymate_n8n"
      }

      env {
        name  = "DB_MYSQLDB_USER"
        value = var.db_username
      }

      env {
        name = "DB_MYSQLDB_PASSWORD"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.db_password.secret_id
            version = "latest"
          }
        }
      }

      env {
        name  = "EXECUTIONS_MODE"
        value = "queue"
      }

      env {
        name  = "QUEUE_BULL_REDIS_HOST"
        value = google_redis_instance.main.host
      }

      env {
        name  = "QUEUE_BULL_REDIS_PORT"
        value = tostring(google_redis_instance.main.port)
      }

      env {
        name = "N8N_ENCRYPTION_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.n8n_encryption_key.secret_id
            version = "latest"
          }
        }
      }

      env {
        name  = "N8N_LOG_LEVEL"
        value = var.environment == "production" ? "info" : "debug"
      }

      startup_probe {
        http_get {
          path = "/healthz"
          port = 5678
        }
        initial_delay_seconds = 30
        timeout_seconds       = 5
        period_seconds        = 10
        failure_threshold     = 5
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  depends_on = [
    google_project_service.required_apis,
    google_vpc_access_connector.connector,
    google_sql_database.app_modules
  ]
}

resource "google_cloud_run_v2_service_iam_member" "n8n_public" {
  location = google_cloud_run_v2_service.n8n.location
  name     = google_cloud_run_v2_service.n8n.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Cloud Run Services for n8n Workers
resource "google_cloud_run_v2_job" "n8n_workers" {
  for_each = toset(var.app_modules)

  name     = "${var.project_name}-n8n-worker-${each.key}-${var.environment}"
  location = var.gcp_region

  template {
    template {
      service_account = google_service_account.cloud_run.email

      vpc_access {
        connector = google_vpc_access_connector.connector.id
        egress    = "PRIVATE_RANGES_ONLY"
      }

      containers {
        image   = "${var.gcp_region}-docker.pkg.dev/${var.gcp_project_id}/${google_artifact_registry_repository.main.repository_id}/n8n:${var.container_image_tag}"
        command = ["n8n", "worker"]

        resources {
          limits = {
            cpu    = "1000m"
            memory = "1Gi"
          }
        }

        env {
          name  = "WORKER_APP"
          value = each.key
        }

        env {
          name  = "WORKER_ID"
          value = "${each.key}-worker"
        }

        env {
          name  = "DB_TYPE"
          value = "mysqldb"
        }

        env {
          name  = "DB_MYSQLDB_HOST"
          value = google_sql_database_instance.main.private_ip_address
        }

        env {
          name  = "DB_MYSQLDB_PORT"
          value = "3306"
        }

        env {
          name  = "DB_MYSQLDB_DATABASE"
          value = "handymate_n8n"
        }

        env {
          name  = "DB_MYSQLDB_USER"
          value = var.db_username
        }

        env {
          name = "DB_MYSQLDB_PASSWORD"
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.db_password.secret_id
              version = "latest"
            }
          }
        }

        env {
          name  = "EXECUTIONS_MODE"
          value = "queue"
        }

        env {
          name  = "QUEUE_BULL_REDIS_HOST"
          value = google_redis_instance.main.host
        }

        env {
          name  = "QUEUE_BULL_REDIS_PORT"
          value = tostring(google_redis_instance.main.port)
        }

        env {
          name  = "QUEUE_BULL_PREFIX"
          value = "n8n:${each.key}"
        }

        env {
          name = "N8N_ENCRYPTION_KEY"
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.n8n_encryption_key.secret_id
              version = "latest"
            }
          }
        }

        env {
          name  = "N8N_LOG_LEVEL"
          value = var.environment == "production" ? "info" : "debug"
        }
      }
    }
  }

  depends_on = [
    google_project_service.required_apis,
    google_vpc_access_connector.connector,
    google_sql_database.app_modules
  ]
}

# Outputs
output "project_id" {
  description = "GCP Project ID"
  value       = var.gcp_project_id
}

output "region" {
  description = "GCP Region"
  value       = var.gcp_region
}

output "sql_instance_connection_name" {
  description = "Cloud SQL instance connection name"
  value       = google_sql_database_instance.main.connection_name
}

output "sql_private_ip" {
  description = "Cloud SQL private IP address"
  value       = google_sql_database_instance.main.private_ip_address
  sensitive   = true
}

output "redis_host" {
  description = "Redis instance host"
  value       = google_redis_instance.main.host
}

output "redis_port" {
  description = "Redis instance port"
  value       = google_redis_instance.main.port
}

output "artifact_registry_url" {
  description = "Artifact Registry repository URL"
  value       = "${var.gcp_region}-docker.pkg.dev/${var.gcp_project_id}/${google_artifact_registry_repository.main.repository_id}"
}

output "storage_bucket_name" {
  description = "Cloud Storage bucket name"
  value       = google_storage_bucket.storage.name
}

output "cloud_run_urls" {
  description = "Cloud Run service URLs"
  value = merge(
    {
      for k, v in google_cloud_run_v2_service.app_modules : k => v.uri
    },
    {
      n8n = google_cloud_run_v2_service.n8n.uri
    }
  )
}
