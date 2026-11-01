/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {render, screen} from '@testing-library/react';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import BudgetPage from './Budget';
import expenseReducer, {expenseSlice} from '../../store/expenseSlice';
import {Budget} from '../../Types';

jest.mock('../../api/ExpenseAPI', () => ({
  ExpenseAPI: {addBudget: jest.fn(), updateBudget: jest.fn(), deleteBudget: jest.fn()},
}));

jest.mock('../../store/alertActions', () => ({
  createTimedAlert: jest.fn(),
}));

jest.mock('../../api/FinanceIndexDB', () => ({
  FinanceIndexDB: {addVendorTag: jest.fn()},
}));

const foodBudget = (): Budget => ({
  id: 'b1',
  name: 'Food',
  amount: 1000,
  tagList: ['food'],
  modifiedDate: 1,
});

const renderBudget = (budgets: Budget[]) => {
  const store = configureStore({reducer: {expense: expenseReducer}});
  store.dispatch(expenseSlice.actions.setExpenseState({
    expenseList: [],
    vendorTagList: [],
    darkMode: false,
  }));
  store.dispatch(expenseSlice.actions.setBudgetList(budgets));
  return render(
    <Provider store={store}>
      <BudgetPage/>
    </Provider>,
  );
};

describe('Budget page empty and zero-spent states', () => {
  it('renders budget cards with zero spent when there are no expenses', async () => {
    renderBudget([foodBudget()]);
    const card = await screen.findByTestId('budget-card');
    expect(card).toHaveTextContent('Food');
    expect(screen.getByTestId('spent-amount')).toHaveTextContent('Spent: ₹0');
  });

  it('shows an empty state when there are no budgets', async () => {
    renderBudget([]);
    expect(await screen.findByTestId('budget-empty')).toHaveTextContent('No budgets yet');
    expect(screen.queryByTestId('budget-card')).not.toBeInTheDocument();
  });
});
