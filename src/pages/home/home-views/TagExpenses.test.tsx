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
jest.mock('../../../api/ExpenseAPI', () => ({
  ExpenseAPI: {updateExpense: jest.fn().mockResolvedValue({}), updateVendorTag: jest.fn()},
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
    jest.mocked(ExpenseAPI.updateExpense).mockClear();
  });

  it('renders nothing when the modal is closed', () => {
    render(
      <Provider store={makeTagStore(false)}>
        <TagExpenses/>
      </Provider>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('marks the matching primary chip selected regardless of case', async () => {
    const store = configureStore({reducer: {expense: expenseReducer}});
    store.dispatch(expenseSlice.actions.setTagList(['food']));
    store.dispatch(expenseSlice.actions.setTagExpense(makeExpense({
      vendor: 'SHOP',
      tags: ['FOOD'],
    })));
    render(
      <Provider store={store}>
        <TagExpenses/>
      </Provider>,
    );
    expect(await screen.findByRole('button', {name: /select tag food/i})).toHaveClass('MuiChip-colorPrimary');
  });

  it('saves an untagged expense as empty tags', async () => {
    render(
      <Provider store={makeTagStore(true)}>
        <TagExpenses/>
      </Provider>,
    );
    await userEvent.click(await screen.findByRole('button', {name: /save/i}));
    expect(ExpenseAPI.updateExpense).toHaveBeenCalled();
    const edit = jest.mocked(ExpenseAPI.updateExpense).mock.calls[0][1];
    expect(edit.primary).toBeNull();
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
    expect(ExpenseAPI.updateExpense).toHaveBeenCalled();
    const edit = jest.mocked(ExpenseAPI.updateExpense).mock.calls[0][1];
    expect(edit.addExtras).toEqual(['zomato']);
    expect(edit.primary).toBeUndefined();
    expect(edit.description).toBeUndefined();
  });

  it('labels a legacy primary as retired', async () => {
    const store = configureStore({reducer: {expense: expenseReducer}});
    store.dispatch(expenseSlice.actions.setTagList(['food']));
    store.dispatch(expenseSlice.actions.setLegacyTagList(['alcohol']));
    store.dispatch(expenseSlice.actions.setTagExpense(makeExpense({
      vendor: 'SHOP',
      tags: ['alcohol'],
    })));
    render(
      <Provider store={store}>
        <TagExpenses/>
      </Provider>,
    );
    expect(await screen.findByRole('button', {name: /select tag alcohol \(retired\)/i})).toBeInTheDocument();
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
    expect(ExpenseAPI.updateExpense).toHaveBeenCalled();
    const edit = jest.mocked(ExpenseAPI.updateExpense).mock.calls[0][1];
    expect(edit.primary).toBeUndefined();
    expect(edit.description).toBe('keep retired');
  });

  it('saves an unlisted primary without error', async () => {
    const store = configureStore({reducer: {expense: expenseReducer}});
    store.dispatch(expenseSlice.actions.setTagList(['food']));
    store.dispatch(expenseSlice.actions.setTagExpense(makeExpense({
      vendor: 'SHOP',
      tags: ['mystery'],
    })));
    render(
      <Provider store={store}>
        <TagExpenses/>
      </Provider>,
    );
    expect(await screen.findByRole('button', {name: /select tag mystery \(not in list\)/i})).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', {name: /save/i}));
    expect(screen.queryByText(/choose a tag from the list/i)).not.toBeInTheDocument();
    const edit = jest.mocked(ExpenseAPI.updateExpense).mock.calls[0][1];
    expect(edit.primary).toBeUndefined();
  });

  it('canonicalises a picked list tag to the list spelling', async () => {
    const store = configureStore({reducer: {expense: expenseReducer}});
    store.dispatch(expenseSlice.actions.setTagList(['food']));
    store.dispatch(expenseSlice.actions.setTagExpense(makeExpense({
      vendor: 'SHOP',
      tags: ['mystery'],
    })));
    render(
      <Provider store={store}>
        <TagExpenses/>
      </Provider>,
    );
    await userEvent.click(await screen.findByRole('button', {name: /select tag food/i}));
    await userEvent.click(screen.getByRole('button', {name: /save/i}));
    const edit = jest.mocked(ExpenseAPI.updateExpense).mock.calls[0][1];
    expect(edit.primary).toBe('food');
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
    const edit = jest.mocked(ExpenseAPI.updateExpense).mock.calls[0][1];
    expect(edit.primary).toBeNull();
    expect(edit.removeExtras).toEqual(['zomato']);
    confirm.mockRestore();
  });
});
