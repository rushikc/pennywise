/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {combineReducers, configureStore} from '@reduxjs/toolkit';
import {expenseSlice} from './expenseSlice';

const rootReducers = combineReducers({
  [expenseSlice.name]: expenseSlice.reducer
});

export const store = configureStore({
  reducer: rootReducers,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [],
        ignoredPaths: []
      }
    })
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
