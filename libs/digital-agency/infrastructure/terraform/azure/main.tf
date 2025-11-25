# HandyMate - Azure Infrastructure
# Multi-module CRM deployment using Container Apps

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }

  # Remote state storage (recommended for production)
  # backend "azurerm" {
  #   resource_group_name  = "handymate-terraform-state"
  #   storage_account_name = "handymateterraform"
  #   container_name       = "tfstate"
  #   key                  = "prod.terraform.tfstate"
  # }
}

provider "azurerm" {
  features {
    resource_group {
      prevent_deletion_if_contains_resources = var.environment == "production"
    }
    key_vault {
      purge_soft_delete_on_destroy = var.environment != "production"
    }
  }
}

data "azurerm_client_config" "current" {}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = "${var.project_name}-${var.environment}-rg"
  location = var.azure_location

  tags = merge(
    var.common_tags,
    {
      Environment = var.environment
      Project     = var.project_name
    }
  )
}

# Virtual Network
resource "azurerm_virtual_network" "main" {
  name                = "${var.project_name}-${var.environment}-vnet"
  address_space       = [var.vnet_address_space]
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  tags = var.common_tags
}

# Subnet for Container Apps
resource "azurerm_subnet" "container_apps" {
  name                 = "container-apps-subnet"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = [var.container_apps_subnet_cidr]

  delegation {
    name = "container-apps-delegation"
    service_delegation {
      name    = "Microsoft.App/environments"
      actions = ["Microsoft.Network/virtualNetworks/subnets/join/action"]
    }
  }
}

# Subnet for Private Endpoints
resource "azurerm_subnet" "private_endpoints" {
  name                 = "private-endpoints-subnet"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = [var.private_endpoints_subnet_cidr]
}

# Container Registry
resource "azurerm_container_registry" "main" {
  name                = "${var.project_name}${var.environment}acr"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = var.acr_sku
  admin_enabled       = true

  tags = var.common_tags
}

# Log Analytics Workspace
resource "azurerm_log_analytics_workspace" "main" {
  name                = "${var.project_name}-${var.environment}-logs"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "PerGB2018"
  retention_in_days   = var.environment == "production" ? 90 : 30

  tags = var.common_tags
}

# Container Apps Environment
resource "azurerm_container_app_environment" "main" {
  name                       = "${var.project_name}-${var.environment}-env"
  location                   = azurerm_resource_group.main.location
  resource_group_name        = azurerm_resource_group.main.name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  infrastructure_subnet_id   = azurerm_subnet.container_apps.id

  tags = var.common_tags
}

# MySQL Flexible Server
resource "azurerm_mysql_flexible_server" "main" {
  name                   = "${var.project_name}-${var.environment}-mysql"
  resource_group_name    = azurerm_resource_group.main.name
  location               = azurerm_resource_group.main.location
  administrator_login    = var.db_username
  administrator_password = var.db_password
  backup_retention_days  = var.environment == "production" ? 30 : 7
  sku_name               = var.db_sku_name
  version                = "8.0.21"

  storage {
    size_gb = var.db_storage_gb
  }

  high_availability {
    mode                      = var.environment == "production" ? "ZoneRedundant" : "Disabled"
    standby_availability_zone = var.environment == "production" ? "2" : null
  }

  tags = var.common_tags
}

# MySQL Firewall Rule for Azure Services
resource "azurerm_mysql_flexible_server_firewall_rule" "azure_services" {
  name                = "AllowAzureServices"
  resource_group_name = azurerm_resource_group.main.name
  server_name         = azurerm_mysql_flexible_server.main.name
  start_ip_address    = "0.0.0.0"
  end_ip_address      = "0.0.0.0"
}

# MySQL Databases (one per module + one for n8n)
resource "azurerm_mysql_flexible_database" "app_modules" {
  for_each = toset(concat(var.app_modules, ["n8n"]))

  name                = "handymate_${each.key}"
  resource_group_name = azurerm_resource_group.main.name
  server_name         = azurerm_mysql_flexible_server.main.name
  charset             = "utf8mb4"
  collation           = "utf8mb4_unicode_ci"
}

# Azure Cache for Redis
resource "azurerm_redis_cache" "main" {
  name                = "${var.project_name}-${var.environment}-redis"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  capacity            = var.redis_capacity
  family              = var.redis_family
  sku_name            = var.redis_sku_name
  minimum_tls_version = "1.2"

  redis_configuration {
    maxmemory_policy = "allkeys-lru"
  }

  tags = var.common_tags
}

# Key Vault for Secrets
resource "azurerm_key_vault" "main" {
  name                       = "${var.project_name}-${var.environment}-kv"
  location                   = azurerm_resource_group.main.location
  resource_group_name        = azurerm_resource_group.main.name
  tenant_id                  = data.azurerm_client_config.current.tenant_id
  sku_name                   = "standard"
  soft_delete_retention_days = 7
  purge_protection_enabled   = var.environment == "production"

  access_policy {
    tenant_id = data.azurerm_client_config.current.tenant_id
    object_id = data.azurerm_client_config.current.object_id

    secret_permissions = [
      "Get",
      "List",
      "Set",
      "Delete",
      "Purge",
      "Recover"
    ]
  }

  tags = var.common_tags
}

