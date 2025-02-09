import { Expense, TagMap } from "../api/Types";
import { expenseSlice } from "./expenseSlice";
import { RootState, store } from "./store";


export const selectExpense = (state: RootState) => state.expense;

export const setExpenseList = (expenseList: Expense[]) => store.dispatch(expenseSlice.actions.setExpenseList(expenseList));
export const setExpenseAndTag = (expenseList: Expense[], tagMap: TagMap[]) => store.dispatch(expenseSlice.actions.setExpenseAndTag({expenseList, tagMap}));