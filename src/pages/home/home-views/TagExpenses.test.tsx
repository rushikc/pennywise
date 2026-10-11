/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import TagExpenses from './TagExpenses';
import expenseReducer, {expenseSlice} from '../../../store/expenseSlice';
import {makeExpense} from '../../../testUtils';

jest.mock('../../../api/ExpenseAPI', () => ({
  ExpenseAPI: {addExpense: jest.fn(), updateVendorTag: jest.fn()},
}));

jest.mock('../../../store/alertActions', () => ({
  createTimedAlert: jest.fn(),
}));

jest.mock('../../../api/FinanceIndexDB', () => ({
  FinanceIndexDB: {addVendorTag: jest.fn()},
}));

const makeTagStore = (open: boolean) => {
  const store = configureStore({reducer: {expense: expenseReducer}});
  store.dispatch(expenseSlice.actions.setTagList(['food', 'travel']));
  if (open) {
    store.dispatch(expenseSlice.actions.setTagExpense(makeExpense({vendor: 'SHOP'})));
  }
  return store;
};

describe('TagExpenses', () => {
  it('renders nothing when the modal is closed', () => {
    render(
      <Provider store={makeTagStore(false)}>
        <TagExpenses/>
      </Provider>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('disables Save until a tag is chosen', async () => {
    render(
      <Provider store={makeTagStore(true)}>
        <TagExpenses/>
      </Provider>,
    );
    const save = await screen.findByRole('button', {name: /save/i});
    expect(save).toBeDisabled();
    await userEvent.click(screen.getByRole('button', {name: /select tag food/i}));
    expect(save).toBeEnabled();
  });
});
