import {combineReducers, configureStore} from '@reduxjs/toolkit'
import {expenseSlice} from './expenseSlice'

const rootReducers = combineReducers({
    [expenseSlice.name]: expenseSlice.reducer
})

export const store = configureStore({
    reducer: rootReducers,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['expense/updateExpense'],
                ignoredPaths: ['payload.date']
            }
        })
});

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

