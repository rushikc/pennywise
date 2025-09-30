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

export interface Expense {
  id: string,
  tag: string, // tag for the expense
  mailId: string, // unique identifier for the expense from mail id
  cost: number, // expense cost
  costType: 'credit' | 'debit',
  // unix timestamp
  // ex => 1752566845000, unix timestamp
  // to get JS Date object, new Date(1752566845000)
  date: number,
  modifiedDate: number,
  // date: Date,
  user: string, // user who created the expense
  type: string, // payment medium - upi, credit, e-mandate, cash, etc.
  vendor: string, // vendor name for the expense
  operation: string, // add, update, delete
}

export interface VendorTag {
  id: string,
  vendor: string,
  tag: string,
  date: number // unix timestamp
}


export type TagList = string[];

export interface Alert {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

export interface BankConfig {
  enableUpi: boolean;
  creditCards: string[];
}


// used to store the configuration for the app in IndexedDB
export interface Config {
  key: string,
  value: string | number
}

export interface AppConfig {
  darkMode: boolean;
}
