output "api_url" {
  description = "Public URL of the HTTP API (also set as API_URL on both Amplify apps)."
  value       = local.api_url
}

output "ecr_repository_url" {
  description = "Push the server image here."
  value       = aws_ecr_repository.server.repository_url
}

output "api_function_name" {
  value = aws_lambda_function.api.function_name
}

output "worker_function_name" {
  description = "Invoke with {\"task\":\"migrate\"} to run migrations and seeds."
  value       = aws_lambda_function.worker.function_name
}

output "jobs_queue_url" {
  value = aws_sqs_queue.jobs.url
}

output "jobs_dlq_url" {
  value = aws_sqs_queue.jobs_dlq.url
}

output "storage_public_url" {
  value = local.storage_url
}

output "uploads_bucket" {
  value = aws_s3_bucket.uploads.bucket
}

output "participant_url" {
  value = local.participant_url
}

output "admin_url" {
  value = local.admin_url
}

output "ses_dkim_records" {
  description = "CNAME records to add to the mail_domain DNS zone for SES DKIM."
  value = [
    for token in aws_sesv2_email_identity.mail.dkim_signing_attributes[0].tokens : {
      name  = "${token}._domainkey.${var.mail_domain}"
      type  = "CNAME"
      value = "${token}.dkim.amazonses.com"
    }
  ]
}

output "migrate_command" {
  description = "Run after each deploy that adds migrations."
  value       = "aws lambda invoke --region ${var.aws_region} --function-name ${aws_lambda_function.worker.function_name} --cli-binary-format raw-in-base64-out --payload '{\"task\":\"migrate\"}' migrate-result.json"
}
