/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

/* eslint-disable @typescript-eslint/no-var-requires */

import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {Provider} from 'react-redux';
import {MemoryRouter} from 'react-router-dom';
import App from './App';
import {store} from './store/store';
import {resetExpenseState} from './store/expenseActions';
import {ErrorHandlers} from './components/ErrorHandlers';
import {setDataMode} from './pages/login/dataMode';

type TestUser = {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
};

type DataMode = 'demo' | 'live' | 'checking';

const mockAuthState = {
  currentUser: null as TestUser | null,
  loading: false,
  dataMode: 'demo' as DataMode,
};

const mockClearIndexedDBData = jest.fn().mockResolvedValue(undefined);

jest.mock('./pages/login/AuthContext', () => {
  const React = require('react') as typeof import('react');
  const Ctx = React.createContext(null as unknown);
  const AuthProvider = ({children}: {children: React.ReactNode}) => {
    const [, setVersion] = React.useState(0);
    const value = {
      currentUser: mockAuthState.currentUser,
      loading: mockAuthState.loading,
      dataMode: mockAuthState.dataMode,
      signInWithGoogle: jest.fn(),
      signOut: async () => {
        await mockClearIndexedDBData();
        mockAuthState.currentUser = null;
        mockAuthState.dataMode = 'demo';
        const {setDataMode: setMode} = require('./pages/login/dataMode') as typeof import('./pages/login/dataMode');
        setMode('demo');
        setVersion((version: number) => version + 1);
      },
    };
    return React.createElement(Ctx.Provider, {value}, children);
  };
  return {
    AuthProvider,
    useAuth: () => React.useContext(Ctx),
  };
});

jest.mock('./pages/login/dataMode', () => {
  let mode: DataMode = 'demo';
  return {
    getDataMode: () => mode,
    setDataMode: (next: DataMode) => {
      mode = next;
    },
    probeFirestoreAccess: jest.fn(),
    resolveModeForAuth: jest.fn(),
  };
});

jest.mock('./pages/dataValidations', () => ({
  loadInitialAppData: () => {
    const {store: appStore} = require('./store/store') as typeof import('./store/store');
    const {expenseSlice: slice} = require('./store/expenseSlice') as typeof import('./store/expenseSlice');
    appStore.dispatch(slice.actions.setExpenseState({
      expenseList: [],
      vendorTagList: [],
      darkMode: false,
    }));
  },
}));

jest.mock('./api/FinanceIndexDB', () => ({
  FinanceIndexDB: {
    initDB: jest.fn(),
    clearIndexedDBData: () => mockClearIndexedDBData(),
    addVendorTag: jest.fn(),
  },
}));

const mockGetDuplicateCandidates = jest.fn().mockResolvedValue([]);

jest.mock('./api/ExpenseAPI', () => ({
  ExpenseAPI: {
    getDuplicateCandidates: (...args: unknown[]) => mockGetDuplicateCandidates(...args),
    updateDarkMode: jest.fn().mockResolvedValue(true),
  },
}));

jest.mock('./api/LiveExpenseAPI', () => ({
  LiveExpenseAPI: {},
}));

jest.mock('./components/Loading', () => () => null);

jest.mock('./firebase/firebaseConfig', () => ({}));
jest.mock('firebase/app', () => ({
  getApp: jest.fn(() => ({})),
  initializeApp: jest.fn(() => ({})),
}));
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  GoogleAuthProvider: jest.fn(),
}));
jest.mock('firebase/firestore/lite', () => ({
  getFirestore: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  deleteDoc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
}));

jest.mock('@mui/material/useMediaQuery', () => ({
  __esModule: true,
  default: () => false,
}));

