import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {BankConfig, Expense, VendorTag} from "../Types";
import {FinanceIndexDB} from "../api/FinanceIndexDB";


interface InitialState {
    expenseList: Expense[],
    expense: Expense | null,
    vendorTagList: VendorTag[],
    bankConfig: BankConfig,
    isAppLoading: boolean,
    isTagModal: boolean,
    tagList: string[],
}

const initialState: InitialState = {
    expenseList: [],
    expense: null,
    vendorTagList: [],
    isAppLoading: true,
    bankConfig: {
        enableUpi: false,
        darkMode: false,
        creditCards: [],
    },
    isTagModal: false,
    tagList: [],
}


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

        addTagExpense: (state, action: PayloadAction<Expense>) => {
            state.expense = action.payload;
            state.isTagModal = true;
        },

        setTagMap: (state, action: PayloadAction<VendorTag>) => {
            const tagObj = action.payload;
            const tagIndex = state.vendorTagList.findIndex(t => t.vendor == tagObj.vendor);

            if (tagIndex > -1) {
                state.vendorTagList[tagIndex].tag = tagObj.tag;
            } else {
                state.vendorTagList.push(tagObj)
            }

            void FinanceIndexDB.addVendorTag(tagObj);

        },

        updateExpense: (state, action: PayloadAction<Expense>) => {
            const expense = action.payload;
            const expenseIndex = state.expenseList.findIndex(t => t.mailId == expense.mailId);

            if (expenseIndex > -1) {
                state.expenseList[expenseIndex].tag = expense.tag;
            } else {
                state.expenseList.push(expense)
            }
        },

        deleteExpense: (state, action: PayloadAction<Expense>) => {
            const expense = action.payload;
            const expenseIndex = state.expenseList.findIndex(t => t.mailId == expense.mailId);

            console.log("Deleting expense", expense, "at index", expenseIndex);
            if (expenseIndex > -1) {
                state.expenseList.slice(expenseIndex, 1);
            }
        },

        hideTagExpense: (state) => {
            state.isTagModal = false;
        },

        setExpenseState: (state, action: PayloadAction<{ expenseList: Expense[], vendorTagList: VendorTag[] , bankConfig: BankConfig}>) => {
            state.expenseList = action.payload.expenseList;
            state.vendorTagList = action.payload.vendorTagList;
            state.bankConfig = action.payload.bankConfig;
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

        mergeSaveExpense: (state, action: PayloadAction<{originalExpenses: Expense[], mergedExpense: Expense}>) => {
            const { originalExpenses, mergedExpense } = action.payload;

            // Get the IDs of expenses to be removed
            const expenseIdsToRemove = originalExpenses.map(exp => exp.id);

            // Filter out the original expenses
            state.expenseList = state.expenseList.filter(expense =>
                !expenseIdsToRemove.includes(expense.id)
            );

            // Add the merged expense
            state.expenseList.push(mergedExpense);
        },
    }
})
