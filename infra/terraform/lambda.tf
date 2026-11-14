# Server image (ECR), the API and worker Lambdas, and the HTTP API in front of the API.

resource "aws_ecr_repository" "server" {
  name                 = "${local.name}-server"
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_lifecycle_policy" "server" {
  repository = aws_ecr_repository.server.name
  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep the 20 most recent images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 20
      }
      action = { type = "expire" }
    }]
  })
}

# ── Secrets ──────────────────────────────────────────────────────────────────
# shortcut: secrets are generated here and passed as Lambda environment
# variables (encrypted at rest with the Lambda service key, and present in
# Terraform state). Move them to Secrets Manager if state access is broad.

resource "random_password" "jwt" {
  for_each = toset(["access", "refresh", "verification", "admission"])
  length   = 64
  special  = false
}

locals {
  # try(): the Amplify apps do not exist when enable_amplify = false.
  participant_url  = coalesce(var.participant_url, try("https://${var.amplify_branch}.${aws_amplify_app.participant[0].default_domain}", "http://localhost:3001"))
  admin_url        = coalesce(var.admin_url, try("https://${var.amplify_branch}.${aws_amplify_app.admin[0].default_domain}", "http://localhost:3000"))
  api_url          = trimsuffix(aws_apigatewayv2_stage.default.invoke_url, "/")
  frontend_origins = [local.participant_url, local.admin_url]
  storage_url      = "https://${aws_cloudfront_distribution.uploads.domain_name}"

  common_env = {
    APP_NAME                      = "Eventara"
    DEBUG                         = "False"
    DATABASE_URL                  = "postgresql+asyncpg://${aws_db_instance.main.username}:${random_password.db.result}@${aws_db_instance.main.address}:${aws_db_instance.main.port}/${aws_db_instance.main.db_name}?ssl=require"
    DB_POOL_SIZE                  = "1"
    DB_MAX_OVERFLOW               = "0"
    REDIS_HOST                    = aws_elasticache_replication_group.main.primary_endpoint_address
    REDIS_PORT                    = "6379"
    REDIS_PASSWORD                = random_password.redis.result
    REDIS_SSL                     = "True"
    JOB_QUEUE_URL                 = aws_sqs_queue.jobs.url
    JOB_MAX_TRIES                 = tostring(var.job_max_tries)
    JWT_ACCESS_TOKEN_SECRET       = random_password.jwt["access"].result
    JWT_REFRESH_TOKEN_SECRET      = random_password.jwt["refresh"].result
    JWT_VERIFICATION_TOKEN_SECRET = random_password.jwt["verification"].result
    ADMISSION_TOKEN_SECRET        = random_password.jwt["admission"].result
    MAIL_PROVIDER                 = "ses"
    MAIL_FROM                     = var.mail_from
    SES_REGION                    = var.aws_region
    CORS_ORIGIN                   = local.participant_url
    ALLOWED_ORIGINS               = join(",", local.frontend_origins)
    ADMIN_EMAIL                   = var.admin_email
    ADMIN_PASSWORD                = var.admin_password
    STORAGE_REGION                = var.aws_region
    STORAGE_BUCKET_NAME           = aws_s3_bucket.uploads.bucket
    STORAGE_PUBLIC_URL            = local.storage_url
  }
}

# ── IAM ──────────────────────────────────────────────────────────────────────

data "aws_iam_policy_document" "lambda_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "api" {
  name               = "${local.name}-api"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}

resource "aws_iam_role" "worker" {
  name               = "${local.name}-worker"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}

resource "aws_iam_role_policy_attachment" "vpc_access" {
  for_each   = { api = aws_iam_role.api.name, worker = aws_iam_role.worker.name }
  role       = each.value
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_iam_role_policy" "api" {
  name = "api"
  role = aws_iam_role.api.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "EnqueueJobs"
        Effect   = "Allow"
        Action   = ["sqs:SendMessage", "sqs:GetQueueAttributes"]
        Resource = aws_sqs_queue.jobs.arn
      },
      {
        Sid      = "SignUploadUrls" # presigned PUTs are authorised as this role
        Effect   = "Allow"
        Action   = ["s3:PutObject"]
        Resource = "${aws_s3_bucket.uploads.arn}/*"
      },
    ]
  })
}

resource "aws_iam_role_policy" "worker" {
  name = "worker"
  role = aws_iam_role.worker.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ConsumeJobs"
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:ChangeMessageVisibility",
          "sqs:GetQueueAttributes",
          "sqs:SendMessage",
        ]
        Resource = aws_sqs_queue.jobs.arn
      },
      {
        Sid      = "SendEmail"
        Effect   = "Allow"
        Action   = ["ses:SendEmail"]
        Resource = aws_sesv2_email_identity.mail.arn
        Condition = {
          StringEquals = { "ses:FromAddress" = var.mail_from }
        }
      },
    ]
  })
}

# ── Functions ────────────────────────────────────────────────────────────────

resource "aws_cloudwatch_log_group" "api" {
  name              = "/aws/lambda/${local.name}-api"
  retention_in_days = var.log_retention_days
}

resource "aws_cloudwatch_log_group" "worker" {
  name              = "/aws/lambda/${local.name}-worker"
  retention_in_days = var.log_retention_days
}

resource "aws_lambda_function" "api" {
  function_name = "${local.name}-api"
  role          = aws_iam_role.api.arn
  package_type  = "Image"
  image_uri     = "${aws_ecr_repository.server.repository_url}:${var.image_tag}"
  architectures = [var.lambda_architecture]
  memory_size   = var.api_memory_mb
  timeout       = 29 # API Gateway's integration limit

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = local.common_env
  }

  depends_on = [aws_cloudwatch_log_group.api, aws_iam_role_policy_attachment.vpc_access]
}

resource "aws_lambda_function" "worker" {
  function_name = "${local.name}-worker"
  role          = aws_iam_role.worker.arn
  package_type  = "Image"
  image_uri     = "${aws_ecr_repository.server.repository_url}:${var.image_tag}"
  architectures = [var.lambda_architecture]
  memory_size   = 512
  timeout       = local.worker_timeout_seconds

  image_config {
    command = ["uvicorn", "app.worker_app:app", "--host", "127.0.0.1", "--port", "8000"]
  }

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = merge(local.common_env, {
      AWS_LWA_PASS_THROUGH_PATH = "/events"
    })
  }

  depends_on = [aws_cloudwatch_log_group.worker, aws_iam_role_policy_attachment.vpc_access]
}

resource "aws_lambda_event_source_mapping" "jobs" {
  event_source_arn                   = aws_sqs_queue.jobs.arn
  function_name                      = aws_lambda_function.worker.arn
  batch_size                         = 10
  maximum_batching_window_in_seconds = 1
  function_response_types            = ["ReportBatchItemFailures"]

  scaling_config {
    maximum_concurrency = var.worker_max_concurrency
  }

  depends_on = [aws_iam_role_policy.worker]
}

# ── HTTP API ─────────────────────────────────────────────────────────────────

resource "aws_apigatewayv2_api" "main" {
  name          = local.name
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_integration" "api" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.api.invoke_arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 29000
}

resource "aws_apigatewayv2_route" "default" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.api.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = "$default"
  auto_deploy = true

  default_route_settings {
    throttling_rate_limit  = var.api_throttle_rate
    throttling_burst_limit = var.api_throttle_burst
  }
}

resource "aws_lambda_permission" "apigw" {
  statement_id  = "AllowApiGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}
