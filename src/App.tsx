/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {CssBaseline, ThemeProvider} from '@mui/material';
import React, {Suspense, useEffect, useRef} from 'react';
import {Navigate, Route, Routes, useLocation} from 'react-router-dom';
import {FinanceIndexDB} from './api/FinanceIndexDB';
import './App.scss';
import AppShell from './components/AppShell';
import BottomNav from './components/BottomNav';
import ThemeManager from './components/ThemeManager';
import AlertComponent from './components/Alert';
import TagExpenses from './pages/home/home-views/TagExpenses';
import {selectExpense} from './store/expenseActions';
import {useSelector} from 'react-redux';
import Login from './pages/login/Login';
import {AuthProvider, useAuth} from './pages/login/AuthContext';
import {loadInitialAppData} from './pages/dataValidations';
import {routes} from './routes';
import Loading from './components/Loading';
import {useIsDesktop} from './hooks/useIsDesktop';
import {createAppTheme} from './styles/appTheme';


function App() {

  useEffect(() => {
    FinanceIndexDB.initDB();
  }, []);

  const {appConfig} = useSelector(selectExpense);

  const theme = createAppTheme(appConfig.darkMode ? 'dark' : 'light');


  const {isTagModal} = useSelector(selectExpense);

  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline/>
        {
          isTagModal && <TagExpenses/>
        }

        <Suspense fallback={<Loading />}>
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
        </Suspense>
        <ThemeManager/>

        {/* Global Alert component for displaying alerts */}
        <AlertComponent/>

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
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (!loading && currentUser && isAppLoading && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadInitialAppData();
    }
  }, [loading, currentUser, isAppLoading]);

  if (loading) return <Loading/>;

  if (!currentUser) {
    return <Navigate to="/login" state={{from: location}} replace/>;
  }

  if (isAppLoading) {
    return <Loading/>;
  }

  return <AppShell>{children}</AppShell>;
};


// Bottom navigation wrapper that uses auth context
const BottomNavAuth = () => {
  const {currentUser} = useAuth();
  const isDesktop = useIsDesktop();

  if (!currentUser || isDesktop) return null;

  return <BottomNav/>;
};


export default App;
