/*
Copyright (C) 2025 <rushikc> <rushikc.dev@gmail.com>

This program is free software; you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the
Free Software Foundation; version 3 of the License.

This program is distributed in the hope that it will be useful, but
WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details, or get a copy at
<https://www.gnu.org/licenses/gpl-3.0.txt>.
*/

import {AppBar, createTheme, CssBaseline, ThemeProvider} from '@mui/material';
import React from 'react';
import {Navigate, Route, Routes, useLocation} from 'react-router-dom';
import {FinanceIndexDB} from './api/FinanceIndexDB';
import './App.scss';
import BottomNav from './components/BottomNav';
import ThemeManager from './components/ThemeManager';
import TagExpenses from './pages/home/home-views/TagExpenses';
import {selectExpense} from './store/expenseActions';
import {useSelector} from 'react-redux';
import Login from './pages/login/Login';
import {AuthProvider, useAuth} from './pages/login/AuthContext';
import {loadInitialAppData} from './pages/dataValidations';
import {routes} from './routes';


function App() {

    FinanceIndexDB.initDB();

    const {appConfig} = useSelector(selectExpense);

    const darkTheme = createTheme({
        palette: {
            mode: 'dark',
        },
    });

    const lightTheme = createTheme({
        palette: {
            mode: 'light',
        },
    });

    // Use the appropriate theme based on bankConfig.darkMode
    const theme = appConfig.darkMode ? darkTheme : lightTheme;


    const {isTagModal} = useSelector(selectExpense);

    return (
        <AuthProvider>
            <ThemeProvider theme={theme}>
                <CssBaseline/>
                {
                    isTagModal && <TagExpenses/>
                }

                <Routes>
                    <Route path="/login" element={<Login/>}/>
                    {routes.map((route) => (
                        <Route
                            key={route.key}
                            path={route.path}
                            element={
                                route.isProtected ? (
                                    <ProtectedRoute>
                                        <route.component/>
                                    </ProtectedRoute>
                                ) : (
                                    <route.component/>
                                )
                            }
                        />
                    ))}
                    <Route path="/" element={<ProtectedRoute><Navigate to="/home"/></ProtectedRoute>}/>
                </Routes>
                <ThemeManager/>

                {/* Using the bottom nav component that safely uses useAuth hook */}
                <BottomNavAuth/>
            </ThemeProvider>
        </AuthProvider>
    );
}


// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const {currentUser, loading} = useAuth();
    const {isAppLoading} = useSelector(selectExpense);
    const location = useLocation();

    if (loading) return null;

    if (!currentUser) {
        return <Navigate to="/login" state={{from: location}} replace/>;
    }

    // console.log("isAppLoading in ProtectedRoute:", isAppLoading);

    if (isAppLoading) {
        loadInitialAppData();
        return null; // or a loading spinner
    }

    return <>{children}</>;
};


// Bottom navigation wrapper that uses auth context
const BottomNavAuth = () => {
    const {currentUser} = useAuth();

    if (!currentUser) return null;

    return (
        <AppBar position="fixed" sx={{top: 'auto', bottom: 0}}>
            <BottomNav/>
        </AppBar>
    );
};


export default App;
