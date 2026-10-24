# Pennywise GCP infrastructure (Terraform)

Terraform owns GCP resources `firebase deploy` cannot create: APIs, the Gmail Pub/Sub topic and publisher IAM, Secret Manager shells, the functions service account, and optional KMS / billing budget.

Firebase CLI owns functions code, Firestore rules and indexes, and Hosting. Terraform does **not** create the Pub/Sub push subscription or the Cloud Scheduler job; `firebase deploy --only functions` creates those.

OAuth consent screen, the OAuth web client, and `allowedUsers/{email}` docs are **manual**. Terraform does not manage them.

Names (topic, service account id, secret ids) live in [`shared/gcpNames.json`](../../shared/gcpNames.json). Do not duplicate them.

## Bootstrap

1. Authenticate Application Default Credentials:

   ```bash
   gcloud auth application-default login
   gcloud config set project <project-id>
   ```

2. Create the state bucket **once**, outside Terraform (replace `<project-id>` and `<region>`, e.g. `asia-south1`):

   ```bash
   gcloud storage buckets create gs://<project-id>-tfstate \
     --location=<region> \
     --uniform-bucket-level-access \
     --public-access-prevention
   gcloud storage buckets update gs://<project-id>-tfstate --versioning
   ```

3. Copy the example files and fill them in:

   ```bash
   cd infra/terraform
   cp backend.hcl.example backend.hcl
   cp terraform.tfvars.example terraform.tfvars
   ```

4. Initialize, plan, apply:

   ```bash
   terraform init -backend-config=backend.hcl
   terraform plan
   terraform apply
   ```

Do not commit `backend.hcl`, `terraform.tfvars`, `*.tfstate*`, or `.terraform/`.

## After apply (manual)

1. Create an OAuth **Web** client in Google Cloud Console (APIs & Services → Credentials). Authorized JavaScript origins: `http://127.0.0.1:3000` and `https://<project-id>.web.app`. Do not request `gmail.modify`.
2. Set the OAuth consent screen to **In production** (unverified is fine for personal use). Add scope `https://www.googleapis.com/auth/gmail.readonly`.
3. Put secret **values** into the Terraform-created shells (Terraform never writes versions):

   ```bash
   echo -n 'WEB_CLIENT_SECRET' | gcloud secrets versions add pennywise-oauth-client-secret --data-file=-
   echo -n 'GEMINI_API_KEY' | gcloud secrets versions add pennywise-gemini-api-key --data-file=-
   ```

4. Set `REACT_APP_GOOGLE_OAUTH_CLIENT_ID` in the app `.env` to the Web client id. In `functions/.env` set `GOOGLE_OAUTH_CLIENT_ID` to the same value. Functions read the client secret from Secret Manager (`pennywise-oauth-client-secret`) and the Gemini key from `pennywise-gemini-api-key` via `defineSecret`. Use a billed Gemini key (paid / Vertex-equivalent privacy), not an unpaid experimental key, for inbox text.
5. `firebase deploy` (functions use the Terraform service account via `setGlobalOptions`).
6. Deploy or paste `firestore.rules`. Create `allowedUsers/{email}` docs for each family member in the Firebase console.

## Ownership split

| Resource | Owner |
|---|---|
| APIs, Pub/Sub topic `gmail-push`, topic IAM, secret shells, functions SA | Terraform |
| Pub/Sub trigger subscription, Cloud Scheduler job | Firebase functions deploy |
| Functions source, Hosting | Firebase CLI |
| Firestore rules and indexes | `firestore.rules` / `firestore.indexes.json` in this repo |
| OAuth consent + Web client | Manual (Console) |
| `allowedUsers/{email}` | Manual (Console) |
