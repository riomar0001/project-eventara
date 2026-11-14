# Background jobs: the API (and EventBridge Scheduler) send to `jobs`; the
# worker Lambda consumes it. The worker records a job's final failure in Redis
# and acknowledges it, so the DLQ only catches crashes, timeouts and messages the
# worker could not record — alarm on it.

locals {
  worker_timeout_seconds = 300
}

resource "aws_sqs_queue" "jobs_dlq" {
  name                      = "${local.name}-jobs-dlq"
  message_retention_seconds = 1209600 # 14 days
  sqs_managed_sse_enabled   = true
}

resource "aws_sqs_queue" "jobs" {
  name                       = "${local.name}-jobs"
  message_retention_seconds  = 345600 # 4 days
  receive_wait_time_seconds  = 20
  visibility_timeout_seconds = local.worker_timeout_seconds * 6 # AWS guidance for Lambda consumers
  sqs_managed_sse_enabled    = true

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.jobs_dlq.arn
    # Leave room above JOB_MAX_TRIES so the worker, not SQS, decides a job is dead.
    maxReceiveCount = var.job_max_tries + 2
  })
}

resource "aws_sqs_queue_redrive_allow_policy" "jobs_dlq" {
  queue_url = aws_sqs_queue.jobs_dlq.id

  redrive_allow_policy = jsonencode({
    redrivePermission = "byQueue"
    sourceQueueArns   = [aws_sqs_queue.jobs.arn]
  })
}

resource "aws_cloudwatch_metric_alarm" "jobs_dlq_not_empty" {
  alarm_name          = "${local.name}-jobs-dlq-not-empty"
  alarm_description   = "Jobs reached the SQS dead-letter queue (worker crash, timeout or Redis outage)."
  namespace           = "AWS/SQS"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  dimensions          = { QueueName = aws_sqs_queue.jobs_dlq.name }
  statistic           = "Maximum"
  period              = 300
  evaluation_periods  = 1
  threshold           = 0
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"
}
