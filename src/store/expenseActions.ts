import {expenseSlice} from "./expenseSlice";
import {RootState} from "./store";

// Export action creators without dispatching
export const expenseActions = expenseSlice.actions;

// Use selector as before
export const selectExpense = (state: RootState) => state.expense;

