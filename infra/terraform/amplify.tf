# Amplify Hosting for the two Next.js apps (SSR). Each app proxies /api/* to
# the HTTP API through its next.config rewrite, which reads API_URL at build time.

locals {
  frontends = var.enable_amplify ? {
    admin       = "client"
    participant = "client-participant"
  } : {}

  amplify_build_spec = { for key, root in local.frontends : key => <<-YAML
    version: 1
    applications:
      - appRoot: ${root}
        frontend:
          phases:
            preBuild:
              commands:
                - npm ci
            build:
              commands:
                # Expose build-time variables to the SSR runtime as well.
                - env | grep -E '^(API_URL|NEXT_PUBLIC_)' >> .env.production || true
                - npm run build
          artifacts:
            baseDirectory: .next
            files:
              - '**/*'
          cache:
            paths:
              - node_modules/**/*
              - .next/cache/**/*
    YAML
  }

  amplify_env = {
    API_URL                        = local.api_url
    NEXT_PUBLIC_STORAGE_PUBLIC_URL = local.storage_url
  }
}

resource "aws_amplify_app" "admin" {
  count = var.enable_amplify ? 1 : 0

  name         = "${local.name}-admin"
  repository   = var.github_repository
  access_token = var.github_access_token
  platform     = "WEB_COMPUTE"
  build_spec   = local.amplify_build_spec["admin"]

  environment_variables = merge(local.amplify_env, {
    AMPLIFY_MONOREPO_APP_ROOT = "client"
  })

  lifecycle {
    precondition {
      condition     = var.github_repository != "" && var.github_access_token != ""
      error_message = "Set github_repository and github_access_token, or set enable_amplify = false."
    }
  }
}

resource "aws_amplify_app" "participant" {
  count = var.enable_amplify ? 1 : 0

  name         = "${local.name}-participant"
  repository   = var.github_repository
  access_token = var.github_access_token
  platform     = "WEB_COMPUTE"
  build_spec   = local.amplify_build_spec["participant"]

  environment_variables = merge(local.amplify_env, {
    AMPLIFY_MONOREPO_APP_ROOT = "client-participant"
  })

  lifecycle {
    precondition {
      condition     = var.github_repository != "" && var.github_access_token != ""
      error_message = "Set github_repository and github_access_token, or set enable_amplify = false."
    }
  }
}

resource "aws_amplify_branch" "admin" {
  count = var.enable_amplify ? 1 : 0

  app_id            = aws_amplify_app.admin[0].id
  branch_name       = var.amplify_branch
  framework         = "Next.js - SSR"
  stage             = "PRODUCTION"
  enable_auto_build = true
}

resource "aws_amplify_branch" "participant" {
  count = var.enable_amplify ? 1 : 0

  app_id            = aws_amplify_app.participant[0].id
  branch_name       = var.amplify_branch
  framework         = "Next.js - SSR"
  stage             = "PRODUCTION"
  enable_auto_build = true
}
