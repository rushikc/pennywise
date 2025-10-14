/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {Alert} from '../Types';
import {expenseSlice} from './expenseSlice';
import {store} from './store';

/**
 * Creates an alert that automatically removes itself after a specified timeout
 * @param alert - Alert object without id (id will be generated automatically)
 * @param timeout - Timeout in milliseconds (default: 3000ms)
 */
export const createTimedAlert = (
  alert: Omit<Alert, 'id'>,
  timeout = 3000
) => {
  // Generate the id here so we can use it for removal
  const alertId = crypto.randomUUID();
  const alertWithId: Alert = {id: alertId, ...alert};

  // Dispatch the alert with id
  store.dispatch(expenseSlice.actions.addAlert(alertWithId));

  // Set timeout to remove the alert
  setTimeout(() => {
    store.dispatch(expenseSlice.actions.removeAlert(alertId));
  }, timeout);

  return alertId;
};

export const removeAlert = (alertId: string) => {
  store.dispatch(expenseSlice.actions.removeAlert(alertId));
};
