/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import MergeExpenses from './MergeExpenses';
import expenseReducer from '../../../store/expenseSlice';
import {makeExpense} from '../../../testUtils';
import {createTimedAlert} from '../../../store/alertActions';
import {ExpenseAPI} from '../../../api/ExpenseAPI';

jest.mock('../../../api/ExpenseAPI', () => ({
  ExpenseAPI: {addExpense: jest.fn()},
}));

jest.mock('../../../store/alertActions', () => ({
  __esModule: true,
  createTimedAlert: jest.fn(),
}));

jest.mock('../../../api/FinanceIndexDB', () => ({
  FinanceIndexDB: {addVendorTag: jest.fn()},
}));

const renderMerge = () => {
  const store = configureStore({
    reducer: {expense: expenseReducer},
    preloadedState: {
      expense: {
        ...configureStore({reducer: {expense: expenseReducer}}).getState().expense,
        tagList: ['food'],
      },
    },
  });
  return render(
    <Provider store={store}>
      <MergeExpenses
        open
        expenses={[
          makeExpense({
            id: 'a',
            vendor: 'SHOP',
            cost: 100,
            costType: 'debit',
            tags: ['food', 'zomato'],
            description: 'survivor note',
          }),
          makeExpense({
            id: 'b',
            vendor: 'OTHER',
            cost: 40,
            costType: 'credit',
            tags: ['rent', 'online food ordering'],
            description: 'other note',
          }),
        ]}
        onClose={jest.fn()}
      />
    </Provider>,
  );
};

describe('MergeExpenses', () => {
  it('alerts when merging without a vendor', async () => {
    renderMerge();
    await userEvent.click(screen.getByRole('button', {name: /merge/i}));
    expect(createTimedAlert).toHaveBeenCalledWith({
      type: 'error',
      message: 'Please select a vendor first',
    });
    expect(ExpenseAPI.addExpense).not.toHaveBeenCalled();
  });

  it('unions extras and keeps the survivor description', async () => {
    jest.mocked(ExpenseAPI.addExpense).mockResolvedValue(makeExpense());
    renderMerge();
    await userEvent.click(screen.getByRole('button', {name: /select vendor shop/i}));
    await userEvent.click(screen.getByRole('button', {name: /^merge$/i}));
    await waitFor(() => expect(ExpenseAPI.addExpense).toHaveBeenCalled());
    const merged = jest.mocked(ExpenseAPI.addExpense).mock.calls.find((call) => call[1] !== 'delete')?.[0];
    expect(merged?.tags?.[0]).toBe('food');
    expect(merged?.tags).toEqual(expect.arrayContaining(['zomato', 'online food ordering']));
    expect(merged?.description).toBe('survivor note');
  });
});
