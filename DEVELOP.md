### Setting Up a Local Development Environment

**Prerequisites**
- Node.js (version >= 20.0.0)
- npm (version >= 10.0.0)

**Firebase Setup**

This project uses Firebase for authentication and database services. To run the app locally, you'll need to create your own Firebase project.
First complete the setup instructions in the [Setup Documentation](./SETUP.md) .

- You would have already created `.env` file in the root folder of your project in below format as per the setup instructions.
- For React project, you can use the following format:
    ```env
    REACT_APP_FIREBASE_API_KEY=your-api-key
    REACT_APP_FIREBASE_AUTH_DOMAIN=your-auth-domain
    REACT_APP_FIREBASE_PROJECT_ID=your-project-id
    REACT_APP_FIREBASE_STORAGE_BUCKET=your-storage-bucket
    REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
    REACT_APP_FIREBASE_APP_ID=your-app-id
    ```

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/your-username/pennywise.git
    cd pennywise
    ```
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Start the Development Server**:
    ```bash
    npm start
    ```
This will start the app in development mode. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### AppScript Development

For developing Google Apps Script code, you have two main options:

1.  **Using `clasp`**:
    *   `clasp` is a command-line tool that lets you develop your Apps Script projects locally.
    *   You can write code in your favorite editor, and then use `clasp push` to upload the code to your script project.
    *   For `clasp push` to work, you need a `.clasp.json` file in the `appScript/` directory. This file links your local code to the correct Google Apps Script project.
    *   The `.clasp.json` file should contain the `scriptId` of your project, which you can find in the Apps Script editor under "Project Settings".
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
    *   It's a good option for quick changes or for those who prefer an all-in-one web-based IDE.



### Branching Strategy

We follow a simplified version of Gitflow, which is well-suited for open-source projects:

*   **`main`**: This branch contains the stable, production-ready code. All releases are made from this branch.
*   **`develop`**: This is the main branch for active development. All new features and bug fixes should be merged into this branch.
*   **`feature/*`**: Feature branches are used for developing new features. They should be branched off from `develop` and merged back into `develop` when complete.
*   **`bugfix/*`**: Bugfix branches are used for fixing bugs. They should be branched off from `develop` and merged back into `develop` when the fix is verified.

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


### Static Demo App

For demonstration purposes, you can use the static demo code available in the `feature/static-demo-page`. 
This code simulates the behavior of the application without requiring a live backend or database connection.

Below files are modified to convert the app to a static demo version:
- `src/hooks/useAuth.ts`
- `src/pages/login/AuthContext.tsx`
- `src/api/ExpsenseAPI.ts`
- `src\data` contains static json files for expenses, categories and settings
- `src/routes.ts` disable protection on routes
- `src\pages\home\Home.tsx` : add a useEffect which fetches expenseList on load
- comment all instances of `navigate('/login')` from the codebase