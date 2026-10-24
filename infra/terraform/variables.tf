variable "project_id" {
  description = "GCP / Firebase project ID."
  type        = string
}

variable "region" {
  description = "Default region for regional resources (functions, Pub/Sub, KMS). Firestore location stays asia-south2 and is not managed here."
  type        = string
  default     = "asia-south1"
}

variable "enable_kms" {
  description = "Create an optional KMS key ring and crypto key. Off by default; refresh tokens use Secret Manager."
  type        = bool
  default     = false
}

variable "enable_billing_budget" {
  description = "Create an optional Cloud Billing budget alert."
  type        = bool
  default     = false
}

variable "billing_account" {
  description = "Billing account ID (XXXXXX-XXXXXX-XXXXXX). Required when enable_billing_budget is true."
  type        = string
  default     = ""

  validation {
    condition     = !var.enable_billing_budget || length(var.billing_account) > 0
    error_message = "billing_account is required when enable_billing_budget is true."
  }
}

variable "billing_budget_amount" {
  description = "Monthly budget amount in the billing currency."
  type        = number
  default     = 15
}

variable "billing_budget_currency" {
  description = "ISO 4217 currency code for the billing budget."
  type        = string
  default     = "INR"
}

variable "deployer_members" {
  description = "IAM members (user:email or serviceAccount:email) allowed to impersonate the functions service account during firebase deploy."
  type        = list(string)
  default     = []
}
