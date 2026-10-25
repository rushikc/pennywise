# One-time demo Hosting setup

Do these steps in the Firebase / Google Cloud consoles and in GitHub. Cursor does not create the project, service account, or secrets.

## 1. Create the demo Firebase project

1. Open [console.firebase.google.com](https://console.firebase.google.com).
2. Create a project. Try project ID `pennywise-demo`. If that ID is taken, use `pennywise-demo-<suffix>` and set a custom Hosting site in step 3.
3. Do not use a `demo-` prefix. Firebase reserves `demo-*` IDs for emulator-only projects, and this repo already uses `demo-pennywise` for rules tests.
4. Disable Google Analytics.
5. Spark plan Hosting is enough. No billing is required for the demo site.

Alternative: reuse the existing project behind `pennywise-static.web.app` if you still own it, to keep that URL.

## 2. Enable Hosting

Build → Hosting → Get started. Skip the CLI steps in the wizard.

Do not register a web app. Do not enable Auth or Firestore. The demo bundle is a static SPA on synthetic data.

## 3. Optional custom site

Hosting → Add another site → site ID `pennywise-demo` (gives `https://pennywise-demo.web.app`). Put that site ID in the GitHub Environment variable `DEMO_HOSTING_SITE`.

## 4. Deploy identity (pick one)

Create a dedicated service account in the **demo project only**, for example `github-demo-deployer@<demo-project>.iam.gserviceaccount.com`, with:

- `roles/firebasehosting.admin` (required)
- `roles/serviceusage.serviceUsageConsumer` (CLI API checks)
- `roles/serviceusage.apiKeysViewer` if a deploy fails without it

Grant nothing else: no Editor/Owner, and no access to the personal project.

### A. Workload Identity Federation (preferred, no keys)

In the demo project's Google Cloud console:

1. Enable the IAM Credentials API, Security Token Service API, Firebase Hosting API, and Service Usage API.
2. Create the service account above and grant the roles.
3. Create a Workload Identity Pool and an OIDC provider for `https://token.actions.githubusercontent.com` with attribute condition:

   `assertion.repository == 'rushikc/pennywise' && assertion.ref == 'refs/heads/main'`

4. Grant the pool principal `roles/iam.workloadIdentityUser` on the service account.
5. Save the provider resource name (`projects/<number>/locations/global/workloadIdentityPools/<pool>/providers/<provider>`) and the service account email.

### B. JSON key (simpler)

Same service account and roles, then Keys → Add key → JSON. Paste the whole JSON into the GitHub secret below, then delete the local file.

## 5. GitHub Environment `demo`

GitHub → Settings → Environments → New environment `demo`. Deployment branches: only `main`.

- Secret `DEMO_FIREBASE_PROJECT_ID`: the demo project ID (Firebase console → Project settings → General).
- Secrets `GCP_WORKLOAD_IDENTITY_PROVIDER` + `GCP_DEMO_DEPLOY_SERVICE_ACCOUNT` (option A) **or** `FIREBASE_SERVICE_ACCOUNT_DEMO` (option B).
- Variable (not secret) `DEMO_HOSTING_SITE`: optional site ID from step 3.
- Delete the old repo-level secrets `PROJECT_ID` and `FIREBASE_SERVICE_ACCOUNT` from the static-demo era if they exist and are unused. If that service account key belonged to a project that still matters, also delete the key in GCP.

## 6. Branch protection on `main`

Require the `check` job after its first run, and block force-pushes.

## 7. Repo homepage

In GitHub repo settings, change the Website field from `https://pennywise-static.web.app` to `https://pennywise-demo.web.app` (or your custom Hosting URL).

## 8. Local aliases

Copy `.firebaserc.example` to a local `.firebaserc` (gitignored) and set `personal` and `demo` to your project IDs, then `firebase login`.

OAuth authorized domains and JavaScript origins are not needed on the demo project. The demo has no sign-in.
