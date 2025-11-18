# Terraform Backend Configuration - Staging
# S3 bucket for state storage with DynamoDB for state locking

terraform {
  backend "s3" {
    bucket         = "codehornets-terraform-state"
    key            = "painterflow/crm/staging/terraform.tfstate"
    region         = "ca-central-1"
    profile        = "codehornets"
    encrypt        = true
    dynamodb_table = "codehornets-terraform-locks"

    # Enable versioning for state file recovery
    versioning     = true
  }

  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.11"
    }
  }
}

# Provider Configuration
provider "aws" {
  region  = var.aws_region
  profile = var.aws_profile

  default_tags {
    tags = merge(var.tags, {
      Terraform   = "true"
      Environment = var.environment
    })
  }
}

# Data source for EKS cluster authentication
data "aws_eks_cluster" "main" {
  name = var.cluster_name
}

data "aws_eks_cluster_auth" "main" {
  name = var.cluster_name
}

# Kubernetes provider for EKS
provider "kubernetes" {
  host                   = data.aws_eks_cluster.main.endpoint
  cluster_ca_certificate = base64decode(data.aws_eks_cluster.main.certificate_authority[0].data)
  token                  = data.aws_eks_cluster_auth.main.token
}

# Helm provider for EKS
provider "helm" {
  kubernetes {
    host                   = data.aws_eks_cluster.main.endpoint
    cluster_ca_certificate = base64decode(data.aws_eks_cluster.main.certificate_authority[0].data)
    token                  = data.aws_eks_cluster_auth.main.token
  }
}
