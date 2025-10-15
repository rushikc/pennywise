/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {AppConfig, BankConfig, Budget, Expense, VendorTag, Alert} from '../Types';


interface InitialState {
  expenseList: Expense[],
  budgetList: Budget[],
  expense: Expense | null,
  vendorTagList: VendorTag[],
  bankConfig: BankConfig,
  appConfig: AppConfig,
  isAppLoading: boolean,
  isTagModal: boolean,
  tagList: string[],
  alerts: Alert[],
}

const initialState: InitialState = {
  expenseList: [],
  budgetList: [],
  expense: null,
  vendorTagList: [],
  isAppLoading: true,
  appConfig: {
    darkMode: false
  },
  bankConfig: {
    enableUpi: false,
    creditCards: [],
  },
  isTagModal: false,
  tagList: [],
  alerts: [],
};


export const expenseSlice = createSlice({
  name: 'expense',
  initialState: initialState,

  reducers: {

    setExpenseList: (state, action: PayloadAction<Expense[]>) => {
      state.expenseList = action.payload;
    },

    setTagExpense: (state, action: PayloadAction<Expense>) => {
      state.expense = action.payload;
      state.isTagModal = true;
    },


    setTagMap: (state, action: PayloadAction<VendorTag>) => {
      const tagObj = action.payload;
      const tagIndex = state.vendorTagList.findIndex(t => t.vendor === tagObj.vendor);

      if (tagIndex > -1) {
        state.vendorTagList[tagIndex].tag = tagObj.tag;
      } else {
        state.vendorTagList.push(tagObj);
      }

    },

    updateExpense: (state, action: PayloadAction<Expense>) => {
      const expense = action.payload;
      const expenseIndex = state.expenseList.findIndex(t => t.mailId === expense.mailId);

      if (expenseIndex > -1) {
        state.expenseList[expenseIndex].tag = expense.tag;
      } else {
        state.expenseList.push(expense);
      }
    },

    deleteExpense: (state, action: PayloadAction<Expense>) => {
      const expense = action.payload;
      const expenseIndex = state.expenseList.findIndex(t => t.mailId === expense.mailId);

      console.log('Deleting expense', expense, 'at index', expenseIndex);
      if (expenseIndex > -1) {
        state.expenseList.slice(expenseIndex, 1);
      }
    },

    hideTagExpense: (state) => {
      state.isTagModal = false;
    },

    setExpenseState: (state, action: PayloadAction<{
      expenseList: Expense[],
      vendorTagList: VendorTag[],
      darkMode: boolean
    }>) => {
      state.expenseList = action.payload.expenseList;
      state.vendorTagList = action.payload.vendorTagList;
      state.appConfig.darkMode = action.payload.darkMode;
      state.isAppLoading = false;
    },


    setTagList: (state, action: PayloadAction<string[]>) => {
      state.tagList = action.payload;
    },

    addTag: (state, action: PayloadAction<string>) => {
      if (!state.tagList.includes(action.payload)) {
        state.tagList.push(action.payload);
      }
    },

    deleteTag: (state, action: PayloadAction<string>) => {
      state.tagList = state.tagList.filter(tag => tag !== action.payload);
    },

    mergeSaveExpense: (state, action: PayloadAction<{ originalExpenses: Expense[], mergedExpense: Expense }>) => {
      const {originalExpenses, mergedExpense} = action.payload;

      // Get the IDs of expenses to be removed
      const expenseIdsToRemove = originalExpenses.map(exp => exp.id);

      // Filter out the original expenses
      state.expenseList = state.expenseList.filter(expense =>
        !expenseIdsToRemove.includes(expense.id)
      );

      // Add the merged expense
      state.expenseList.push(mergedExpense);
    },

    toggleDarkMode: (state) => {
      state.appConfig.darkMode = !state.appConfig.darkMode;
    },

    addAlert: (state, action: PayloadAction<Omit<Alert, 'id'> | Alert>) => {
      let newAlert: Alert;
      if ('id' in action.payload) {
        // Alert already has an id
        newAlert = action.payload as Alert;
      } else {
        // Generate id for the alert
        const alertId = crypto.randomUUID();
        newAlert = {
          id: alertId,
          ...action.payload
        };
      }
      state.alerts.push(newAlert);
    },

    removeAlert: (state, action: PayloadAction<string>) => {
      state.alerts = state.alerts.filter(alert => alert.id !== action.payload);
    },

    clearAllAlerts: (state) => {
      state.alerts = [];
    },

    setBudgetList: (state, action: PayloadAction<Budget[]>) => {
      state.budgetList = action.payload;
    },

    addBudget: (state, action: PayloadAction<Budget>) => {
      state.budgetList.push(action.payload);
    },

    updateBudget: (state, action: PayloadAction<Budget>) => {
      const budget = action.payload;
      const budgetIndex = state.budgetList.findIndex(b => b.id === budget.id);

      if (budgetIndex > -1) {
        state.budgetList[budgetIndex] = budget;
      } else {
        state.budgetList.push(budget);
      }
    },

    deleteBudget: (state, action: PayloadAction<string>) => {
      state.budgetList = state.budgetList.filter(budget => budget.id !== action.payload);
    },
  }
});

export default expenseSlice.reducer;
