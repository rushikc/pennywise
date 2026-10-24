### Setting Up a Local Development Environment

**Prerequisites**
- Node.js (version >= 22.0.0)
- npm (version >= 10.0.0)

**Firebase Setup**

This project uses Firebase for authentication and database services. To run the app locally, you'll need to create your own Firebase project.
First, complete the setup instructions in the [Setup Documentation](SETUP.md).

- You should have already created a `.env` file in the root folder of your project in the format below, as per the setup instructions.
- For a React project, you can use the following format:
    ```env
    REACT_APP_FIREBASE_API_KEY=your-api-key
    REACT_APP_FIREBASE_AUTH_DOMAIN=your-auth-domain
    REACT_APP_FIREBASE_PROJECT_ID=your-project-id
    REACT_APP_FIREBASE_STORAGE_BUCKET=your-storage-bucket
    REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
    REACT_APP_FIREBASE_APP_ID=your-app-id
    # Optional, for Firebase Analytics if you enable it in code:
    # REACT_APP_FIREBASE_MEASUREMENT_ID=G-xxxxxxxxxx
    ```

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/rushikc/pennywise.git
    cd pennywise
    ```
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Start the Development Server**:
    ```bash
    npm run dev
    ```
This starts Vite with React Fast Refresh. Open [http://127.0.0.1:3000](http://127.0.0.1:3000) to view it in your browser. `npm start` is the same command. After changing the Vite toolchain, restart the dev server instead of reusing an old process on port 3000.

### Firebase Deployment
To deploy the Firebase functions and hosting, follow these steps:
1.  **Login to Firebase from the root folder**:
    ```bash
    firebase login
    ```
2.  **Deploy Firebase functions and hosting**:
    ```bash
    firebase deploy
    ```
3.  **Deploy only hosting (web app hosting)**:
    ```bash
    firebase deploy --only hosting
    ```

### AppScript development

For developing Google Apps Script code, you have two main options:

1.  **Using `clasp`**:
    *   `clasp` is a command-line tool that lets you develop your Apps Script projects locally.
    *   You can write code in your favorite editor and then use `clasp push` to upload the code to your script project.
    *   Create **`appScript/env.js`** locally (see [SETUP.md](SETUP.md)): it defines `PROJECT_ID`, `PROJECT_REGION`, and `GEMINI_API_KEY` (typically loaded from **Script properties**). The file is **gitignored**; it must exist on your machine before you push.
    *   For `clasp push` to work, you need a `.clasp.json` file in the `appScript/` directory. This file links your local code to the correct Google Apps Script project.
    *   The `.clasp.json` file should contain the `scriptId` of your project, which you can find in the Apps Script editor under "Project Settings."
        ```json
        {
        "scriptId": "your-apps-script-id",
        "rootDir": "",
        "scriptExtensions": [
        ".js",
        ".gs"
        ],
        "htmlExtensions": [
        ".html"
        ],
        "jsonExtensions": [
        ".json"
        ],
        "filePushOrder": [],
        "skipSubdirectories": false
        }
        ```
    *   This is the recommended approach for managing larger projects and for integrating with version control systems like Git.


2.  **Using the AppScript Web Editor**:
    *   You can also work directly in the Google Apps Script web editor.
    *   This allows you to write, save, run, and test your code in the same environment.
    *   It's a good option for quick changes or for those who prefer an all-in-one, web-based IDE.



### Branching Strategy

We follow a simplified version of Gitflow, which is well-suited for open-source projects:

*   **`main`**: This branch contains the stable, production-ready code. All releases are made from this branch.
*   **`develop`**: This is the main branch for active development. All new features and bug fixes should be merged into this branch.
*   **`feature/*`**: Feature branches are used for developing new features. They should be branched off from `develop` and merged back into `develop` when complete.
*   **`bugfix/*`**: Bugfix branches are used for fixing bugs. They should be branched off from `develop` and merged back into `develop` once the fix is verified.

### Contribution Guidelines

1.  **Fork the Repository**: Start by forking the Pennywise repository to your GitHub account.
2.  **Create a Branch**: Create a new branch for your feature or bug fix, following the naming convention (`feature/your-feature-name` or `bugfix/your-bug-fix`).
3.  **Make Changes**: Implement your changes, ensuring that the code is well-documented and follows our coding standards.
4.  **Test Your Changes**: Thoroughly test your changes to ensure they work as expected and don't introduce any new issues.
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

1.  **Initial Data Fetch**: When you first load the app, it fetches all your expense and tag data from Firestore.
2.  **Local Caching**: This data is immediately cached in your browser’s **IndexedDB**. This creates a local copy of your database, allowing the app to load quickly on subsequent visits without waiting for the network.
3.  **Delta Sync**: The app listens for real-time updates from Firestore. When a change occurs in the database (e.g., a new expense is added), only the new or modified data (**the delta**) is sent to the app. This update is then synced with the local IndexedDB cache and the UI.

This "delta sync" approach ensures the app stays up-to-date without re-downloading the entire database, saving bandwidth and reducing costs.

#### 2. Automated Expense Tracking: Apps Script, Gemini, and Cloud Functions

Pennywise automates expense tracking by combining Gmail, **Google Gemini**, and Firebase Cloud Functions. There is **no** fixed regex-per-bank pipeline in the main flow—the model interprets each candidate email’s text.

1.  **Bank list in Firestore**: The web app stores `config/emailParseBanks` with an array of `{ id, displayName, matchStrings[] }`. **Settings → Banks** (`ManageBanks.tsx`) edits this list. Match strings are simple substrings that must appear in the email body/snippet (case-insensitive) before the message is sent to Gemini—think of them as fingerprints for “this is my bank’s alert template.”
2.  **Google Apps Script** (`appScript/`): Runs on a time-driven trigger (see `trigger.js`). It loads `emailParseBanks` via the `getOneDoc` Cloud Function, reads recent Gmail messages, and derives plain text (snippet + HTML body via `utility.js`).
3.  **Gemini**: For each message that matches at least one bank entry, the script calls the **Generative Language API** (`callGemini` in `expenses.js`) with subject + body and expects JSON (`cost`, `costType`, `vendor`, `type`, or `null` if not a transaction). Validation helpers live in `functions.js` (`isValidExpenseGeminiShape`, `normalizeGeminiExpense`).
4.  **Cloud Functions** (`functions/`): `addExpenseData` persists the expense to Firestore; `getOneDoc` / `setOneDoc` / `getAllDoc` sync config and vendor tags. The script authenticates with the same OAuth model described in [SETUP.md](SETUP.md).

**Secrets**: `GEMINI_API_KEY` and Firebase project routing (`PROJECT_ID`, `PROJECT_REGION`) are **not** in the React `.env`. They are provided to Apps Script via **`appScript/env.js`** (gitignored) and/or **Script properties**—see [SETUP.md](SETUP.md).

This design keeps Gmail access in the script you own, while the React app only talks to Firebase.

#### 3. Security: A Multi-Layered Approach

Security is a top priority. Pennywise protects your data at every layer:

1.  **React Web App**: The front end is secured with **Google Sign-In (OAuth)**. Only authenticated users can access the application. You control who has access by adding authorized email addresses in the Firestore rules.
2.  **Cloud Functions**: The backend Cloud Functions are protected and can only be accessed by authenticated users. Every request to a function must include a valid **OAuth token (JWT)**, which the function verifies before executing. This prevents unauthorized access to your backend logic.
3.  **Firestore Database**: The database is protected by **Firestore Security Rules**. These server-side rules ensure that users can only read and write their own data. For example, a rule can specify that a user’s email must match the email associated with the data they are trying to access.

This layered security model ensures that your financial data is kept private and accessible only to you.

#### 4. Understanding the React Application

The React application is divided into several key sections, each serving a specific purpose:

*   **Home**: This is the main dashboard where you can see a list of your recent transactions. You can add new expenses manually, edit existing ones, and apply filters to view expenses from different time periods.

*   **Insights**: This page offers a visual breakdown of your spending. It features charts and graphs that categorize your expenses by tags, helping you quickly identify your top spending areas.

*   **Budget**: This section is for managing your financial goals. You can set monthly budgets for different expense categories and track your progress to see how your spending aligns with your budget.

*   **Settings**: Tags, vendor–tag maps, profile, and **Banks** (dynamic `emailParseBanks` for Gmail automation).
