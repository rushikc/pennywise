/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter} from 'react-router-dom';
import DuplicateReview from './DuplicateReview';
import {makeExpense} from '../../testUtils';
import {ExpenseAPI} from '../../api/ExpenseAPI';

jest.mock('../../api/ExpenseAPI', () => ({
  ExpenseAPI: {
    getExpenseList: jest.fn(),
    getDuplicateCandidates: jest.fn(),
    resolveDuplicate: jest.fn(),
  },
}));

jest.mock('../../store/expenseActions', () => ({
  setExpenseList: jest.fn(),
}));

jest.mock('../../store/alertActions', () => ({
  createTimedAlert: jest.fn(),
}));

const mockedApi = ExpenseAPI as jest.Mocked<typeof ExpenseAPI>;

const pair = {
  rule: 'review:sameCostNearTime',
  keep: makeExpense({id: 'keep', vendor: 'KEEP SHOP'}),
  drop: makeExpense({id: 'drop', vendor: 'DROP SHOP'}),
};

const renderPage = () => render(
  <MemoryRouter>
    <DuplicateReview/>
  </MemoryRouter>,
);

describe('DuplicateReview', () => {
  beforeEach(() => {
    mockedApi.getExpenseList.mockResolvedValue([]);
    mockedApi.getDuplicateCandidates.mockResolvedValue([]);
    mockedApi.resolveDuplicate.mockResolvedValue(pair.drop);
  });

  it('shows an empty state after loading', async () => {
    renderPage();
    expect(document.querySelector('.MuiCircularProgress-root')).toBeTruthy();
    expect(await screen.findByText('No pending duplicates to review.')).toBeInTheDocument();
  });

  it('confirms a pair and removes the card', async () => {
    mockedApi.getDuplicateCandidates.mockResolvedValue([pair]);
    renderPage();
    const confirm = await screen.findByRole('button', {name: /confirm duplicate/i});
    await userEvent.click(confirm);
    await waitFor(() => {
      expect(screen.queryByText('KEEP SHOP'.toLowerCase())).not.toBeInTheDocument();
    });
    expect(mockedApi.resolveDuplicate).toHaveBeenCalledWith(pair.keep, pair.drop, 'confirmed');
  });

  it('rejects a pair', async () => {
    mockedApi.getDuplicateCandidates.mockResolvedValue([pair]);
    renderPage();
    await userEvent.click(await screen.findByRole('button', {name: /not a duplicate/i}));
    await waitFor(() => {
      expect(mockedApi.resolveDuplicate).toHaveBeenCalledWith(pair.keep, pair.drop, 'rejected');
    });
  });

  it('disables buttons while resolving', async () => {
    mockedApi.getDuplicateCandidates.mockResolvedValue([pair]);
    let finish: (value: typeof pair.drop) => void = () => undefined;
    mockedApi.resolveDuplicate.mockImplementation(
      () => new Promise((resolve) => {
        finish = resolve;
      }),
    );
    renderPage();
    const confirm = await screen.findByRole('button', {name: /confirm duplicate/i});
    await userEvent.click(confirm);
    expect(confirm).toBeDisabled();
    expect(screen.getByRole('button', {name: /not a duplicate/i})).toBeDisabled();
    finish(pair.drop);
    await waitFor(() => {
      expect(screen.queryByRole('button', {name: /confirm duplicate/i})).not.toBeInTheDocument();
    });
  });
});
