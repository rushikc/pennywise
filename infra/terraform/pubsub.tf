resource "google_pubsub_topic" "gmail_push" {
  name    = local.names.pubsubTopic
  project = var.project_id

  depends_on = [google_project_service.apis]
}

# Gmail publishes to this topic. Eventarc (firebase deploy) creates the push
# subscription and binds run.invoker on the function Cloud Run service.
resource "google_pubsub_topic_iam_member" "gmail_api_publisher" {
  project = var.project_id
  topic   = google_pubsub_topic.gmail_push.name
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:gmail-api-push@system.gserviceaccount.com"
}

