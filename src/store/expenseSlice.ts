import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Expense, TagMap } from "../api/Types";


interface InitialState {
    expenseList: Expense[],
    tagMap: TagMap[],
    isAppLoading: boolean,
}

const initialState: InitialState = {
    expenseList: [],
    tagMap: [],
    isAppLoading: true
}


export const expenseSlice = createSlice({
    name: 'expense',
    initialState: initialState,

    reducers: {

        setExpenseList: (state, action: PayloadAction<Expense[]>) => {
            state.expenseList = action.payload;
        },

        setExpenseAndTag: (state, action: PayloadAction<{expenseList: Expense[], tagMap: TagMap[]}>) => {
            state.expenseList = action.payload.expenseList;
            state.tagMap = action.payload.tagMap;
            state.isAppLoading = false;
        }
    }
})