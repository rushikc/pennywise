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

The Pennywise web application is a client-side React application that runs in your browser. Security is enforced through Firebase Authentication.

*   **Authentication**: Users log in via Google OAuth 2.0. Upon successful authentication, Firebase provides the client with a JSON Web Token (JWT).
*   **Authorization**: This JWT is sent in the `Authorization` header of every request to the backend Cloud Firestore & Functions. The backend verifies the token's signature and expiration to ensure that the request is coming from an authenticated user.
*   **Environment Variables**: Sensitive configuration details, such as Firebase API keys, are stored in a `.env` file and are not hardcoded into the application source code.

### 2. Cloud Functions Security

The backend logic is handled by Google Cloud Functions, which are protected by multiple layers of security.

*   **IAM & Invocation Control**: By default, Cloud Functions are protected by Google Cloud's Identity and Access Management (IAM). We configure them to require authentication, meaning they cannot be invoked by unauthenticated users.
*   **Token Verification**: Each Cloud Function that accesses user data is responsible for verifying the Firebase ID token (JWT) sent from the web app. The function decodes the token to get the user's unique ID (`uid`) and email, ensuring that users can only access their own data.

Here is a conceptual example of how a token is verified in a Cloud Function:

```javascript
const admin = require('firebase-admin');

exports.getExpenses = (req, res) => {
  const idToken = req.headers.authorization.split('Bearer ')[1];

  admin.auth().verifyIdToken(idToken)
    .then((decodedToken) => {
      const uid = decodedToken.uid;
      // Proceed to fetch data for the authenticated user (uid)
    })
    .catch((error) => {
      // Token is invalid, return an unauthorized error
      res.status(403).send('Unauthorized');
    });
};
```

### 3. Gmail ingest security

Gmail access uses Google Identity Services with a single scope:

*   `https://www.googleapis.com/auth/gmail.readonly`: read mail. The app does not request `gmail.modify` and does not label or mark messages.
*   Refresh tokens are stored in Secret Manager (`gmail-rt-{uid}`). Firestore `users/{uid}/private/**` is not client-readable.
*   Callable `connectGmail` / `disconnectGmail` require a signed-in allowlisted user.
*   Pub/Sub push is processed by Cloud Functions running as the Terraform functions service account.

### 4. Firestore Security Rules

Data access in the Firestore database is governed by a set of security rules that are enforced on the server side. These rules ensure that users can only read and write their own data.

*   **Rule Enforcement**: Before any data operation (read, write, delete) is executed, Firebase evaluates your security rules. If the rules do not allow the operation, the request fails.
*   **Authentication-Based Access**: The rules are configured to only allow access to authenticated users.
*   **Ownership-Based Access**: The rules ensure that a user can only access documents when their `email-id` matches .

The repo file [`firestore.rules`](firestore.rules) is the source of truth: allowlisted users may read and write only their `users/{uid}` expense, config, budget, vendorTag, and meta docs. Paste it into the Firebase console or deploy with `firebase deploy --only firestore:rules`.

This multi-layered security approach ensures that your financial data remains private and under your control at all times.
