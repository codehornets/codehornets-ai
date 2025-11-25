# HandyMate Azure - Variables

# Global Variables
variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "handymate"
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
  default     = "production"

  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be dev, staging, or production."
  }
}

variable "azure_location" {
  description = "Azure region for all resources"
  type        = string
  default     = "eastus"
}

variable "app_modules" {
  description = "List of CRM application modules"
  type        = list(string)
  default     = ["developer", "dancer", "painter", "driver", "influencer", "hunter", "seller", "trader"]
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default     = {}
}

# Network Configuration
variable "vnet_address_space" {
  description = "Address space for VNet"
  type        = string
  default     = "10.0.0.0/16"
}

variable "container_apps_subnet_cidr" {
  description = "CIDR block for Container Apps subnet"
  type        = string
  default     = "10.0.0.0/23"
}

variable "private_endpoints_subnet_cidr" {
  description = "CIDR block for private endpoints subnet"
  type        = string
  default     = "10.0.2.0/24"
}

# Container Registry Configuration
variable "acr_sku" {
  description = "Azure Container Registry SKU"
  type        = string
  default     = "Standard"

  validation {
    condition     = contains(["Basic", "Standard", "Premium"], var.acr_sku)
    error_message = "ACR SKU must be Basic, Standard, or Premium."
  }
}

# MySQL Configuration
variable "db_sku_name" {
  description = "MySQL SKU name"
  type        = string
  default     = "GP_Standard_D2ds_v4"
}

variable "db_storage_gb" {
  description = "MySQL storage size in GB"
  type        = number
  default     = 100
}

variable "db_username" {
  description = "Database administrator username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Database administrator password"
  type        = string
  sensitive   = true
}

# Redis Configuration
variable "redis_sku_name" {
  description = "Redis SKU (Basic, Standard, or Premium)"
  type        = string
  default     = "Standard"

  validation {
    condition     = contains(["Basic", "Standard", "Premium"], var.redis_sku_name)
    error_message = "Redis SKU must be Basic, Standard, or Premium."
  }
}

variable "redis_family" {
  description = "Redis family (C for Basic/Standard, P for Premium)"
  type        = string
  default     = "C"

  validation {
    condition     = contains(["C", "P"], var.redis_family)
    error_message = "Redis family must be C or P."
  }
}

variable "redis_capacity" {
  description = "Redis capacity (0-6 for C family, 1-5 for P family)"
  type        = number
  default     = 1
}

# Container Apps Configuration
variable "container_app_max_replicas" {
  description = "Maximum number of replicas for Container Apps"
  type        = number
  default     = 10
}

variable "container_app_cpu" {
  description = "CPU allocation for Container Apps"
  type        = number
  default     = 0.5
}

variable "container_app_memory" {
  description = "Memory allocation for Container Apps"
  type        = string
  default     = "1Gi"
}

# Container Configuration
variable "container_image_tag" {
  description = "Container image tag to deploy"
  type        = string
  default     = "latest"
}

# n8n Configuration
variable "n8n_encryption_key" {
  description = "n8n encryption key (auto-generated if not provided)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "n8n_cpu" {
  description = "CPU allocation for n8n main service"
  type        = number
  default     = 1.0
}

variable "n8n_memory" {
  description = "Memory allocation for n8n main service"
  type        = string
  default     = "2Gi"
}

variable "n8n_worker_cpu" {
  description = "CPU allocation for n8n worker services"
  type        = number
  default     = 0.5
}

variable "n8n_worker_memory" {
  description = "Memory allocation for n8n worker services"
  type        = string
  default     = "1Gi"
}
