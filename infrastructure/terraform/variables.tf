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
}

variable "app_modules" {
  description = "List of CRM application modules"
  type        = list(string)
  default     = ["developer", "dancer", "painter", "driver", "influencer", "hunter", "seller", "trader"]
}

# Database Configuration
variable "db_username" {
  description = "Database username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "db_name" {
  description = "Main database name"
  type        = string
  default     = "handymate"
}

# Redis Configuration
variable "redis_version" {
  description = "Redis version"
  type        = string
  default     = "7.0"
}

# Container Configuration
variable "container_image_tag" {
  description = "Container image tag"
  type        = string
  default     = "latest"
}

variable "container_registry" {
  description = "Container registry URL"
  type        = string
}

# Domain Configuration
variable "domain_name" {
  description = "Primary domain name"
  type        = string
}

# Tags
variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default     = {}
}
