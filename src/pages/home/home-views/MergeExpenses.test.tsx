/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import MergeExpenses from './MergeExpenses';
import expenseReducer from '../../../store/expenseSlice';
import {makeExpense} from '../../../testUtils';
import {createTimedAlert} from '../../../store/alertActions';
import {ExpenseAPI} from '../../../api/ExpenseAPI';

jest.mock('../../../api/ExpenseAPI', () => ({
  ExpenseAPI: {updateExpense: jest.fn()},
}));

jest.mock('../../../store/alertActions', () => ({
  __esModule: true,
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
          makeExpense({
            id: 'a',
            vendor: 'SHOP',
            cost: 100,
            costType: 'debit',
            tags: ['food', 'zomato'],
            description: 'survivor note',
          }),
          makeExpense({
            id: 'b',
            vendor: 'OTHER',
            cost: 40,
            costType: 'credit',
            tags: ['rent', 'online food ordering'],
            description: 'other note',
          }),
        ]}
        onClose={jest.fn()}
      />
    </Provider>,
  );
};

describe('MergeExpenses', () => {
  beforeEach(() => {
    jest.mocked(ExpenseAPI.updateExpense).mockReset();
    jest.mocked(ExpenseAPI.updateExpense).mockResolvedValue(makeExpense({id: 'a'}) as never);
    jest.mocked(createTimedAlert).mockClear();
  });

  it('alerts when merging without a vendor', async () => {
    renderMerge();
    await userEvent.click(screen.getByRole('button', {name: /merge/i}));
    expect(createTimedAlert).toHaveBeenCalledWith({
      type: 'error',
      message: 'Please select a vendor first',
    });
    expect(ExpenseAPI.updateExpense).not.toHaveBeenCalled();
  });

  it('disables merge when extras exist and there is no primary', async () => {
    const store = configureStore({
      reducer: {expense: expenseReducer},
      preloadedState: {
        expense: {
          ...configureStore({reducer: {expense: expenseReducer}}).getState().expense,
          tagList: ['food'],
        },
      },
    });
    render(
      <Provider store={store}>
        <MergeExpenses
          open
          expenses={[
            makeExpense({id: 'a', vendor: 'SHOP', tags: []}),
            makeExpense({id: 'b', vendor: 'OTHER', tags: ['food', 'zomato']}),
          ]}
          onClose={jest.fn()}
        />
      </Provider>,
    );
    await userEvent.click(screen.getByRole('button', {name: /select vendor shop/i}));
    await userEvent.click(screen.getByRole('button', {name: /select tag untagged/i}));
    expect(screen.getByText(/choose a primary tag to keep extra tags/i)).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /^merge$/i})).toBeDisabled();
  });

  it('unions extras and keeps the survivor description', async () => {
    jest.mocked(ExpenseAPI.updateExpense).mockResolvedValue(makeExpense({id: 'a'}));
    renderMerge();
    await userEvent.click(screen.getByRole('button', {name: /select vendor shop/i}));
    await userEvent.click(screen.getByRole('button', {name: /^merge$/i}));
    await waitFor(() => expect(ExpenseAPI.updateExpense).toHaveBeenCalled());
    const calls = jest.mocked(ExpenseAPI.updateExpense).mock.calls;
    expect(calls[0][0]).toBe('a');
    expect(calls[1]).toEqual(['b', {operation: 'delete'}]);
    const keepEdit = calls[0][1];
    expect(keepEdit?.primary).toBe('food');
    expect(keepEdit?.addExtras).toEqual(expect.arrayContaining(['online food ordering']));
    expect(keepEdit?.description).toBe('survivor note');
  });

  it('does not select Untagged when a merged expense already has a primary', () => {
    renderMerge();
    expect(screen.getByRole('button', {name: /select tag food/i})).toHaveClass('MuiChip-colorPrimary');
    expect(screen.getByRole('button', {name: /select tag untagged/i})).not.toHaveClass('MuiChip-colorPrimary');
  });

  it('writes a null primary when Untagged is chosen', async () => {
    jest.mocked(ExpenseAPI.updateExpense).mockResolvedValue(makeExpense({id: 'a'}));
    const store = configureStore({
      reducer: {expense: expenseReducer},
      preloadedState: {
        expense: {
          ...configureStore({reducer: {expense: expenseReducer}}).getState().expense,
          tagList: ['food'],
        },
      },
    });
    render(
      <Provider store={store}>
        <MergeExpenses
          open
          expenses={[
            makeExpense({id: 'a', vendor: 'SHOP', tags: ['food']}),
            makeExpense({id: 'b', vendor: 'OTHER', tags: ['rent']}),
          ]}
          onClose={jest.fn()}
        />
      </Provider>,
    );
    await userEvent.click(screen.getByRole('button', {name: /select vendor shop/i}));
    const untagged = screen.getByRole('button', {name: /select tag untagged/i});
    await userEvent.click(untagged);
    expect(untagged).toHaveClass('MuiChip-colorPrimary');
    await userEvent.click(screen.getByRole('button', {name: /^merge$/i}));
    await waitFor(() => expect(ExpenseAPI.updateExpense).toHaveBeenCalled());
    expect(jest.mocked(ExpenseAPI.updateExpense).mock.calls[0][1]?.primary).toBeNull();
  });

  it('does not delete others when the keep update fails', async () => {
    jest.mocked(ExpenseAPI.updateExpense).mockRejectedValueOnce(new Error('offline'));
    const onMergeComplete = jest.fn();
    const store = configureStore({
      reducer: {expense: expenseReducer},
      preloadedState: {
        expense: {
          ...configureStore({reducer: {expense: expenseReducer}}).getState().expense,
          tagList: ['food'],
        },
      },
    });
    render(
      <Provider store={store}>
        <MergeExpenses
          open
          expenses={[
            makeExpense({id: 'a', vendor: 'SHOP', tags: ['food']}),
            makeExpense({id: 'b', vendor: 'OTHER', tags: ['rent']}),
          ]}
          onClose={jest.fn()}
          onMergeComplete={onMergeComplete}
        />
      </Provider>,
    );
    await userEvent.click(screen.getByRole('button', {name: /select vendor shop/i}));
    await userEvent.click(screen.getByRole('button', {name: /^merge$/i}));
    await waitFor(() => expect(createTimedAlert).toHaveBeenCalledWith({
      type: 'error',
      message: 'Could not save the merged expense',
    }));
    expect(ExpenseAPI.updateExpense).toHaveBeenCalledTimes(1);
    expect(onMergeComplete).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
