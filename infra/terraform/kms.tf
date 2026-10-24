resource "google_kms_key_ring" "pennywise" {
  count    = var.enable_kms ? 1 : 0
  project  = var.project_id
  name     = "pennywise"
  location = var.region

  depends_on = [google_project_service.apis]
}

resource "google_kms_crypto_key" "pennywise" {
  count           = var.enable_kms ? 1 : 0
  name            = "pennywise"
  key_ring        = google_kms_key_ring.pennywise[0].id
  rotation_period = "7776000s"
}
