locals {
  names = jsondecode(file("${path.module}/../../shared/gcpNames.json"))

  apis = toset(concat(
    [
      "gmail.googleapis.com",
      "pubsub.googleapis.com",
      "secretmanager.googleapis.com",
      "cloudscheduler.googleapis.com",
      "cloudfunctions.googleapis.com",
      "cloudbuild.googleapis.com",
      "run.googleapis.com",
      "artifactregistry.googleapis.com",
      "firestore.googleapis.com",
      "iam.googleapis.com",
      "eventarc.googleapis.com",
    ],
    var.enable_kms ? ["cloudkms.googleapis.com"] : [],
    var.enable_billing_budget ? ["cloudbilling.googleapis.com", "billingbudgets.googleapis.com"] : [],
  ))
}
