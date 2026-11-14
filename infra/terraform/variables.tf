variable "aws_region" {
  description = "AWS region for every resource."
  type        = string
  default     = "ap-southeast-1"
}

variable "environment" {
  description = "Environment name, used in resource names (e.g. prod, staging)."
  type        = string
  default     = "prod"

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{1,15}$", var.environment))
    error_message = "Use 2-16 lowercase letters, digits or dashes."
  }
}

variable "image_tag" {
  description = "Tag of the server image in ECR to deploy to both Lambda functions (e.g. a git SHA)."
  type        = string
}

variable "lambda_architecture" {
  description = "CPU architecture the server image was built for: x86_64 or arm64."
  type        = string
  default     = "x86_64"

  validation {
    condition     = contains(["x86_64", "arm64"], var.lambda_architecture)
    error_message = "Must be x86_64 or arm64."
  }
}

variable "api_memory_mb" {
  description = "Memory for the API Lambda (CPU scales with it)."
  type        = number
  default     = 1024
}

variable "worker_max_concurrency" {
  description = "Maximum concurrent worker Lambdas reading SQS; caps database connections."
  type        = number
  default     = 5

  validation {
    condition     = var.worker_max_concurrency >= 2 && var.worker_max_concurrency <= 100
    error_message = "SQS event source mappings allow 2-100."
  }
}

variable "job_max_tries" {
  description = "Attempts per background job before it is recorded as dead."
  type        = number
  default     = 3
}

variable "db_instance_class" {
  description = "RDS instance class."
  type        = string
  default     = "db.t4g.micro"
}

variable "db_allocated_storage_gb" {
  description = "Initial RDS storage in GiB (autoscaling up to 5x)."
  type        = number
  default     = 20
}

variable "db_deletion_protection" {
  description = "Protect the database from deletion. Set false only to tear down an environment."
  type        = bool
  default     = true
}

variable "redis_node_type" {
  description = "ElastiCache node type."
  type        = string
  default     = "cache.t4g.micro"
}

variable "mail_domain" {
  description = "Domain to verify in SES for sending email (e.g. eventara.example.com). DKIM records are output for your DNS."
  type        = string
}

variable "mail_from" {
  description = "Sender address, on mail_domain (e.g. no-reply@eventara.example.com)."
  type        = string
}

variable "admin_email" {
  description = "Email of the system administrator account created by the seed."
  type        = string
}

variable "admin_password" {
  description = "Initial password for the system administrator account."
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.admin_password) >= 12
    error_message = "Use at least 12 characters."
  }
}

variable "participant_url" {
  description = "Public URL of the participant site, used in email links. Defaults to its Amplify domain."
  type        = string
  default     = null
}

variable "admin_url" {
  description = "Public URL of the admin site. Defaults to its Amplify domain."
  type        = string
  default     = null
}

variable "enable_amplify" {
  description = "Create the two Amplify Hosting apps for the Next.js frontends."
  type        = bool
  default     = true
}

variable "github_repository" {
  description = "HTTPS URL of the GitHub repository Amplify builds from, e.g. https://github.com/owner/repo."
  type        = string
  default     = ""
}

variable "github_access_token" {
  description = "GitHub token Amplify uses to connect the repository (repo scope). Only needed when enable_amplify is true."
  type        = string
  default     = ""
  sensitive   = true
}

variable "amplify_branch" {
  description = "Git branch Amplify deploys."
  type        = string
  default     = "main"
}

variable "api_throttle_rate" {
  description = "Steady-state requests per second allowed by API Gateway."
  type        = number
  default     = 100
}

variable "api_throttle_burst" {
  description = "Burst capacity allowed by API Gateway."
  type        = number
  default     = 200
}

variable "log_retention_days" {
  description = "CloudWatch log retention for the Lambda functions."
  type        = number
  default     = 30
}