# Key Vault Secret for DB Password
resource "azurerm_key_vault_secret" "db_password" {
  name         = "db-password"
  value        = var.db_password
  key_vault_id = azurerm_key_vault.main.id

  tags = var.common_tags
}

# Key Vault Secret for n8n Encryption Key
resource "azurerm_key_vault_secret" "n8n_encryption_key" {
  name         = "n8n-encryption-key"
  value        = var.n8n_encryption_key != "" ? var.n8n_encryption_key : random_password.n8n_encryption_key.result
  key_vault_id = azurerm_key_vault.main.id

  tags = var.common_tags
}

resource "random_password" "n8n_encryption_key" {
  length  = 32
  special = true
}

# Storage Account for File Storage
resource "azurerm_storage_account" "main" {
  name                     = "${var.project_name}${var.environment}storage"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = var.environment == "production" ? "GRS" : "LRS"
  min_tls_version          = "TLS1_2"

  blob_properties {
    versioning_enabled = var.environment == "production"
  }

  tags = var.common_tags
}

# Storage Container
resource "azurerm_storage_container" "files" {
  name                  = "files"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

# User Assigned Identity for Container Apps
resource "azurerm_user_assigned_identity" "container_apps" {
  name                = "${var.project_name}-${var.environment}-identity"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location

  tags = var.common_tags
}

# Grant Key Vault access to User Assigned Identity
resource "azurerm_key_vault_access_policy" "container_apps" {
  key_vault_id = azurerm_key_vault.main.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = azurerm_user_assigned_identity.container_apps.principal_id

  secret_permissions = [
    "Get",
    "List"
  ]
}

# Container Apps for CRM Modules
resource "azurerm_container_app" "app_modules" {
  for_each = toset(var.app_modules)

  name                         = "${var.project_name}-${each.key}-${var.environment}"
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = azurerm_resource_group.main.name
  revision_mode                = "Single"

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.container_apps.id]
  }

  registry {
    server               = azurerm_container_registry.main.login_server
    username             = azurerm_container_registry.main.admin_username
    password_secret_name = "acr-password"
  }

  secret {
    name  = "acr-password"
    value = azurerm_container_registry.main.admin_password
  }

  secret {
    name  = "db-password"
    value = var.db_password
  }

  template {
    min_replicas = var.environment == "production" ? 1 : 0
    max_replicas = var.container_app_max_replicas

    container {
      name   = each.key
      image  = "${azurerm_container_registry.main.login_server}/${each.key}:${var.container_image_tag}"
      cpu    = 0.5
      memory = "1Gi"

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
        value = azurerm_mysql_flexible_server.main.fqdn
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
        name        = "DB_PASSWORD"
        secret_name = "db-password"
      }

      env {
        name  = "REDIS_HOST"
        value = azurerm_redis_cache.main.hostname
      }

      env {
        name  = "REDIS_PORT"
        value = "6380"
      }

      env {
        name  = "REDIS_PASSWORD"
        value = azurerm_redis_cache.main.primary_access_key
      }

      env {
        name  = "REDIS_SSL"
        value = "true"
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

      liveness_probe {
        transport = "HTTP"
        port      = 80
        path      = "/health"
      }

      startup_probe {
        transport = "HTTP"
        port      = 80
        path      = "/health"
      }
    }
  }

  ingress {
    external_enabled = true
    target_port      = 80
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  tags = merge(
    var.common_tags,
    {
      Module = each.key
    }
  )

  depends_on = [
    azurerm_mysql_flexible_database.app_modules,
    azurerm_key_vault_access_policy.container_apps
  ]
}

# Container App for n8n
resource "azurerm_container_app" "n8n" {
  name                         = "${var.project_name}-n8n-${var.environment}"
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = azurerm_resource_group.main.name
  revision_mode                = "Single"

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.container_apps.id]
  }

  registry {
    server               = azurerm_container_registry.main.login_server
    username             = azurerm_container_registry.main.admin_username
    password_secret_name = "acr-password"
  }

  secret {
    name  = "acr-password"
    value = azurerm_container_registry.main.admin_password
  }

  secret {
    name  = "db-password"
    value = var.db_password
  }

  secret {
    name  = "n8n-encryption-key"
    value = var.n8n_encryption_key != "" ? var.n8n_encryption_key : random_password.n8n_encryption_key.result
  }

  template {
    min_replicas = 1
    max_replicas = 2

    container {
      name   = "n8n"
      image  = "${azurerm_container_registry.main.login_server}/n8n:${var.container_image_tag}"
      cpu    = 1.0
      memory = "2Gi"

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
        value = azurerm_mysql_flexible_server.main.fqdn
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
        name        = "DB_MYSQLDB_PASSWORD"
        secret_name = "db-password"
      }

      env {
        name  = "EXECUTIONS_MODE"
        value = "queue"
      }

      env {
        name  = "QUEUE_BULL_REDIS_HOST"
        value = azurerm_redis_cache.main.hostname
      }

      env {
        name  = "QUEUE_BULL_REDIS_PORT"
        value = "6380"
      }

      env {
        name  = "QUEUE_BULL_REDIS_PASSWORD"
        value = azurerm_redis_cache.main.primary_access_key
      }

      env {
        name  = "QUEUE_BULL_REDIS_TLS"
        value = "true"
      }

      env {
        name        = "N8N_ENCRYPTION_KEY"
        secret_name = "n8n-encryption-key"
      }

      env {
        name  = "N8N_LOG_LEVEL"
        value = var.environment == "production" ? "info" : "debug"
      }

      liveness_probe {
        transport = "HTTP"
        port      = 5678
        path      = "/healthz"
      }

      startup_probe {
        transport = "HTTP"
        port      = 5678
        path      = "/healthz"
      }
    }
  }

  ingress {
    external_enabled = true
    target_port      = 5678
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  tags = var.common_tags

  depends_on = [
    azurerm_mysql_flexible_database.app_modules,
    azurerm_key_vault_access_policy.container_apps
  ]
}

