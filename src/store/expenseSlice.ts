import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Expense, TagMap } from "../api/Types";
import { insertAtIndex } from "../utility/utility";
import { FinanceIndexDB } from "../api/FinanceIndexDB";


interface InitialState {
    expenseList: Expense[],
    expense: Expense | null,
    tagList: TagMap[],
    isAppLoading: boolean,
    isTagModal: boolean,
}

const initialState: InitialState = {
    expenseList: [],
    expense: null,
    tagList: [],
    isAppLoading: true,
    isTagModal: false
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

        setTagMap: (state, action: PayloadAction<TagMap>) => {
            const tag = action.payload;
            const tagIndex = state.tagList.findIndex(t => t.vendor == tag.vendor);

            if (tagIndex > -1) {
                state.tagList = insertAtIndex(state.tagList, tagIndex, tag);
            } else {
                state.tagList.push(tag)
            }

            FinanceIndexDB.addTagMap(tag);

        },

        hideTagExpense: (state) => {
            state.isTagModal = false;
        },

        setExpenseAndTag: (state, action: PayloadAction<{ expenseList: Expense[], tagList: TagMap[] }>) => {
            state.expenseList = action.payload.expenseList;
            state.tagList = action.payload.tagList;
            state.isAppLoading = false;
        }
    }
})