# 0005. Terraform for resources Firebase deploy cannot create

Status: Accepted

## Context

`firebase deploy` ships functions, Hosting, and Firestore rules and indexes. It does not create the Gmail Pub/Sub topic, the functions service account, or Secret Manager shells.

## Decision

Those resources live in `infra/terraform`. Names (topic, region, service account id, secret ids) live in `shared/gcpNames.json` and are copied into `functions/shared/` at predeploy. Terraform does not write secret versions and does not manage the OAuth client or `allowedUsers`.

## Consequences

A new project applies Terraform before the first functions deploy. The deploy then creates the push subscription and the hourly scheduler job. Do not duplicate the names from `shared/gcpNames.json` in docs or in Terraform.
