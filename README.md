# PennyWise: Personal Expense Tracker

PennyWise is a comprehensive expense tracking web application designed to help users manage their personal finances by tracking and categorizing expenses. Built with modern web technologies, it provides a user-friendly interface for monitoring spending patterns and financial activities.

## Features

- 📊 **Expense Tracking**: Add, edit, and manage your daily expenses
- 🏷️ **Tagging System**: Categorize expenses with custom tags
- 📅 **Date Filtering**: Filter expenses by different time periods (1 day, 7 days, 2 weeks, etc.)
- 📊 **Visualization**: View spending patterns through statistical analysis
- 📱 **Responsive Design**: Works on both desktop and mobile devices
- 🔄 **Offline Support**: Uses IndexedDB for offline data access
- 🔒 **Google Authentication**: Secure login via Google OAuth

## Architecture

PennyWise is built using a modern front-end architecture with the following key components:

### Technology Stack

- **Frontend**: React, TypeScript, Material-UI
- **State Management**: Redux (with Redux Toolkit)
- **Database**:
  - Firebase Firestore (cloud storage)
  - IndexedDB (local storage for offline capability)
- **Authentication**: Google OAuth

### Data Flow

1. **User Authentication**: Users authenticate using Google OAuth
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

### Data Flow Diagram

```
┌─────────────┐     ┌───────────────┐     ┌───────────────┐
│             │     │               │     │               │
│  User Input ├────►│ React UI/Views├────►│ Redux Actions │
│             │     │               │     │               │
└─────────────┘     └───────┬───────┘     └───────┬───────┘
                            │                     │
                            │                     ▼
┌─────────────┐     ┌───────▼───────┐     ┌───────────────┐
│             │     │               │     │               │
│    Google   │     │  Redux Store  │◄────┤ Redux Reducers│
│    OAuth    │     │               │     │               │
│             │     └───────┬───────┘     └───────────────┘
└──────┬──────┘             │
       │                    │
       ▼                    ▼
┌─────────────┐     ┌───────────────┐     ┌────────────────┐
│             │     │               │     │                │
│ App.tsx     ├────►│  ExpenseAPI   ├────►│ FinanceIndexDB │
│Initial Load │     │               │     │ (Local Cache)  │
└─────────────┘     └───────┬───────┘     └───────┬────────┘
                            │                     │
                            ▼                     │
                    ┌───────────────┐             │
                    │               │             │
                    │   Firebase    │◄────────────┘
                    │  Firestore    │  (Sync when online)
                    │               │
                    └───────────────┘
```

### Core Components

- **Home**: Main dashboard showing expense list with filtering and grouping options
- **TagExpenses**: Interface for tagging and categorizing expenses
- **Statistics**: Visualizations and charts of spending patterns
- **Settings**: Application configuration and user profile management

## Data Models

### Expense

The core data model representing a financial transaction:

```typescript
interface Expense {
    id: string,
    tag: string,
    mailId: string,
    cost: number,
    costType: string,
    date: Date,
    user: string,
    type: 'credit' | 'debit',
    vendor: string
}
```

### TagMap

Maps vendors to expense categories:

```typescript
interface TagMap {
    tag: string,
    vendor: string,
    date: string
}
```

## Application Structure

The application follows a modular structure:

- `/api`: API clients for Firebase and IndexedDB
- `/components`: Reusable UI components
- `/pages`: Application screens and views
- `/store`: Redux store configuration and slices
- `/utility`: Helper functions and constants

## Data Storage

PennyWise uses a dual storage strategy:

1. **Firebase Firestore**: Cloud database for persistent storage
2. **IndexedDB**: Local browser database for offline access and performance

Data synchronization between these two storage systems ensures that:
- Users can access their data offline
- Changes are persisted to the cloud when connectivity is restored
- Application performance is optimized by reducing network requests

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```
git clone https://github.com/yourusername/finance.git
```

2. Install dependencies:
```
cd finance
npm install
```

3. Start the development server:
```
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) to view the application in your browser.

### Build for Production

To create an optimized production build:
```
npm run build
```

The build files will be located in the `build` folder.

## License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).
