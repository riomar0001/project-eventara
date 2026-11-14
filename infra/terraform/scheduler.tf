# Periodic jobs. Keep in sync with LOCAL_SCHEDULES in
# server/app/infrastructure/messaging/worker.py (the local-dev equivalent).

locals {
  schedules = {
    sync-event-session-statuses = { function = "sync_event_session_statuses_job", expression = "rate(1 minute)" }
    sync-event-statuses         = { function = "sync_event_statuses_job", expression = "rate(1 minute)" }
    finalize-account-deletions  = { function = "finalize_due_account_deletions_job", expression = "rate(5 minutes)" }
    send-session-reminders      = { function = "send_session_reminders_job", expression = "rate(15 minutes)" }
    revoke-expired-tokens       = { function = "revoke_expired_tokens_job", expression = "cron(0 0 * * ? *)" }
  }
}

data "aws_iam_policy_document" "scheduler_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["scheduler.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "aws:SourceAccount"
      values   = [data.aws_caller_identity.current.account_id]
    }
  }
}

resource "aws_iam_role" "scheduler" {
  name               = "${local.name}-scheduler"
  assume_role_policy = data.aws_iam_policy_document.scheduler_assume.json
}

resource "aws_iam_role_policy" "scheduler_send" {
  name = "send-jobs"
  role = aws_iam_role.scheduler.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "sqs:SendMessage"
      Resource = aws_sqs_queue.jobs.arn
    }]
  })
}

resource "aws_scheduler_schedule_group" "main" {
  name = local.name
}

resource "aws_scheduler_schedule" "jobs" {
  for_each = local.schedules

  name                         = each.key
  group_name                   = aws_scheduler_schedule_group.main.name
  schedule_expression          = each.value.expression
  schedule_expression_timezone = "UTC"

  flexible_time_window {
    mode = "OFF"
  }

  target {
    arn      = aws_sqs_queue.jobs.arn
    role_arn = aws_iam_role.scheduler.arn
    input    = jsonencode({ function = each.value.function, args = [], kwargs = {} })

    retry_policy {
      maximum_event_age_in_seconds = 300
      maximum_retry_attempts       = 3
    }
  }
}
