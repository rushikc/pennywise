/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {act, cleanup, render, screen} from '@testing-library/react';
import {Provider} from 'react-redux';
import AlertComponent from './Alert';
import {expenseSlice} from '../store/expenseSlice';
import {store} from '../store/store';

const clearAlerts = () => {
  for (const alert of store.getState().expense.alerts) {
    store.dispatch(expenseSlice.actions.removeAlert(alert.id));
  }
};

describe('Alert', () => {
  afterEach(() => {
    cleanup();
    clearAlerts();
  });

  it('shows an error alert', async () => {
    await act(async () => {
      store.dispatch(expenseSlice.actions.addAlert({
        id: 'err-1',
        type: 'error',
        message: 'Save failed',
      }));
    });
    render(
      <Provider store={store}>
        <AlertComponent/>
      </Provider>,
    );
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Save failed');
    expect(alert.className).toContain('alert-error');
  });
});
