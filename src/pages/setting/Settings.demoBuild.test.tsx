/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

jest.mock('../../utility/buildMode', () => ({
  IS_DEMO_BUILD: true,
}));

jest.mock('../login/AuthContext', () => ({
  __esModule: true,
  useAuth: () => ({
    currentUser: null,
    dataMode: 'demo',
    signOut: jest.fn(),
  }),
}));

jest.mock('../../api/ExpenseAPI', () => ({
  __esModule: true,
  ExpenseAPI: {
    getDuplicateCandidates: () => Promise.resolve([]),
    updateDarkMode: () => Promise.resolve(true),
  },
}));

import {render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {Provider} from 'react-redux';
import Settings from './Settings';
import {store} from '../../store/store';

describe('Settings demo build', () => {
  it('hides sign-out and shows the reset note', () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <Settings/>
        </MemoryRouter>
      </Provider>,
    );
    expect(screen.getByText('Demo build: data resets on reload')).toBeInTheDocument();
    expect(screen.queryByText('Sign Out')).not.toBeInTheDocument();
    expect(screen.getByText('Tags')).toBeInTheDocument();
  });
});
