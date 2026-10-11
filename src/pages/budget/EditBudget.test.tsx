/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import EditBudget from './EditBudget';
import expenseReducer, {expenseSlice} from '../../store/expenseSlice';

jest.mock('../../api/ExpenseAPI', () => ({
  ExpenseAPI: {addBudget: jest.fn(), updateBudget: jest.fn(), deleteBudget: jest.fn()},
}));

jest.mock('../../store/alertActions', () => ({
  createTimedAlert: jest.fn(),
}));

jest.mock('../../api/FinanceIndexDB', () => ({
  FinanceIndexDB: {addVendorTag: jest.fn()},
}));

const renderForm = () => {
  const store = configureStore({reducer: {expense: expenseReducer}});
  store.dispatch(expenseSlice.actions.setTagList(['food']));
  return render(
    <Provider store={store}>
      <EditBudget open budget={null} onClose={jest.fn()}/>
    </Provider>,
  );
};

describe('EditBudget', () => {
  it('keeps Create disabled until name, amount, and a tag are set', async () => {
    renderForm();
    const create = await screen.findByRole('button', {name: /create/i});
    expect(create).toBeDisabled();

    await userEvent.type(screen.getByLabelText(/budget name/i), 'Groceries');
    expect(create).toBeDisabled();

    await userEvent.type(screen.getByLabelText(/amount/i), '1000');
    expect(create).toBeDisabled();

    await userEvent.click(screen.getByText('food'));
    expect(create).toBeEnabled();
  });
});
