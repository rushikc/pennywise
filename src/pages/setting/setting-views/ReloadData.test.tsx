/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter} from 'react-router-dom';
import {ExpenseAPI} from '../../../api/ExpenseAPI';
import {store} from '../../../store/store';
import {getUnixTimestamp} from '../../../utility/utility';
import {setDataMode} from '../../login/dataMode';
import ReloadData from './ReloadData';

jest.mock('../../../api/ExpenseAPI', () => ({
  ExpenseAPI: {
    processData: jest.fn(),
    resetSyncWatermarksIfNeeded: jest.fn().mockResolvedValue(undefined),
    getExpenseList: jest.fn().mockResolvedValue([]),
    getVendorTagList: jest.fn().mockResolvedValue([]),
    getBudgetList: jest.fn().mockResolvedValue([]),
    getTagConfig: jest.fn().mockResolvedValue({tagList: [], legacyTagList: []}),
    getDarkModeConfig: jest.fn().mockResolvedValue(false),
  },
}));

jest.mock('../../../api/FinanceIndexDB', () => ({
  FinanceIndexDB: {
    clearIndexedDBData: jest.fn(),
  },
}));

jest.mock('../../../store/alertActions', () => ({
  createTimedAlert: jest.fn(),
}));

const renderPage = () => render(
  <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
    <ReloadData/>
  </MemoryRouter>,
);

describe('ReloadData copy', () => {
  it('shows Firebase and IndexedDB warnings', () => {
    renderPage();
    expect(screen.getByText(/Cloud Reads/)).toBeInTheDocument();
    expect(screen.getByText(/locally cached data/)).toBeInTheDocument();
    expect(screen.getByText('Clear Local Cache (IndexedDB)')).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Reload all data'})).toBeInTheDocument();
  });
});

describe('Reload all data', () => {
  it('refetches expenses, vendor tags, and budgets from 2020 and dispatches them', async () => {
    setDataMode('live');
    const from2020 = getUnixTimestamp('2020-01-01');
    renderPage();
    await userEvent.click(screen.getByRole('button', {name: 'Reload all data'}));

    await waitFor(() => {
      expect(ExpenseAPI.getExpenseList).toHaveBeenCalledWith(from2020);
      expect(ExpenseAPI.getVendorTagList).toHaveBeenCalledWith(from2020);
      expect(ExpenseAPI.getBudgetList).toHaveBeenCalledWith(from2020);
    });
    expect(store.getState().expense.budgetList).toEqual([]);
    expect(store.getState().expense.isAppLoading).toBe(false);
  });
});
