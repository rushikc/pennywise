<div align="center">
  <br/>
  <table align="center">
    <tr>
      <td align="center" valign="middle" style="padding: 0 6px;"><img src="public/logo_low_res.png" alt="Pennywise Logo" width="150" height="150" /></td>
      <td align="center" valign="middle" style="padding: 0 6px;"><img src="public/gemini_logo.png" alt="Google Gemini" width="150" height="150" /></td>
    </tr>
  </table>
  <h1>Pennywise × Gemini</h1>
  <h3>Track, Analyze, and Master Your Personal Finances</h3>
</div>

<p align="center">
  <a href="#license">License</a> •
  <a href="#overview">Overview</a> •
  <a href="#features">Features</a> •
  <a href="#demo">Demo</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#Security-and-Cost">Security and Cost</a> •
  <a href="#technology-stack">Tech Stack</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#project-structure">Project Structure</a> •
  <a href="#Future-Roadmap">Future Roadmap</a> •
  <a href="#support-the-project">Support Project</a>
</p>

---
> **How email import works:** Transaction emails are **not** parsed with hard-coded bank regexes. Google **Gemini** reads the message (subject + body text the script can access) and returns structured fields (amount, debit/credit, vendor, payment type).  
> **Bank list (filter):** In **Settings → Banks** you add one or more entries with a display name and **match strings** (phrases that appear in that bank’s alert emails). The Apps Script only sends an email to Gemini if the plain text matches one of your banks—this cuts noise and API cost.  
> **Practical limit:** Your bank or card issuer should send **consistent** alert layouts for the transactions you care about. If formats vary wildly, Gemini may occasionally mis-read a field; you can adjust prompts or bank strings over time. Any institution whose alerts you can fingerprint with match strings is a candidate—not limited to a single bank brand.

## License

This project is licensed under the [MIT License](LICENSE).


## Overview

Pennywise is a comprehensive, open-source web application designed to empower individuals in managing their personal
finances. It provides an intuitive platform to track, categorize, and visualize expenses, helping users gain clear
insights into their spending patterns and achieve financial mastery. Built with modern web technologies, Pennywise offers
a user-friendly experience with robust features, including offline support and secure authentication.

## Features

* 📊 **Expense Tracking**: Easily add, edit, and manage your daily expenses with detailed inputs.
* 📧 **Gmail + Gemini**: Periodically scan Gmail for messages that match **banks you configure**; **Gemini** extracts amount, vendor, and payment type from the email text.
* 🏦 **Configurable banks**: Under **Settings → Banks**, add or remove banks and **match strings** so only relevant sender/templates are sent to the model.
* 🏷️ **Tagging System**: Categorize expenses with custom tags for flexible and granular organization.
* 🤖 **Auto Tagging**: Cloud functions automatically apply tags to new expenses based on previously user-marked
  vendor-tag associations.
* 📅 **Date Filtering**: Filter expenses by various time periods (e.g., 1 day, 7 days, 2 weeks, & more) for focused
  analysis.
* 📊 **Visualization**: Understand spending patterns at a glance through interactive statistical charts and graphs.
* 🔄 **Offline Caching**: Data is cached locally using IndexedDB to reduce Firestore queries, but the app requires
  internet connectivity to function fully.
* 🔒 **Google Authentication**: Secure and convenient login via Google OAuth for user management.

## Demo

### Demo mode
Signed-out visitors, and signed-in users denied by Firestore security rules, use this same app on mock data. Only accounts the rules allow read live Firestore data. Access is controlled only by those rules—there is no email allowlist or extra environment variable.

![APP](public/docs/pics/app.png)
![APP2](public/docs/pics/app2.png)

## Getting Started

For detailed setup instructions, please refer to the guide below (30-60 min setup time)
<p align="center">
  <a href="SETUP.md" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 10px 20px; background-color: #008CBA; color: white; text-decoration: none; border-radius: 5px;">
    View Setup Instructions
  </a>
</p>

## Security and Cost