# Container Apps Jobs for n8n Workers
resource "azurerm_container_app_job" "n8n_workers" {
  for_each = toset(var.app_modules)

  name                         = "${var.project_name}-n8n-worker-${each.key}-${var.environment}"
  location                     = azurerm_resource_group.main.location
  resource_group_name          = azurerm_resource_group.main.name
  container_app_environment_id = azurerm_container_app_environment.main.id

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.container_apps.id]
  }

  registry {
    server               = azurerm_container_registry.main.login_server
    username             = azurerm_container_registry.main.admin_username
    password_secret_name = "acr-password"
  }

  secret {
    name  = "acr-password"
    value = azurerm_container_registry.main.admin_password
  }

  secret {
    name  = "db-password"
    value = var.db_password
  }

  secret {
    name  = "n8n-encryption-key"
    value = var.n8n_encryption_key != "" ? var.n8n_encryption_key : random_password.n8n_encryption_key.result
  }

  template {
    container {
      name   = "n8n-worker-${each.key}"
      image  = "${azurerm_container_registry.main.login_server}/n8n:${var.container_image_tag}"
      cpu    = 0.5
      memory = "1Gi"
      args   = ["n8n", "worker"]

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
        value = azurerm_mysql_flexible_server.main.fqdn
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
        name        = "DB_MYSQLDB_PASSWORD"
        secret_name = "db-password"
      }

      env {
        name  = "EXECUTIONS_MODE"
        value = "queue"
      }

      env {
        name  = "QUEUE_BULL_REDIS_HOST"
        value = azurerm_redis_cache.main.hostname
      }

      env {
        name  = "QUEUE_BULL_REDIS_PORT"
        value = "6380"
      }

      env {
        name  = "QUEUE_BULL_REDIS_PASSWORD"
        value = azurerm_redis_cache.main.primary_access_key
      }

      env {
        name  = "QUEUE_BULL_REDIS_TLS"
        value = "true"
      }

      env {
        name  = "QUEUE_BULL_PREFIX"
        value = "n8n:${each.key}"
      }

      env {
        name        = "N8N_ENCRYPTION_KEY"
        secret_name = "n8n-encryption-key"
      }

      env {
        name  = "N8N_LOG_LEVEL"
        value = var.environment == "production" ? "info" : "debug"
      }
    }
  }

  replica_timeout_in_seconds = 300
  replica_retry_limit        = 3

  schedule_trigger_config {
    cron_expression          = "* * * * *" # Run continuously
    parallelism              = 1
    replica_completion_count = 1
  }

  tags = merge(
    var.common_tags,
    {
      Module = each.key
      Type   = "n8n-worker"
    }
  )

  depends_on = [
    azurerm_mysql_flexible_database.app_modules,
    azurerm_key_vault_access_policy.container_apps
  ]
}

# Outputs
output "resource_group_name" {
  description = "Resource Group name"
  value       = azurerm_resource_group.main.name
}

output "location" {
  description = "Azure location"
  value       = azurerm_resource_group.main.location
}

output "container_registry_url" {
  description = "Container Registry URL"
  value       = azurerm_container_registry.main.login_server
}

output "mysql_fqdn" {
  description = "MySQL Server FQDN"
  value       = azurerm_mysql_flexible_server.main.fqdn
  sensitive   = true
}

output "redis_hostname" {
  description = "Redis hostname"
  value       = azurerm_redis_cache.main.hostname
}

output "redis_port" {
  description = "Redis SSL port"
  value       = azurerm_redis_cache.main.ssl_port
}

output "storage_account_name" {
  description = "Storage Account name"
  value       = azurerm_storage_account.main.name
}

output "container_app_urls" {
  description = "Container App URLs"
  value = merge(
    {
      for k, v in azurerm_container_app.app_modules : k => "https://${v.latest_revision_fqdn}"
    },
    {
      n8n = "https://${azurerm_container_app.n8n.latest_revision_fqdn}"
    }
  )
}

output "key_vault_uri" {
  description = "Key Vault URI"
  value       = azurerm_key_vault.main.vault_uri
}
