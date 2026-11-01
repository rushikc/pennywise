/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {act, screen} from '@testing-library/react';
import {ErrorHandlers} from './ErrorHandlers';

jest.mock('../pages/login/AuthService', () => ({
  AuthService: {signOut: jest.fn()},
}));

jest.mock('../pages/login/dataMode', () => ({
  getDataMode: () => 'demo',
}));

describe('ErrorHandlers', () => {
  afterEach(() => {
    document.getElementById('error-modal-root')?.remove();
  });

  it('renders the access denied modal', async () => {
    await act(async () => {
      ErrorHandlers.showAccessDeniedModal();
    });
    expect(await screen.findByRole('heading', {name: 'Access Denied'})).toBeInTheDocument();
  });
});
