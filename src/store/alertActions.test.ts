/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {createTimedAlert} from './alertActions';
import {expenseSlice} from './expenseSlice';
import {store} from './store';

const clearAlerts = () => {
  for (const alert of store.getState().expense.alerts) {
    store.dispatch(expenseSlice.actions.removeAlert(alert.id));
  }
};

describe('createTimedAlert', () => {
  afterEach(() => {
    vi.useRealTimers();
    clearAlerts();
  });

  it('shows an error alert and removes it when the timer fires', () => {
    vi.useFakeTimers();
    const id = createTimedAlert({type: 'error', message: 'Save failed'});
    expect(store.getState().expense.alerts).toEqual([
      expect.objectContaining({id, type: 'error', message: 'Save failed'}),
    ]);
    vi.advanceTimersByTime(3000);
    expect(store.getState().expense.alerts).toEqual([]);
  });
});