jest.mock('./routes', () => {
  const React = require('react') as typeof import('react');
  const {useAuth} = require('./pages/login/AuthContext') as typeof import('./pages/login/AuthContext');
  const {useNavigate} = require('react-router-dom') as typeof import('react-router-dom');
  const TestSettings = () => {
    const {currentUser, dataMode, signOut} = useAuth();
    const navigate = useNavigate();
    const deniedLiveUser = Boolean(currentUser) && dataMode === 'demo';
    const showSignOut = Boolean(currentUser);
    const showOtherTiles = !deniedLiveUser;
    return React.createElement('div', null,
      showOtherTiles ? React.createElement('div', null, 'Tags') : null,
      showOtherTiles ? React.createElement('div', null, 'Reload Data') : null,
      showSignOut
        ? React.createElement('button', {
          onClick: () => {
            void signOut().then(() => navigate('/'));
          },
        }, 'Sign Out')
        : null,
    );
  };
  return {
    routes: [
      {
        key: 'home-route',
        title: 'Home',
        path: '/home',
        enabled: true,
        isProtected: true,
        component: () => React.createElement('div', null, 'Home page'),
      },
      {
        key: 'profile-route',
        title: 'Profile',
        path: '/profile',
        enabled: true,
        isProtected: true,
        component: TestSettings,
      },
    ],
  };
});

const liveUser: TestUser = {
  uid: 'user-1',
  displayName: 'Ada Lovelace',
  email: 'ada@example.com',
  photoURL: null,
};

const renderApp = (path = '/') => render(
  <Provider store={store}>
    <MemoryRouter initialEntries={[path]}>
      <App/>
    </MemoryRouter>
  </Provider>,
);

describe('App demo mode', () => {
  beforeEach(() => {
    mockAuthState.currentUser = null;
    mockAuthState.loading = false;
    mockAuthState.dataMode = 'demo';
    mockClearIndexedDBData.mockClear();
    resetExpenseState();
    setDataMode('demo');
  });

  it('sends a signed-out visitor to /home with the demo banner', async () => {
    renderApp('/');
    expect(await screen.findByText('Home page')).toBeInTheDocument();
    expect(screen.getByText('You\'re viewing demo data.')).toBeInTheDocument();
    expect(screen.queryByText('Sign in with Google')).not.toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Stats')).toBeInTheDocument();
  });

  it('hides the banner for a live user', async () => {
    mockAuthState.currentUser = liveUser;
    mockAuthState.dataMode = 'live';
    setDataMode('live');
    renderApp('/home');
    expect(await screen.findByText('Home page')).toBeInTheDocument();
    expect(screen.queryByText('You\'re viewing demo data.')).not.toBeInTheDocument();
  });

  it('shows only Sign out in Settings for a denied signed-in user', async () => {
    mockAuthState.currentUser = liveUser;
    mockAuthState.dataMode = 'demo';
    renderApp('/profile');
    expect(await screen.findByText('Sign Out')).toBeInTheDocument();
    expect(screen.getByText('You\'re viewing demo data.')).toBeInTheDocument();
    expect(screen.queryByText('Tags')).not.toBeInTheDocument();
    expect(screen.queryByText('Reload Data')).not.toBeInTheDocument();
  });

  it('clears IndexedDB on sign-out and falls back to demo', async () => {
    mockAuthState.currentUser = liveUser;
    mockAuthState.dataMode = 'live';
    setDataMode('live');
    renderApp('/profile');
    expect(await screen.findByText('Sign Out')).toBeInTheDocument();
    expect(screen.queryByText('You\'re viewing demo data.')).not.toBeInTheDocument();

    userEvent.click(screen.getByText('Sign Out'));
    await waitFor(() => {
      expect(mockClearIndexedDBData).toHaveBeenCalled();
    });
    expect(await screen.findByText('You\'re viewing demo data.')).toBeInTheDocument();
    expect(await screen.findByText('Home page')).toBeInTheDocument();
  });

  it('never shows the access denied modal in demo mode', async () => {
    const modalSpy = jest.spyOn(ErrorHandlers, 'showAccessDeniedModal');
    renderApp('/home');
    await screen.findByText('Home page');
    ErrorHandlers.handleApiError({code: 'permission-denied'});
    expect(modalSpy).not.toHaveBeenCalled();
    expect(document.getElementById('error-modal-root')).toBeNull();
    modalSpy.mockRestore();
  });
});
