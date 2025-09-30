/*
Copyright (C) 2025 <rushikc> <rushikc.dev@gmail.com>

This program is free software; you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the
Free Software Foundation; version 3 of the License.

This program is distributed in the hope that it will be useful, but
WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details, or get a copy at
<https://www.gnu.org/licenses/gpl-3.0.txt>.
*/

import {expenseSlice} from './expenseSlice';
import {RootState, store} from './store';
import {Budget, Expense, VendorTag} from '../Types';


export const selectExpense = (state: RootState) => state.expense;

export const setExpenseList = (expenses: Expense[]) => store.dispatch(expenseSlice.actions.setExpenseList(expenses));
export const setTagExpense = (expense: Expense) => store.dispatch(expenseSlice.actions.setTagExpense(expense));
export const setTagMap = (tag: VendorTag) => store.dispatch(expenseSlice.actions.setTagMap(tag));
export const updateExpense = (expense: Expense) => store.dispatch(expenseSlice.actions.updateExpense(expense));
export const hideTagExpense = () => store.dispatch(expenseSlice.actions.hideTagExpense());
export const setExpenseState = (expenseList: Expense[], vendorTagList: VendorTag[], darkMode: boolean) => store.dispatch(expenseSlice.actions.setExpenseState({
  expenseList,
  vendorTagList,
  darkMode
}));

export const setTagList = (tags: string[]) => store.dispatch(expenseSlice.actions.setTagList(tags));
export const addTag = (tag: string) => store.dispatch(expenseSlice.actions.addTag(tag));
export const deleteTag = (tag: string) => store.dispatch(expenseSlice.actions.deleteTag(tag));
export const mergeSaveExpense = (originalExpenses: Expense[], mergedExpense: Expense) =>
  store.dispatch(expenseSlice.actions.mergeSaveExpense({originalExpenses, mergedExpense}));
export const deleteExpense = (expense: Expense) => store.dispatch(expenseSlice.actions.deleteExpense(expense));
export const toggleDarkMode = () => store.dispatch(expenseSlice.actions.toggleDarkMode());

// Budget actions following the same pattern
export const setBudgetList = (budgets: Budget[]) => store.dispatch(expenseSlice.actions.setBudgetList(budgets));
export const addBudget = (budget: Budget) => store.dispatch(expenseSlice.actions.addBudget(budget));
export const updateBudget = (budget: Budget) => store.dispatch(expenseSlice.actions.updateBudget(budget));
export const deleteBudget = (budgetId: string) => store.dispatch(expenseSlice.actions.deleteBudget(budgetId));
