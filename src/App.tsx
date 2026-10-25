/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {CssBaseline, ThemeProvider} from '@mui/material';
import React, {Suspense, useEffect} from 'react';
import {Navigate, Route, Routes} from 'react-router-dom';
import {deleteLegacyFinanceIdb, FinanceIndexDB} from './api/FinanceIndexDB';
import './App.scss';
import AppShell from './components/AppShell';
import BottomNav from './components/BottomNav';
import DemoBanner from './components/DemoBanner';
import ThemeManager from './components/ThemeManager';
import AlertComponent from './components/Alert';
import TagExpenses from './pages/home/home-views/TagExpenses';
import {resetExpenseState, selectExpense} from './store/expenseActions';
import {useSelector} from 'react-redux';
import {AuthProvider, useAuth} from './pages/login/AuthContext';
import {IS_DEMO_BUILD} from './utility/buildMode';
import {loadInitialAppData} from './pages/dataValidations';
import {routes} from './routes';
import Loading from './components/Loading';
import {useIsDesktop} from './hooks/useIsDesktop';
import {createAppTheme} from './styles/appTheme';

const LoginPage = (__DEMO_BUILD__ || IS_DEMO_BUILD)
  ? () => <Navigate to="/home" replace/>
  : React.lazy(() => import('./pages/login/Login'));

function App() {
  return (
    <AuthProvider>
      <ThemedApp/>
    </AuthProvider>
  );
}

const ThemedApp: React.FC = () => {
  const {currentUser, loading, dataMode} = useAuth();
  const {appConfig, isTagModal, isAppLoading} = useSelector(selectExpense);
  const theme = createAppTheme(appConfig.darkMode ? 'dark' : 'light');

  useEffect(() => {
    deleteLegacyFinanceIdb();
  }, []);

  useEffect(() => {
    if (loading || dataMode === 'checking') {
      return;
    }
    resetExpenseState();
    if (dataMode === 'live') {
      FinanceIndexDB.initDB();
    }
    loadInitialAppData();
  }, [loading, dataMode, currentUser?.uid]);

  if (loading || dataMode === 'checking' || isAppLoading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline/>
        <Loading/>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline/>
      {isTagModal && <TagExpenses/>}
      <DemoBanner/>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/login" element={<LoginPage/>}/>
          {routes.map((route) => (
            <Route
              key={route.key}
              path={route.path}
              element={
                <AppShell>
                  <route.component/>
                </AppShell>
              }
            />
          ))}
          <Route path="/" element={<Navigate to="/home" replace/>}/>
        </Routes>
      </Suspense>
      <ThemeManager/>
      <AlertComponent/>
      <BottomNavAuth/>
    </ThemeProvider>
  );
};


const BottomNavAuth = () => {
  const isDesktop = useIsDesktop();

  if (isDesktop) return null;

  return <BottomNav/>;
};


export default App;
