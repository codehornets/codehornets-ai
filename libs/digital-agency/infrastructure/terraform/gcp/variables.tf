# HandyMate GCP - Variables

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

variable "gcp_project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "gcp_region" {
  description = "GCP region for all resources"
  type        = string
  default     = "us-central1"
}

variable "app_modules" {
  description = "List of CRM application modules"
  type        = list(string)
  default     = ["developer", "dancer", "painter", "driver", "influencer", "hunter", "seller", "trader"]
}

# Network Configuration
variable "subnet_cidr" {
  description = "CIDR block for subnet"
  type        = string
  default     = "10.8.0.0/28"
}

variable "vpc_connector_cidr" {
  description = "CIDR block for VPC Access Connector"
  type        = string
  default     = "10.8.1.0/28"
}

# Cloud SQL Configuration
variable "db_tier" {
  description = "Cloud SQL machine type"
  type        = string
  default     = "db-n1-standard-2"
}

variable "db_disk_size" {
  description = "Cloud SQL disk size in GB"
  type        = number
  default     = 100
}

variable "db_username" {
  description = "Database master username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

# Redis Configuration
variable "redis_tier" {
  description = "Memorystore Redis tier (BASIC or STANDARD_HA)"
  type        = string
  default     = "STANDARD_HA"

  validation {
    condition     = contains(["BASIC", "STANDARD_HA"], var.redis_tier)
    error_message = "Redis tier must be BASIC or STANDARD_HA."
  }
}

variable "redis_memory_gb" {
  description = "Redis memory size in GB"
  type        = number
  default     = 5
}

# Cloud Run Configuration
variable "cloud_run_max_instances" {
  description = "Maximum number of Cloud Run instances per service"
  type        = number
  default     = 10
}

variable "cloud_run_cpu" {
  description = "CPU allocation for Cloud Run services (in millicores)"
  type        = string
  default     = "1000m"
}

variable "cloud_run_memory" {
  description = "Memory allocation for Cloud Run services"
  type        = string
  default     = "512Mi"
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
  type        = string
  default     = "2000m"
}

variable "n8n_memory" {
  description = "Memory allocation for n8n main service"
  type        = string
  default     = "2Gi"
}

variable "n8n_worker_cpu" {
  description = "CPU allocation for n8n worker services"
  type        = string
  default     = "1000m"
}

variable "n8n_worker_memory" {
  description = "Memory allocation for n8n worker services"
  type        = string
  default     = "1Gi"
}
