terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.80, < 7.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # Local state by default. For a team, store state in S3 instead:
  # backend "s3" {
  #   bucket       = "my-terraform-state"
  #   key          = "eventara/terraform.tfstate"
  #   region       = "ap-southeast-1"
  #   use_lockfile = true
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "eventara"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

locals {
  name = "eventara-${var.environment}"
  azs  = slice(data.aws_availability_zones.available.names, 0, 2)
}
