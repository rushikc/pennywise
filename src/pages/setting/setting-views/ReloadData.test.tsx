/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import ReloadData from './ReloadData';

jest.mock('../../../api/ExpenseAPI', () => ({
  ExpenseAPI: {
    getExpenseList: jest.fn(),
  },
}));

jest.mock('../../../api/FinanceIndexDB', () => ({
  FinanceIndexDB: {
    clearIndexedDBData: jest.fn(),
  },
}));

jest.mock('../../dataValidations', () => ({
  loadInitialAppData: jest.fn(),
}));

jest.mock('../../../store/alertActions', () => ({
  createTimedAlert: jest.fn(),
}));

const renderPage = () => render(
  <MemoryRouter>
    <ReloadData/>
  </MemoryRouter>,
);

describe('ReloadData copy', () => {
  it('shows Firebase and IndexedDB warnings', () => {
    renderPage();
    expect(screen.getByText(/Cloud Reads/)).toBeInTheDocument();
    expect(screen.getByText(/locally cached data/)).toBeInTheDocument();
    expect(screen.getByText('Clear Local Cache (IndexedDB)')).toBeInTheDocument();
  });
});
