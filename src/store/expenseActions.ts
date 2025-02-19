import { Expense, TagMap } from "../api/Types";
import { expenseSlice } from "./expenseSlice";
import { RootState, store } from "./store";


export const selectExpense = (state: RootState) => state.expense;

export const setExpenseList = (expenseList: Expense[]) => store.dispatch(expenseSlice.actions.setExpenseList(expenseList));
export const setTagExpense = (expense: Expense) => store.dispatch(expenseSlice.actions.setTagExpense(expense));
export const setTagMap = (tag: TagMap) => store.dispatch(expenseSlice.actions.setTagMap(tag));
export const hideTagExpense = () => store.dispatch(expenseSlice.actions.hideTagExpense());
export const setExpenseAndTag = (expenseList: Expense[], tagList: TagMap[]) => store.dispatch(expenseSlice.actions.setExpenseAndTag({ expenseList, tagList }));