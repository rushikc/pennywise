/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

jest.mock('./utility/buildMode', () => ({
  IS_DEMO_BUILD: true,
}));

jest.mock('./pages/login/AuthContext', async () => {
  const React = await import('react');
  const Ctx = React.createContext(null as unknown);
  const AuthProvider = ({children}: {children: React.ReactNode}) => {
    const value = {
      currentUser: null,
      loading: false,
      dataMode: 'demo' as const,
      signInWithGoogle: jest.fn(),
      signOut: jest.fn(),
    };
    return React.createElement(Ctx.Provider, {value}, children);
  };
  return {
    AuthProvider,
    useAuth: () => React.useContext(Ctx),
  };
});

jest.mock('./pages/dataValidations', async () => {
  const {store: appStore} = await import('./store/store');
  const {expenseSlice: slice} = await import('./store/expenseSlice');
  return {
    loadInitialAppData: () => {
      appStore.dispatch(slice.actions.setExpenseState({
        expenseList: [],
        vendorTagList: [],
        darkMode: false,
      }));
    },
  };
});

jest.mock('./api/FinanceIndexDB', () => ({
  deleteLegacyFinanceIdb: jest.fn(),
  FinanceIndexDB: {initDB: jest.fn()},
}));

jest.mock('./api/ExpenseAPI', () => ({
  ExpenseAPI: {
    getDuplicateCandidates: () => Promise.resolve([]),
    updateDarkMode: jest.fn().mockResolvedValue(true),
  },
}));

jest.mock('./components/Loading', () => ({default: () => null}));

jest.mock('@mui/material/useMediaQuery', () => ({
  __esModule: true,
  default: () => false,
}));

jest.mock('./routes', async () => {
  const React = await import('react');
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
    ],
  };
});

import {render, screen} from '@testing-library/react';
import {Provider} from 'react-redux';
import {MemoryRouter} from 'react-router-dom';
import App from './App';
import {store} from './store/store';
import {resetExpenseState} from './store/expenseActions';

describe('App demo build routing', () => {
  beforeEach(() => {
    resetExpenseState();
  });

  it('redirects /login to /home and shows the demo-build banner', async () => {
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/login']}>
          <App/>
        </MemoryRouter>
      </Provider>,
    );
    expect(await screen.findByText('Home page')).toBeInTheDocument();
    expect(screen.getByText(/Demo: sample data only/)).toBeInTheDocument();
    expect(screen.queryByText('Sign in with Google')).not.toBeInTheDocument();
  });
});