Pennywise is designed with your data privacy and security as a top priority. Unlike many other financial apps, Pennywise
gives you complete control over your data and infrastructure. Here’s what makes our approach to security different:

* **🔒 You Own Your Data**: Your financial data is yours alone. It is stored in your own Google Firebase Firestore
  instance, not on our servers. You have full control over who can access it.

* **☁️ Self-Hosted on Your Google Cloud**: You deploy Pennywise on your personal Google Cloud project. This means you
  manage the entire infrastructure, ensuring that you are the only one with access to the backend services and database.

* **💸 No Hidden Costs**: Pennywise is open-source and free to use. You only pay for what you use on the Google Cloud
  Platform, which offers a generous free tier for Firebase and Cloud Functions.

* **🚫 No Ads, No Tracking**: Pennywise is a completely ad-free platform. We do not track your behavior or sell your data
  to third parties. Our goal is to provide a tool that helps you manage your finances, not to monetize your personal
  information.

* **📖 Open Source Transparency**: The entire codebase is open-source. You can inspect the code yourself to verify that
  there are no hidden trackers or malicious logic. This transparency ensures that we are accountable to our users.

* **🔐 Secure Authentication**: We use Google OAuth for authentication, which provides a secure and reliable way to log
  in to your account without us ever seeing or storing your password.

* **🔑 Minimal Permissions**: The web app uses Google Sign-In; the **Apps Script** add-on uses **Gmail read-only** to list and read messages. The script filters messages using **your** bank match strings, then calls **Gemini** and your **Cloud Functions**—it does not broad-scan third parties beyond what you configure.

* **⚙️ You Control Updates**: Since you host the application, you are in full control of when and how you update it. You
  will never be forced into an update that changes the functionality or privacy in a way you don't agree with.

* **🔒 Secured Infrastructure**: All backend services on Google Cloud are protected by Google's authentication mechanisms,
  including the infrastructure exposed to the public internet. This ensures that only authenticated requests from
  your application can access your data and services.

By putting you in control of your data and the application's infrastructure, Pennywise offers a transparent and secure
way to manage your personal finances.

For a detailed explanation of the security architecture, please see the [Security Policy](SECURITY.md).

## Technology Stack

Pennywise leverages a modern and robust set of technologies to deliver a user-friendly and maintainable application.

### Frontend

