### Setting Up a Local Development Environment

**Prerequisites**
- Node.js (version >= 22.0.0)
- npm (version >= 10.0.0)
- Firebase CLI (`npm install -g firebase-tools`, also installed as a dev dependency) for emulators and deploys
- Java (JDK 11+) if you want to run the Firestore emulator for the security rules tests
- Terraform (>= 1.6) and the `gcloud` CLI only if you work on `infra/terraform`

**Firebase Setup**

This project uses Firebase for authentication and database services. To run the app locally, you'll need to create your own Firebase project.
First, complete the setup instructions in the [Setup Documentation](SETUP.md).

- You should have already created a `.env` file in the root folder of your project in the format below, as per the setup instructions.
- The app is built with Vite, but the variable names keep the `REACT_APP_` prefix (`vite.config` exposes that prefix to the browser). Use the following format:
    ```env
    REACT_APP_FIREBASE_API_KEY=your-api-key
    REACT_APP_FIREBASE_AUTH_DOMAIN=your-auth-domain
    REACT_APP_FIREBASE_PROJECT_ID=your-project-id
    REACT_APP_FIREBASE_STORAGE_BUCKET=your-storage-bucket
    REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
    REACT_APP_FIREBASE_APP_ID=your-app-id
    # Public OAuth client id used by Settings → Connect Gmail:
    REACT_APP_GOOGLE_OAUTH_CLIENT_ID=your-oauth-client-id.apps.googleusercontent.com
    # Optional, for Firebase Analytics if you enable it in code:
    # REACT_APP_FIREBASE_MEASUREMENT_ID=G-xxxxxxxxxx
    ```
