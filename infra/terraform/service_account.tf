# Pub/Sub (onMessagePublished) and Scheduler (onSchedule) invoke the Cloud Run
# services created by `firebase deploy`. The Firebase CLI binds roles/run.invoker
# on those services to Eventarc/Pub/Sub/Scheduler identities. Terraform does not
# manage those services, so project-wide run.invoker is omitted (too broad).
resource "google_service_account" "functions" {
  project      = var.project_id
  account_id   = local.names.functionsServiceAccountId
  display_name = "Pennywise Cloud Functions"
  description  = "Runtime identity for Firebase Cloud Functions. Created by Terraform; used by firebase deploy via setGlobalOptions."
}

resource "google_project_iam_member" "functions_datastore" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.functions.email}"
}

resource "google_project_iam_member" "functions_logging" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.functions.email}"
}

resource "google_project_iam_member" "functions_eventarc" {
  project = var.project_id
  role    = "roles/eventarc.eventReceiver"
  member  = "serviceAccount:${google_service_account.functions.email}"
}

resource "google_service_account_iam_member" "deployer_act_as" {
  for_each = toset(var.deployer_members)

  service_account_id = google_service_account.functions.name
  role               = "roles/iam.serviceAccountUser"
  member             = each.value
}
