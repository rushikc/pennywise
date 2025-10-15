/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

export interface Expense {
  id: string,
  tag?: string, // tag for the expense
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
  operation?: string, // add, update, delete
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

export interface Budget {
  id: string;
  name: string;
  amount: number;
  tagList: string[];
  modifiedDate: number;
  operation?: string; // Add operation property for consistency with other entities
}

export interface BudgetProgress {
  budget: Budget;
  spent: number;
  remaining: number;
  percentage: number;
}

export type MonthYear = {
  month: number; // 0-11 (January = 0)
  year: number;
  label: string; // e.g., "Jan 2024"
  value: string; // e.g., "2024-01" for filtering
};