- Cloud Functions read the same OAuth client id from `functions/.env` (`GOOGLE_OAUTH_CLIENT_ID=...`). The OAuth client secret and Gemini API key are **never** placed in `.env`; they live in Secret Manager.

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/rushikc/pennywise.git
    cd pennywise
    ```
2.  **Install Dependencies**:
    ```bash
    npm install
    npm ci --prefix functions
    ```
3.  **Start the Development Server**:
    ```bash
    npm run dev
    ```
This starts Vite with React Fast Refresh. Open [http://127.0.0.1:3000](http://127.0.0.1:3000) to view it in your browser. `npm start` is the same command. After changing the Vite toolchain, restart the dev server instead of reusing an old process on port 3000.

Without a signed-in, allowlisted account the app runs in **demo mode** on the mock data in `src/demoData`, which is handy for UI work.

4.  **Production build and preview**:
    ```bash
    npm run build     # writes build/
    npm run preview   # serves build/ on http://127.0.0.1:3000
    ```

### Running Tests and Checks

| What | Command |
|------|---------|
| Web app unit tests (Vitest + jsdom) | `CI=true npm test` (`vitest run`; do not pass `--watchAll=false`) |
| Web app lint | `npm run lint` |
| Web app type-check | `npm run typecheck` (`tsc --noEmit`) |
| Cloud Functions tests (builds the TypeScript parsers first) | `npm test --prefix functions` |
| Cloud Functions lint | `npm run lint --prefix functions` |
| Firestore security rules (starts the Firestore emulator) | `npm run test:rules` |
| Migration script tests | `npm run test:migrate` |
| Terraform | `terraform -chdir=infra/terraform fmt -check && terraform -chdir=infra/terraform validate` |

Vite HMR is not a type-check, so run `npm run typecheck` before you push. The ingest emulator test in `functions/gmail` is skipped unless `FIRESTORE_EMULATOR_HOST` is set.

### Firebase Deployment
Local deploys use git-ignored `.firebaserc` aliases. Copy [`.firebaserc.example`](.firebaserc.example) to `.firebaserc` and set `default` / `personal` to your project.

1.  **Login to Firebase from the root folder**:
    ```bash
    firebase login
    ```
2.  **Deploy the personal app** (functions, hosting, and Firestore rules/indexes after Terraform apply; see [infra/terraform/README.md](infra/terraform/README.md)):
    ```bash
    npm run deploy:personal
    ```
    Or `firebase deploy --project personal`. `firebase deploy` with no `--project` still uses the `default` alias. The functions predeploy step copies `shared/gcpNames.json` into `functions/shared/`, builds the TypeScript parsers, and lints the functions.
3.  **Deploy only personal hosting**:
    ```bash
    npm run deploy:personal:hosting
    ```

### CI/CD and demo deploy

Every push to `main` (and `workflow_dispatch`) runs [`.github/workflows/deploy-demo.yml`](.github/workflows/deploy-demo.yml). The `check` job runs `npm run lint`, `npm run typecheck`, and `npm test`. The `deploy` job builds a self-contained demo bundle (`npm run build:demo`), verifies it (`npm run verify:demo-bundle`), and deploys Hosting only with `firebase.demo.json`.

`vite build --mode demo` sets `__DEMO_BUILD__`. That build blanks Firebase env keys, never initializes Firebase, Auth, Firestore, Functions, or Google Identity Services, hides `/login` and the Gmail card, and ships synthetic data from `src/demoData`. [`firebase.demo.json`](firebase.demo.json) has only a `hosting` key, so a demo deploy cannot touch functions or Firestore. It also ignores `docs/**`, so README/SETUP screenshots under `public/docs` are not uploaded to the demo site, and the bundle analysis report is not generated or uploaded for demo builds.

Local preview:

```bash
npm run build:demo
npm run preview:demo
```

GitHub Environment `demo` (restrict it to `main`) holds:

- Secret `DEMO_FIREBASE_PROJECT_ID`
- Secrets `GCP_WORKLOAD_IDENTITY_PROVIDER` and `GCP_DEMO_DEPLOY_SERVICE_ACCOUNT` (Workload Identity Federation) **or** `FIREBASE_SERVICE_ACCOUNT_DEMO` (JSON key)
- Variable `DEMO_HOSTING_SITE` (optional custom Hosting site id)

The one-time console setup is in [docs/DEMO_DEPLOY.md](docs/DEMO_DEPLOY.md). `npm run deploy:demo` deploys locally using the `demo` `.firebaserc` alias. Pull requests run [`.github/workflows/ci.yml`](.github/workflows/ci.yml) (app lint/typecheck/test plus functions lint and tests).

### Branching Strategy

We follow a simplified version of Gitflow, which is well-suited for open-source projects:

*   **`main`**: This branch contains the stable, production-ready code. All releases are made from this branch.
*   **`develop`**: This is the main branch for active development. All new features and bug fixes should be merged into this branch.
*   **`feature/*`**: Feature branches are used for developing new features. They should be branched off from `develop` and merged back into `develop` when complete.
*   **`bugfix/*`**: Bugfix branches are used for fixing bugs. They should be branched off from `develop` and merged back into `develop` once the fix is verified.

### Contribution Guidelines

1.  **Fork the Repository**: Start by forking the Pennywise repository to your GitHub account.
2.  **Create a Branch**: Create a new branch for your feature or bug fix, following the naming convention (`feature/your-feature-name` or `bugfix/your-bug-fix`).
3.  **Make Changes**: Implement your changes, ensuring that the code is well-documented and follows our coding standards. New UI should use the design tokens in `src/styles/theme.scss` and include dark mode styles.
4.  **Test Your Changes**: Thoroughly test your changes to ensure they work as expected and don't introduce any new issues. Run the checks in [Running Tests and Checks](#running-tests-and-checks) that cover the code you touched: for frontend work `npm test`, `npm run lint`, and `npm run typecheck`; for Cloud Functions `npm test --prefix functions` and `npm run lint --prefix functions`; for `firestore.rules`, `npm run test:rules`.
5.  **Commit Your Changes**: Commit your changes with clear and concise commit messages.
6.  **Create a Pull Request**: Create a pull request (PR) from your branch to the `develop` branch of the Pennywise repository.
7.  **Code Review**: Your PR will be reviewed by the project maintainers. Address any feedback and make necessary changes.
8.  **Merge**: Once your PR is approved, it will be merged into the `develop` branch.

### Version Changes Guide

We follow Semantic Versioning (SemVer) for managing releases. The version number has the format `vX.Y.Z`, where:

*   `X` is the major version (incremented for breaking changes).
*   `Y` is the minor version (incremented for new features).
*   `Z` is the patch version (incremented for bug fixes).

### Project Overview for New Developers

This section provides a high-level overview of the project's architecture to help new developers get started.

#### 1. Data Flow: From Firestore to Your Browser

The React web app is designed to be fast and efficient by minimizing direct queries to Firestore. Here’s how it works:

1.  **Data mode**: Signed-out visitors get **demo mode** (`DemoExpenseAPI` + `src/demoData`). For a signed-in user the app probes `users/{uid}/meta/profile`; a permission-denied answer means the email is not in `allowedUsers` and the app stays in demo mode, otherwise it switches to `LiveExpenseAPI`.
2.  **Initial Data Fetch**: When you first load the app, it fetches expense, tag, vendor-tag, budget, and config data from Firestore under `users/{uid}/...`. Access is gated by `allowedUsers/{email}` in Firestore rules.
3.  **Local Caching**: This data is immediately cached in your browser’s **IndexedDB** (`Finance-{uid}`, one database per user). This creates a local copy of your database, allowing the app to load quickly on subsequent visits without waiting for the network.
4.  **Delta Sync**: Each document carries a `modifiedDate`. On later loads the app stores the time of its last fetch in IndexedDB and asks Firestore only for documents with `modifiedDate` at or after that time (with a one-hour overlap). The results are merged into IndexedDB and Redux. There are no real-time listeners: new Gmail imports appear on the next load, and **Settings → Reload Data** can reload from a date, reload everything, or clear the cache. Expense documents use `tags: string[]` with a deprecated `tag` mirror; see [docs/DATA_MODEL.md](docs/DATA_MODEL.md). A one-time `expenseSchemaVersion` bump forces a full refetch so older `modifiedDate` values are not missed.
5.  **Hidden duplicates**: Expenses merged as duplicates (`dupeStatus` `auto` or `confirmed`) stay in Firestore but are hidden from lists.

This "delta sync" approach ensures the app stays up-to-date without re-downloading the entire database, saving bandwidth and reducing costs.

#### 2. Automated Expense Tracking: Gmail push, Gemini, and Cloud Functions

Pennywise automates expense tracking with Gmail push notifications, regex parsing, **Google Gemini** as a fallback, and Firebase Cloud Functions (2nd gen, Node.js 22, region and service account from `shared/gcpNames.json`).

1.  **Bank list in Firestore**: `users/{uid}/config/emailParseBanks` with `{ id, displayName, matchStrings[] }`. **Settings → Banks** edits this list.
2.  **Connect Gmail** (`connectGmail` callable): the web app gets an authorization code from Google Identity Services. The function checks the caller is allowlisted, exchanges the code, refuses a Gmail account that is already connected to another user, stores the refresh token in Secret Manager (`gmail-rt-{uid}`), and starts `users.watch` on INBOX publishing to Pub/Sub topic `gmail-push`. `disconnectGmail` stops the watch, revokes the token, and deletes the secret.
3.  **`onGmailPush`** reads `history.list` from the saved cursor (falling back to a bank-phrase search if the cursor is too old), keeps only mail that matches a bank, parses it with regex first (`functions/src/parse/emailParsingConfig.json`) and Gemini second, and writes `users/{uid}/expense/{gmailMessageId}` plus a processed marker so each message is imported once. Vendors are normalized and a **primary** tag is set when a vendor–tag map matches exactly (`tags: [primary]` or `[]`, plus the deprecated `tag` mirror). Extra tags and description are not produced here; see [docs/DATA_MODEL.md](docs/DATA_MODEL.md).
4.  **Duplicate detection** (`functions/dedupe`) runs after each import over the last 7 days: alias groups and payment-rail groups are merged automatically (`duplicateOf`, `dupeStatus: 'auto'`); doubtful pairs are marked `dupeStatus: 'pending'` for **Settings → Duplicate Review**. Per-user overrides live in `users/{uid}/config/dedupeRules`.
5.  **`hourlyGmailSweep`** (every hour, Asia/Kolkata) processes every connected user, renews watches that expire within 2 days, and continues the resumable 30-day backfill. `invalid_grant` sets status disconnected.
6.  **Connection state**: server-only `users/{uid}/private/gmail` (cursor, backfill progress), client-readable `users/{uid}/meta/gmailStatus` (status, email, last error), and the `gmailConnections/{email}` index.

**Secrets**: OAuth client secret and Gemini API key live in Secret Manager shells created by Terraform. The React `.env` only has the public OAuth client id (`REACT_APP_GOOGLE_OAUTH_CLIENT_ID`) plus Firebase web config.

#### 3. Security: A Multi-Layered Approach

Security is a top priority. Pennywise protects your data at every layer:

1.  **React Web App**: The front end is secured with **Google Sign-In** through Firebase Authentication. Live data is available only when Firestore rules allow it. You control access by creating `allowedUsers/{email}` documents.
2.  **Cloud Functions**: There are no public HTTP endpoints. `connectGmail` and `disconnectGmail` are Firebase callable functions that require a signed-in user with a verified, allowlisted email. `onGmailPush` is triggered by Pub/Sub and `hourlyGmailSweep` by Cloud Scheduler. All functions run as a dedicated service account created by Terraform.
3.  **Firestore Database**: Rules allow an allowlisted user to read and write only `users/{uid}/**` collections listed in `firestore.rules`. Clients cannot read token or connection private docs, and `meta/gmailStatus` is read-only for clients. The access probe reads `users/{uid}/meta/profile`; permission-denied means demo mode.

This layered security model ensures that your financial data is kept private and accessible only to you.

#### 4. Understanding the React Application

The app has two layouts that switch at 800px (`useIsDesktop`). Desktop uses `AppShell` with a side navigation and, on Home, a "This month" dashboard panel; phones use a bottom navigation. Design tokens (colors, spacing, type, radius, shadow, motion) live in `src/styles/theme.scss`, with phone values by default and larger values from 800px; `designTokens.ts` and `appTheme.ts` mirror them for TypeScript and MUI.

The React application is divided into several key sections, each serving a specific purpose:

*   **Home** (`/home`): This is the main dashboard where you can see a list of your recent transactions. You can add new expenses manually, edit existing ones, set a primary tag plus optional extras and a note, search, and apply filters. Grouping uses the primary tag. Long-press selects expenses for merge or bulk delete.

*   **Insights** (`/stats`): This page offers a visual breakdown of your spending. It shows spending, daily, and monthly figures (average or median), charts grouped by days, vendor, tags, or cost, a top-vendors table, and XLSX/CSV export.

*   **Budget** (`/budget`): This section is for managing your financial goals. You can create budgets that cover one or more tags and track monthly progress.

*   **Settings** (`/profile`): Connect Gmail, Tags (retire is suggestion-only: the name moves to `legacyTagList` and stays valid on expenses; restore moves it back), Manage Vendor Tags (primary only), Auto-tag Expenses, Duplicate Review, Reload Data, dark/light theme, sign-out, and **Banks** (dynamic `emailParseBanks` for Gmail automation). See [docs/DATA_MODEL.md](docs/DATA_MODEL.md).
