/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {render, screen} from '@testing-library/react';
import {ExpenseAPI} from '../../../api/ExpenseAPI';
import userEvent from '@testing-library/user-event';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import TagExpenses from './TagExpenses';
import expenseReducer, {expenseSlice} from '../../../store/expenseSlice';
import {makeExpense} from '../../../testUtils';
import * as tagHelpers from '../../../domain/tags';

jest.mock('../../../api/ExpenseAPI', () => ({
  ExpenseAPI: {addExpense: jest.fn().mockResolvedValue({}), updateVendorTag: jest.fn()},
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
  beforeEach(() => {
    jest.mocked(ExpenseAPI.addExpense).mockClear();
  });

  it('renders nothing when the modal is closed', () => {
    render(
      <Provider store={makeTagStore(false)}>
        <TagExpenses/>
      </Provider>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('saves an untagged expense as empty tags', async () => {
    render(
      <Provider store={makeTagStore(true)}>
        <TagExpenses/>
      </Provider>,
    );
    await userEvent.click(await screen.findByRole('button', {name: /save/i}));
    expect(ExpenseAPI.addExpense).toHaveBeenCalled();
    const saved = jest.mocked(ExpenseAPI.addExpense).mock.calls[0][0];
    expect(saved.tags).toEqual([]);
    expect(saved.tag).toBeNull();
  });

  it('saves extras and a note while preserving unknown fields', async () => {
    const store = configureStore({reducer: {expense: expenseReducer}});
    store.dispatch(expenseSlice.actions.setTagList(['food', 'travel']));
    store.dispatch(expenseSlice.actions.setTagExpense(makeExpense({
      vendor: 'SHOP',
      tags: ['food', 'existing'],
      description: 'keep me',
      enrichedAt: 77,
    })));
    render(
      <Provider store={store}>
        <TagExpenses/>
      </Provider>,
    );
    const extraInput = await screen.findByPlaceholderText(/add extra tags/i);
    await userEvent.type(extraInput, 'zomato{Enter}');
    await userEvent.click(screen.getByRole('button', {name: /save/i}));
    expect(ExpenseAPI.addExpense).toHaveBeenCalled();
    const saved = jest.mocked(ExpenseAPI.addExpense).mock.calls[0][0];
    expect(saved.tags?.[0]).toBe('food');
    expect(saved.tags).toEqual(expect.arrayContaining(['existing', 'zomato']));
    expect(saved.tag).toBe('food');
    expect(saved.description).toBe('keep me');
    expect(saved.enrichedAt).toBe(77);
  });

  it('re-saves a retired primary that is not in legacyTagList with a new note', async () => {
    const store = configureStore({reducer: {expense: expenseReducer}});
    store.dispatch(expenseSlice.actions.setTagList(['food']));
    store.dispatch(expenseSlice.actions.setTagExpense(makeExpense({
      vendor: 'SHOP',
      tags: ['alcohol'],
      tag: 'alcohol',
    })));
    render(
      <Provider store={store}>
        <TagExpenses/>
      </Provider>,
    );
    await userEvent.click(screen.getByRole('button', {name: /add note/i}));
    await userEvent.type(screen.getByLabelText(/note/i), 'keep retired');
    await userEvent.click(screen.getByRole('button', {name: /save/i}));
    expect(ExpenseAPI.addExpense).toHaveBeenCalled();
    const saved = jest.mocked(ExpenseAPI.addExpense).mock.calls[0][0];
    expect(saved.tags?.[0]).toBe('alcohol');
    expect(saved.description).toBe('keep retired');
  });

  it('shows an error and does not save an invalid new primary', async () => {
    jest.spyOn(tagHelpers, 'isValidPrimary').mockReturnValue(false);
    render(
      <Provider store={makeTagStore(true)}>
        <TagExpenses/>
      </Provider>,
    );
    await userEvent.click(await screen.findByRole('button', {name: /select tag food/i}));
    await userEvent.click(screen.getByRole('button', {name: /save/i}));
    expect(await screen.findByText(/choose a tag from the list/i)).toBeInTheDocument();
    expect(ExpenseAPI.addExpense).not.toHaveBeenCalled();
    jest.restoreAllMocks();
  });

  it('untags and writes empty tags', async () => {
    const store = configureStore({reducer: {expense: expenseReducer}});
    store.dispatch(expenseSlice.actions.setTagList(['food']));
    store.dispatch(expenseSlice.actions.setTagExpense(makeExpense({
      vendor: 'SHOP',
      tags: ['food', 'zomato'],
    })));
    const confirm = jest.spyOn(window, 'confirm').mockReturnValue(true);
    render(
      <Provider store={store}>
        <TagExpenses/>
      </Provider>,
    );
    await userEvent.click(await screen.findByRole('button', {name: /select tag untagged/i}));
    await userEvent.click(screen.getByRole('button', {name: /save/i}));
    expect(confirm).toHaveBeenCalled();
    const saved = jest.mocked(ExpenseAPI.addExpense).mock.calls[0][0];
    expect(saved.tags).toEqual([]);
    expect(saved.tag).toBeNull();
    confirm.mockRestore();
  });
});
