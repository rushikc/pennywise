/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter} from 'react-router-dom';
import {Provider} from 'react-redux';
import Settings from './Settings';
import {store} from '../../store/store';

const mockSignOut = jest.fn().mockResolvedValue(undefined);
const mockAuth = {
  currentUser: null as {displayName: string; email: string; photoURL: string | null} | null,
  dataMode: 'demo' as 'demo' | 'live' | 'checking',
  signOut: (...args: unknown[]) => mockSignOut(...args),
};

jest.mock('../login/AuthContext', () => ({
  __esModule: true,
  useAuth: () => mockAuth,
}));

jest.mock('../../api/ExpenseAPI', () => ({
  __esModule: true,
  ExpenseAPI: {
    getDuplicateCandidates: () => Promise.resolve([]),
    updateDarkMode: () => Promise.resolve(true),
  },
}));

jest.mock('../../store/alertActions', () => ({
  createTimedAlert: jest.fn(),
}));

const renderSettings = () => render(
  <Provider store={store}>
    <MemoryRouter>
      <Settings/>
    </MemoryRouter>
  </Provider>,
);

describe('Settings', () => {
  beforeEach(() => {
    mockAuth.currentUser = null;
    mockAuth.dataMode = 'demo';
    mockSignOut.mockClear();
  });

  it('hides Sign out for a signed-out demo visitor', () => {
    renderSettings();
    expect(screen.getByText('Tags')).toBeInTheDocument();
    expect(screen.queryByText('Sign Out')).not.toBeInTheDocument();
  });

  it('shows only Sign out for a signed-in user denied by Firestore', () => {
    mockAuth.currentUser = {displayName: 'Ada', email: 'ada@example.com', photoURL: null};
    mockAuth.dataMode = 'demo';
    renderSettings();
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
    expect(screen.queryByText('Tags')).not.toBeInTheDocument();
    expect(screen.queryByText('Reload Data')).not.toBeInTheDocument();
  });

  it('keeps the full tile set for a live user', () => {
    mockAuth.currentUser = {displayName: 'Ada', email: 'ada@example.com', photoURL: null};
    mockAuth.dataMode = 'live';
    renderSettings();
    expect(screen.getByText('Tags')).toBeInTheDocument();
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });

  it('signs out and stays on the app home path', async () => {
    mockAuth.currentUser = {displayName: 'Ada', email: 'ada@example.com', photoURL: null};
    mockAuth.dataMode = 'live';
    renderSettings();
    userEvent.click(screen.getByText('Sign Out'));
    expect(mockSignOut).toHaveBeenCalled();
  });
});
