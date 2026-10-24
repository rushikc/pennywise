output "project_id" {
  value = var.project_id
}

output "functions_region" {
  value = local.names.functionsRegion
}

output "functions_service_account_email" {
  value = google_service_account.functions.email
}

output "gmail_push_topic" {
  value = google_pubsub_topic.gmail_push.name
}

output "oauth_client_secret_id" {
  value = google_secret_manager_secret.oauth_client_secret.secret_id
}

output "gemini_api_key_secret_id" {
  value = google_secret_manager_secret.gemini_api_key.secret_id
}

output "gmail_refresh_token_prefix" {
  value = local.names.gmailRefreshTokenPrefix
}
