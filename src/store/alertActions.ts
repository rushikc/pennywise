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