* **UI Framework**: [React](https://reactjs.org/)
* **Type Safety**: [TypeScript](https://www.typescriptlang.org/)
* **Component Library**: [Material-UI v6](https://mui.com/)
* **Animations**: [Framer Motion](https://www.framer.com/motion/)
* **Charts**: [Recharts](https://recharts.org/en-US/)

### State Management

* **Centralized State**: [Redux Toolkit](https://redux-toolkit.js.org/)

### Data Storage

* **Cloud Database**: [Firebase Firestore](https://firebase.google.com/docs/firestore)
* **Offline Storage**: [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) (
  via [idb](https://www.npmjs.com/package/idb) library)

### Authentication

* **OAuth Provider**: [Google OAuth](https://developers.google.com/identity/protocols/oauth2) (integrated
  using [@react-oauth/google](https://www.npmjs.com/package/@react-oauth/google))

### Utilities

* **Date Manipulation**: [dayjs](https://day.js.org/)
* **HTTP Client**: [axios](https://axios-http.com/)

## Project Structure

```
pennywise/
├── appScript/              # Google Apps Script for email integration
├── build/                  # Production build output
├── commands/               # Build and deployment scripts
├── functions/              # Firebase Cloud Functions
├── node_modules/           # Node.js dependencies
├── public/                 # Static assets served directly
├── scripts/                # Build and utility scripts
└── src/                    # React application source code
    ├── api/                # API clients and data fetching
    ├── components/         # Reusable UI components
    ├── firebase/           # Firebase configuration & utilities
    ├── hooks/              # Custom React hooks
    ├── pages/              # Application pages & views
    │   ├── budget/         # Budget management pages
    │   ├── home/           # Main dashboard and expense views
    │   ├── insights/       # Analytics and insights pages
    │   ├── login/          # Authentication flow
    │   └── setting/        # Application settings
    ├── store/              # Redux store configuration
    ├── styles/             # Global styles and themes
    └── utility/            # Helper functions & constants
```

## Architecture

Pennywise is built using a modern front-end architecture with the following key components:

### Overview

1. **User Authentication**:
  - Users authenticate using Google OAuth
2. **Data Fetching**:
  - On app initialization, data is fetched from Firebase Firestore
  - Data is stored locally in IndexedDB for offline access
  - Redux store is populated with expense and tag data
3. **User Interactions**:
  - Users can view, filter, and group expenses
  - New expenses can be added manually or imported
  - Expenses can be tagged for categorization
4. **Data Persistence**:
  - Changes are saved to both IndexedDB and Firebase
  - Data synchronization happens automatically when online

### Gmail automation (Apps Script + Gemini)

1. **Bank routing config** is stored in Firestore as `config/emailParseBanks` (`banks[]` with `displayName` + `matchStrings`). The React app **Settings → Banks** edits this list.
2. **Apps Script** (`appScript/`) runs on a schedule (e.g. hourly). It loads the latest bank list via your **Cloud Function** `getOneDoc`, fetches recent Gmail messages, and builds plain text from snippets/HTML.
3. If the text contains any configured **match string** (case-insensitive), the message is a candidate. The script sends **subject + body text** to the **Gemini API** with a JSON schema style prompt.
4. A validated object (cost, `costType`, vendor, `type`) is posted to **`addExpenseData`**, which writes to Firestore. **Vendor tags** you define in the app can still be applied when the normalized vendor string matches.
5. Optional safeguards in script: **IST quiet hours** (skip runs outside the configured daily window) and **Script properties / env** for `GEMINI_API_KEY` and project routing—see [SETUP.md](SETUP.md).

### Architecture Diagram

![Architecture Diagram](public/docs/Pennywise.drawio.svg)

## Application Sections

The React application is divided into several key sections, each serving a specific purpose:

*   **Home**: This is the main dashboard where you can see a list of your recent transactions. You can add new expenses manually, edit existing ones, attach a tag to the expense, and apply filters to view expenses from different time periods or by different grouping.


*   **Insights**: This page offers a visual breakdown of your spending. It features charts and graphs that categorize your expenses by tags, helping you quickly identify your top spending areas. You can download the reports in xlsx & csv format.


*   **Budget**: This section is for managing your financial goals. You can set monthly budgets for different expense categories and track your progress to see how your spending aligns with your budget.


*   **Settings**: Customize tags, **vendor–tag maps**, your profile, and other options. Use **Banks** (`/setting-banks`) to maintain the list of banks (match strings) that gate which emails are sent to Gemini—add or remove entries as you add accounts or change issuers.

## Future Roadmap

- [ ] Per-bank prompt hints or templates (optional tuning on top of Gemini)
- [ ] Google pub sub integration for real-time event driven updates instead of using AppScript as hourly jobs
- [ ] Enhancing Insights with more detailed analytics & better graph support grouped by category
- [ ] Multi-selected expense tagging feature
- [ ] Expense analysis using historical data (Firebase AI Logic)
- [ ] Expense sharing/tracking between users (Multi-user persona)

## Contributing & Local Development

We welcome contributions to Pennywise! If you're interested in helping out, please refer to our [Development Guide](DEVELOP.md) for instructions on setting up the project locally, contributing code, and submitting pull requests.


## Support the Project

<a href="https://www.buymeacoffee.com/arcticfoxrc"><img src="https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20coffee&emoji=&slug=arcticfoxrc&button_colour=5F7FFF&font_colour=ffffff&font_family=Lato&outline_colour=000000&coffee_colour=FFDD00" /></a>

---
<div align="center">
  <p>Created with ❤️ by <a href="https://github.com/rushikc"> rushikc </a> & <a href="https://github.com/features/copilot">Copilot</a></p>
  <p>rushikc.dev@gmail.com</p>
</div>
