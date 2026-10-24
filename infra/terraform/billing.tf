resource "google_billing_budget" "alert" {
  count = var.enable_billing_budget ? 1 : 0

  provider        = google-beta
  billing_account = var.billing_account
  display_name    = "pennywise-${var.project_id}"

  budget_filter {
    projects = ["projects/${var.project_id}"]
  }

  amount {
    specified_amount {
      currency_code = var.billing_budget_currency
      units         = tostring(var.billing_budget_amount)
    }
  }

  threshold_rules {
    threshold_percent = 0.5
  }

  threshold_rules {
    threshold_percent = 0.9
  }

  threshold_rules {
    threshold_percent = 1.0
  }
}
