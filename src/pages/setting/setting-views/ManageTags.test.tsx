/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter} from 'react-router-dom';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import ManageTags from './ManageTags';
import expenseReducer from '../../../store/expenseSlice';
import {ExpenseAPI} from '../../../api/ExpenseAPI';

jest.mock('../../../api/ExpenseAPI', () => ({
  ExpenseAPI: {
    getTagConfig: jest.fn().mockResolvedValue({tagList: ['food', 'rent'], legacyTagList: ['tech']}),
    updateTagConfig: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../../api/FinanceIndexDB', () => ({
  FinanceIndexDB: {addVendorTag: jest.fn()},
}));

const renderManageTags = () => {
  const store = configureStore({
    reducer: {expense: expenseReducer},
    preloadedState: {
      expense: {
        ...configureStore({reducer: {expense: expenseReducer}}).getState().expense,
        tagList: ['food', 'rent'],
        legacyTagList: ['tech'],
      },
    },
  });
  return {
    store,
    ...render(
      <Provider store={store}>
        <MemoryRouter>
          <ManageTags/>
        </MemoryRouter>
      </Provider>,
    ),
  };
};

describe('ManageTags', () => {
  it('writes the stored tagList spelling into legacyTagList', async () => {
    (ExpenseAPI.getTagConfig as jest.Mock).mockResolvedValueOnce({
      tagList: ['Food', 'rent'],
      legacyTagList: [],
    });
    const store = configureStore({
      reducer: {expense: expenseReducer},
      preloadedState: {
        expense: {
          ...configureStore({reducer: {expense: expenseReducer}}).getState().expense,
          tagList: ['Food', 'rent'],
          legacyTagList: [],
        },
      },
    });
    render(
      <Provider store={store}>
        <MemoryRouter>
          <ManageTags/>
        </MemoryRouter>
      </Provider>,
    );
    await userEvent.click(screen.getAllByTestId('CancelIcon')[0]);
    await userEvent.click(screen.getByRole('button', {name: /^delete$/i}));
    expect(store.getState().expense.legacyTagList).toEqual(['Food']);
    expect(ExpenseAPI.updateTagConfig).toHaveBeenCalledWith({
      tagList: ['rent'],
      legacyTagList: ['Food'],
    });
  });

  it('retires a deleted tag to legacyTagList', async () => {
    const {store} = renderManageTags();
    await userEvent.click(screen.getAllByTestId('CancelIcon')[0]);
    await userEvent.click(screen.getByRole('button', {name: /^delete$/i}));
    expect(store.getState().expense.tagList).toEqual(['rent']);
    expect(store.getState().expense.legacyTagList).toEqual(['tech', 'food']);
    expect(ExpenseAPI.updateTagConfig).toHaveBeenCalledWith({
      tagList: ['rent'],
      legacyTagList: ['tech', 'food'],
    });
  });

  it('restores a retired tag back to tagList', async () => {
    const {store} = renderManageTags();
    await userEvent.click(screen.getByRole('button', {name: /retired tags/i}));
    await userEvent.click(screen.getByRole('button', {name: /restore tag tech/i}));
    expect(store.getState().expense.tagList).toEqual(['food', 'rent', 'tech']);
    expect(store.getState().expense.legacyTagList).toEqual([]);
  });
});
