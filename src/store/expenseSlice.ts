import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {Expense, TagMap} from "../Types";
import {FinanceIndexDB} from "../api/FinanceIndexDB";


interface InitialState {
    expenseList: Expense[],
    expense: Expense | null,
    tagMapList: TagMap[],
    isAppLoading: boolean,
    isTagModal: boolean,
    tagList: string[],
}

const initialState: InitialState = {
    expenseList: [],
    expense: null,
    tagMapList: [],
    isAppLoading: true,
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

        setTagMap: (state, action: PayloadAction<TagMap>) => {
            const tagObj = action.payload;
            const tagIndex = state.tagMapList.findIndex(t => t.vendor == tagObj.vendor);

            if (tagIndex > -1) {
                state.tagMapList[tagIndex].tag = tagObj.tag;
            } else {
                state.tagMapList.push(tagObj)
            }

            void FinanceIndexDB.addTagMap(tagObj);

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

        hideTagExpense: (state) => {
            state.isTagModal = false;
        },

        setExpenseAndTag: (state, action: PayloadAction<{ expenseList: Expense[], tagMapList: TagMap[] }>) => {
            state.expenseList = action.payload.expenseList;
            state.tagMapList = action.payload.tagMapList;
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
        }
    }
})
