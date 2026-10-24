resource "google_pubsub_topic" "gmail_push" {
  name    = local.names.pubsubTopic
  project = var.project_id

  depends_on = [google_project_service.apis]
}

resource "google_pubsub_topic_iam_member" "gmail_api_publisher" {
  project = var.project_id
  topic   = google_pubsub_topic.gmail_push.name
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:gmail-api-push@system.gserviceaccount.com"
}

resource "google_pubsub_topic_iam_member" "functions_subscriber" {
  project = var.project_id
  topic   = google_pubsub_topic.gmail_push.name
  role    = "roles/pubsub.subscriber"
  member  = "serviceAccount:${google_service_account.functions.email}"
}

resource "google_pubsub_topic_iam_member" "functions_viewer" {
  project = var.project_id
  topic   = google_pubsub_topic.gmail_push.name
  role    = "roles/pubsub.viewer"
  member  = "serviceAccount:${google_service_account.functions.email}"
}
