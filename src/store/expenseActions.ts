import {expenseSlice} from "./expenseSlice";
import {RootState, store} from "./store";
import {Expense, VendorTag} from "../Types";


export const selectExpense = (state: RootState) => state.expense;

export const setExpenseList = (expenses: Expense[]) => store.dispatch(expenseSlice.actions.setExpenseList(expenses));
export const setTagExpense = (expense: Expense) => store.dispatch(expenseSlice.actions.setTagExpense(expense));
export const setTagMap = (tag: VendorTag) => store.dispatch(expenseSlice.actions.setTagMap(tag));
export const updateExpense = (expense: Expense) => store.dispatch(expenseSlice.actions.updateExpense(expense));
export const hideTagExpense = () => store.dispatch(expenseSlice.actions.hideTagExpense());
export const setExpenseState = (expenseList: Expense[], vendorTagList: VendorTag[], darkMode: boolean) => store.dispatch(expenseSlice.actions.setExpenseState({
    expenseList,
    vendorTagList,
    darkMode
}));

export const setTagList = (tags: string[]) => store.dispatch(expenseSlice.actions.setTagList(tags));
export const addTag = (tag: string) => store.dispatch(expenseSlice.actions.addTag(tag));
export const deleteTag = (tag: string) => store.dispatch(expenseSlice.actions.deleteTag(tag));
export const mergeSaveExpense = (originalExpenses: Expense[], mergedExpense: Expense) =>
  store.dispatch(expenseSlice.actions.mergeSaveExpense({ originalExpenses, mergedExpense }));
export const deleteExpense = (expense: Expense) => store.dispatch(expenseSlice.actions.deleteExpense(expense));
export const toggleDarkMode = () => store.dispatch(expenseSlice.actions.toggleDarkMode());
