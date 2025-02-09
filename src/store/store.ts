import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { expenseSlice } from './expenseSlice'


const rootReducers = combineReducers({
    [expenseSlice.name]: expenseSlice.reducer
})


export const store = configureStore({
    reducer: rootReducers,
    // middleware: (getDefualtMiddleware) => 
    //     getDefualtMiddleware({
    //         serializableCheck: {
    //             ignoredActions: []
    //         }
    //     })
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch