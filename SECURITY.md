# Security Policy

This document outlines the security measures implemented in Pennywise to protect your data and ensure your privacy. Because you host Pennywise on your own Google Cloud project, you have complete control over your data and the application's infrastructure.

## Core Security Principles

Pennywise is designed with the following core security principles in mind:

*   **Data Ownership**: You own your data. All financial information is stored in your personal Google Firebase Firestore instance, and Pennywise developers have no access to it.
*   **Self-Hosted Infrastructure**: The entire backend, including Cloud Functions and the database, runs within your personal Google Cloud project. This gives you full control over the operational environment.
*   **Transparency**: The entire codebase is open-source and available on GitHub. You can inspect the code at any time to verify its functionality and security.
*   **Principle of Least Privilege**: The application and its components only request the minimum permissions necessary to function.

---

## Detailed Security Architecture

### 1. Web Application Security

The Pennywise web application is a client-side React application that runs in your browser. Security is enforced through Firebase Authentication and Firestore security rules.

*   **Authentication**: Users sign in with Google through Firebase Authentication. Upon successful authentication, Firebase provides the client with an ID token (a JSON Web Token, JWT).
*   **Authorization**: The Firebase SDK attaches this token to every Firestore and callable-function request. Firestore checks it against the security rules, and callable functions receive the verified user in their request context, so only authenticated requests from your application can reach your data.
*   **Allowlist**: Live data is served only to Google accounts with a verified email that has a document in the `allowedUsers` collection (document ID = lowercase email). Anyone else who signs in sees demo data only.
*   **Environment Variables**: The web app's `.env` holds only the Firebase web config and the public OAuth client id (`REACT_APP_GOOGLE_OAUTH_CLIENT_ID`). These values identify your project but are not secrets; your data is protected by the rules above. Real secrets (the OAuth client secret and the Gemini API key) are kept in Secret Manager and never placed in `.env` or the browser bundle.

### 2. Cloud Functions Security

The backend logic is handled by Cloud Functions for Firebase (2nd gen), which are protected by multiple layers of security.

*   **No public HTTP endpoints**: The only functions are two callables (`connectGmail`, `disconnectGmail`), a Pub/Sub-triggered function (`onGmailPush`), and a scheduled function (`hourlyGmailSweep`). The Pub/Sub and scheduled functions are invoked only by Google Cloud (Eventarc, Pub/Sub, and Cloud Scheduler), not by browsers.
*   **Callable verification**: Firebase verifies the caller's ID token before a callable runs. `connectGmail` and `disconnectGmail` additionally require a verified email that is on the `allowedUsers` allowlist, and they only act on the caller's own `uid`.
*   **Dedicated service account**: All functions run as a Terraform-created service account with only the roles they need (Firestore access, log writing, Eventarc event receiving, and the refresh-token secret role described below).

Here is a conceptual example of how a callable function checks the caller:

```javascript
const {onCall, HttpsError} = require('firebase-functions/v2/https');

exports.connectGmail = onCall(async (request) => {
  if (!request.auth || request.auth.token.email_verified !== true) {
    throw new HttpsError('unauthenticated', 'Sign in with a verified email.');
  }
  // Check allowedUsers/{email}, then act only on request.auth.uid
});
```

### 3. Gmail ingest security

Gmail access uses Google Identity Services with a single scope:

*   `https://www.googleapis.com/auth/gmail.readonly`: read mail. The app does not request `gmail.modify` and does not label or mark messages.
*   Refresh tokens are stored in Secret Manager (`gmail-rt-{uid}`); older secret versions are destroyed when a token is replaced. Firestore `users/{uid}/private/**` is not client-readable.
*   The Terraform custom role `pennywiseGmailRefreshTokenManager` is project-wide (it can create/get/delete any secret). IAM conditions cannot scope `secrets.create` to the `gmail-rt-` prefix; that prefix is enforced in `tokenStore`.
*   Callable `connectGmail` / `disconnectGmail` require a signed-in allowlisted user.
*   A Gmail account can be connected to only one Pennywise user at a time (`gmailConnections/{email}` index, not client-readable).
*   Disconnecting stops the Gmail watch, revokes the token with Google, and deletes the secret. If Google reports the token as revoked (`invalid_grant`), the connection is marked disconnected.
*   Only mail that matches one of your configured banks is parsed. Regex templates are tried first; the message text is sent to the Gemini API only when regex cannot parse it. The Gemini API key is read from Secret Manager.
*   Pub/Sub push is processed by Cloud Functions running as the Terraform functions service account.
*   Function logs are structured JSON and identify users by a short hash of the `uid`.

### 4. Firestore Security Rules

Data access in the Firestore database is governed by a set of security rules that are enforced on the server side. These rules ensure that users can only read and write their own data.

*   **Rule Enforcement**: Before any data operation (read, write, delete) is executed, Firebase evaluates your security rules. If the rules do not allow the operation, the request fails.
*   **Authentication-Based Access**: The rules are configured to only allow access to authenticated users whose email is verified and listed in `allowedUsers`.
*   **Ownership-Based Access**: The rules ensure that a user can only access documents under `users/{uid}` when `uid` matches their own Firebase user ID.
*   **Server-only data**: `users/{uid}/meta/gmailStatus` is read-only for clients (only Cloud Functions write it), and `users/{uid}/private/**`, `allowedUsers`, and `gmailConnections` cannot be read or written by clients at all.

The repo file [`firestore.rules`](firestore.rules) is the source of truth: allowlisted users may read and write only their `users/{uid}` expense, config, budget, vendorTag, and meta docs (except `meta/gmailStatus`). Paste it into the Firebase console or deploy with `firebase deploy --only firestore:rules`. The rules are covered by `npm run test:rules`.

This multi-layered security approach ensures that your financial data remains private and under your control at all times.
