resource "google_secret_manager_secret" "oauth_client_secret" {
  project   = var.project_id
  secret_id = local.names.oauthClientSecretId

  replication {
    auto {}
  }

  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret" "gemini_api_key" {
  project   = var.project_id
  secret_id = local.names.geminiApiKeySecretId

  replication {
    auto {}
  }

  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret_iam_member" "oauth_accessor" {
  project   = var.project_id
  secret_id = google_secret_manager_secret.oauth_client_secret.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.functions.email}"
}

resource "google_secret_manager_secret_iam_member" "gemini_accessor" {
  project   = var.project_id
  secret_id = google_secret_manager_secret.gemini_api_key.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.functions.email}"
}

resource "google_project_iam_member" "gmail_refresh_token_admin" {
  project = var.project_id
  role    = "roles/secretmanager.admin"
  member  = "serviceAccount:${google_service_account.functions.email}"

  condition {
    title       = "gmail_refresh_tokens"
    description = "Create, version, access, and delete only gmail-rt-* secrets."
    expression  = "resource.name.startsWith(\"projects/${var.project_id}/secrets/${local.names.gmailRefreshTokenPrefix}\")"
  }
}
