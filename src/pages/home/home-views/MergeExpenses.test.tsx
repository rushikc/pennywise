/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {render, screen} from '@testing-library/react';
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
          makeExpense({id: 'a', vendor: 'SHOP', cost: 100, costType: 'debit'}),
          makeExpense({id: 'b', vendor: 'OTHER', cost: 40, costType: 'credit'}),
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
});
