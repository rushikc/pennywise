/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {ExpenseAPI} from '../../../api/ExpenseAPI';
import userEvent from '@testing-library/user-event';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import TagExpenses from './TagExpenses';
import expenseReducer, {expenseSlice} from '../../../store/expenseSlice';
import {makeExpense} from '../../../testUtils';
import {createTimedAlert} from '../../../store/alertActions';
jest.mock('../../../api/ExpenseAPI', () => ({
  ExpenseAPI: {updateExpense: jest.fn().mockResolvedValue({}), updateVendorTag: jest.fn().mockResolvedValue(true)},
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
    jest.mocked(ExpenseAPI.updateExpense).mockReset();
    jest.mocked(ExpenseAPI.updateExpense).mockResolvedValue({} as never);
    jest.mocked(createTimedAlert).mockClear();
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

  it('omits primary when an untagged expense is saved with only a note', async () => {
    render(
      <Provider store={makeTagStore(true)}>
        <TagExpenses/>
      </Provider>,
    );
    await userEvent.click(await screen.findByRole('button', {name: /add note/i}));
    await userEvent.type(screen.getByLabelText(/note/i), 'just a note');
    await userEvent.click(screen.getByRole('button', {name: /save/i}));
    expect(ExpenseAPI.updateExpense).toHaveBeenCalled();
    const edit = jest.mocked(ExpenseAPI.updateExpense).mock.calls[0][1];
    expect(edit.primary).toBeUndefined();
    expect(edit.addExtras).toBeUndefined();
    expect(edit.removeExtras).toBeUndefined();
    expect(edit.description).toBe('just a note');
  });

  it('does not write primary when staying untagged', async () => {
    render(
      <Provider store={makeTagStore(true)}>
        <TagExpenses/>
      </Provider>,
    );
    await userEvent.click(await screen.findByRole('button', {name: /save/i}));
    expect(ExpenseAPI.updateExpense).not.toHaveBeenCalled();
    expect(createTimedAlert).not.toHaveBeenCalled();
  });

  it('alerts and keeps the dialog open when save fails', async () => {
    jest.mocked(ExpenseAPI.updateExpense).mockRejectedValueOnce(new Error('offline'));
    render(
      <Provider store={makeTagStore(true)}>
        <TagExpenses/>
      </Provider>,
    );
    await userEvent.click(await screen.findByRole('button', {name: /add note/i}));
    await userEvent.type(screen.getByLabelText(/note/i), 'n');
    await userEvent.click(screen.getByRole('button', {name: /save/i}));
    await waitFor(() => expect(createTimedAlert).toHaveBeenCalledWith({
      type: 'error',
      message: 'Could not save this expense',
    }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
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
    // Nothing changed, so the save is a no-op that closes the dialog.
    expect(ExpenseAPI.updateExpense).not.toHaveBeenCalled();
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

  const openWith = (tags: string[], extra: Partial<Parameters<typeof makeExpense>[0]> = {}) => {
    const store = configureStore({reducer: {expense: expenseReducer}});
    store.dispatch(expenseSlice.actions.setTagList(['food', 'travel']));
    store.dispatch(expenseSlice.actions.setTagExpense(makeExpense({vendor: 'SHOP', tags, ...extra})));
    render(
      <Provider store={store}>
        <TagExpenses/>
      </Provider>,
    );
    return store;
  };

  it('does not write the vendor tag when the expense save fails', async () => {
    jest.mocked(ExpenseAPI.updateVendorTag).mockClear();
    jest.mocked(ExpenseAPI.updateExpense).mockRejectedValueOnce(new Error('offline'));
    openWith([]);
    await userEvent.click(await screen.findByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', {name: /select tag food/i}));
    await userEvent.click(screen.getByRole('button', {name: /save/i}));
    await waitFor(() => expect(createTimedAlert).toHaveBeenCalledWith({
      type: 'error',
      message: 'Could not save this expense',
    }));
    expect(ExpenseAPI.updateVendorTag).not.toHaveBeenCalled();
  });

  it('writes the vendor tag after a successful save', async () => {
    jest.mocked(ExpenseAPI.updateVendorTag).mockClear();
    jest.mocked(ExpenseAPI.updateExpense).mockResolvedValueOnce(makeExpense({vendor: 'SHOP', tags: ['food']}) as never);
    openWith([]);
    await userEvent.click(await screen.findByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', {name: /select tag food/i}));
    await userEvent.click(screen.getByRole('button', {name: /save/i}));
    await waitFor(() => expect(ExpenseAPI.updateVendorTag).toHaveBeenCalled());
    const order = jest.mocked(ExpenseAPI.updateExpense).mock.invocationCallOrder[0];
    expect(order).toBeLessThan(jest.mocked(ExpenseAPI.updateVendorTag).mock.invocationCallOrder[0]);
    expect(jest.mocked(ExpenseAPI.updateVendorTag).mock.calls[0][0]).toMatchObject({vendor: 'SHOP', tag: 'food'});
  });

  it('disables Save while the save is pending and ignores a second click', async () => {
    let resolveSave: (value: unknown) => void = () => undefined;
    jest.mocked(ExpenseAPI.updateExpense).mockImplementationOnce(
      () => new Promise((resolve) => { resolveSave = resolve; }) as never,
    );
    openWith([]);
    await userEvent.click(await screen.findByRole('button', {name: /select tag food/i}));
    const save = screen.getByTestId('tag-save');
    await userEvent.click(save);
    expect(save).toBeDisabled();
    fireEvent.click(save);
    expect(ExpenseAPI.updateExpense).toHaveBeenCalledTimes(1);
    resolveSave(makeExpense({tags: ['food']}));
    await waitFor(() => expect(save).not.toBeDisabled());
    expect(ExpenseAPI.updateExpense).toHaveBeenCalledTimes(1);
  });

  it('skips the API on an empty edit and closes', async () => {
    openWith(['food', 'zomato'], {description: 'kept'});
    await userEvent.click(await screen.findByRole('button', {name: /save/i}));
    expect(ExpenseAPI.updateExpense).not.toHaveBeenCalled();
    expect(createTimedAlert).not.toHaveBeenCalled();
  });

  it('does not call the API when offline', async () => {
    const online = jest.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(false);
    openWith([]);
    await userEvent.click(await screen.findByRole('button', {name: /select tag food/i}));
    await userEvent.click(screen.getByRole('button', {name: /save/i}));
    expect(createTimedAlert).toHaveBeenCalledWith({
      type: 'error',
      message: 'You\'re offline, the save needs a connection',
    });
    expect(ExpenseAPI.updateExpense).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    online.mockRestore();
  });
});

