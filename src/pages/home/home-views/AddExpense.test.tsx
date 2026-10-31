/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {fireEvent, render, screen, waitFor} from '@testing-library/react';
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

  it('disables Save while pending so a double click adds one expense', async () => {
    let resolveSave: (value: unknown) => void = () => undefined;
    jest.mocked(ExpenseAPI.addExpense).mockClear();
    jest.mocked(ExpenseAPI.addExpense).mockImplementationOnce(
      () => new Promise((resolve) => { resolveSave = resolve; }) as never,
    );
    const store = configureStore({reducer: {expense: expenseReducer}});
    render(
      <Provider store={store}>
        <AddExpense open onClose={jest.fn()}/>
      </Provider>,
    );
    await userEvent.type(screen.getByLabelText(/cost/i), '12');
    const save = screen.getByTestId('add-expense-save');
    await userEvent.click(save);
    expect(save).toBeDisabled();
    fireEvent.click(save);
    expect(ExpenseAPI.addExpense).toHaveBeenCalledTimes(1);
    resolveSave({id: 'x', tags: []});
    await waitFor(() => expect(save).not.toBeDisabled());
  });

  it('does not call the API when offline', async () => {
    jest.mocked(ExpenseAPI.addExpense).mockClear();
    const online = jest.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(false);
    const store = configureStore({reducer: {expense: expenseReducer}});
    render(
      <Provider store={store}>
        <AddExpense open onClose={jest.fn()}/>
      </Provider>,
    );
    await userEvent.type(screen.getByLabelText(/cost/i), '12');
    await userEvent.click(screen.getByRole('button', {name: /save/i}));
    expect(ExpenseAPI.addExpense).not.toHaveBeenCalled();
    expect(createTimedAlert).toHaveBeenCalledWith({type: 'error', message: 'You\'re offline, the save needs a connection'});
    online.mockRestore();
  });
});

