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

# IAM conditions cannot gate secretmanager.secrets.create: create is authorized
# on the project (not the new secret), and conditions match the project NUMBER.
# A project-level custom role is the least privilege that actually works.
# Prefix gmail-rt-* is enforced in tokenStore, not IAM. versions.list/destroy
# are for destroying older versions on reconnect.
resource "google_project_iam_custom_role" "gmail_refresh_token_manager" {
  project     = var.project_id
  role_id     = "pennywiseGmailRefreshTokenManager"
  title       = "Pennywise Gmail refresh token secrets"
  description = "Create, get, delete, version, and access gmail refresh-token secrets."
  permissions = [
    "secretmanager.secrets.create",
    "secretmanager.secrets.get",
    "secretmanager.secrets.delete",
    "secretmanager.versions.add",
    "secretmanager.versions.access",
    "secretmanager.versions.destroy",
    "secretmanager.versions.list",
  ]
}

resource "google_project_iam_member" "gmail_refresh_token_manager" {
  project = var.project_id
  role    = google_project_iam_custom_role.gmail_refresh_token_manager.id
  member  = "serviceAccount:${google_service_account.functions.email}"
}
