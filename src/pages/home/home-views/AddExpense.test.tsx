/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import AddExpense from './AddExpense';
import expenseReducer from '../../../store/expenseSlice';
import {ExpenseAPI} from '../../../api/ExpenseAPI';
import {createTimedAlert} from '../../../store/alertActions';

jest.mock('../../../api/ExpenseAPI', () => ({
  ExpenseAPI: {addExpense: jest.fn()},
}));

jest.mock('../../../store/alertActions', () => ({
  createTimedAlert: jest.fn(),
}));

jest.mock('../../../api/FinanceIndexDB', () => ({
  FinanceIndexDB: {addVendorTag: jest.fn()},
}));

describe('AddExpense', () => {
  it('alerts and keeps the dialog open when save fails', async () => {
    const onClose = jest.fn();
    jest.mocked(ExpenseAPI.addExpense).mockRejectedValueOnce(new Error('offline'));
    const store = configureStore({reducer: {expense: expenseReducer}});
    render(
      <Provider store={store}>
        <AddExpense open onClose={onClose}/>
      </Provider>,
    );
    await userEvent.type(screen.getByLabelText(/cost/i), '12');
    await userEvent.click(screen.getByRole('button', {name: /save/i}));
    await waitFor(() => expect(createTimedAlert).toHaveBeenCalledWith({
      type: 'error',
      message: 'Could not save this expense',
    }));
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
