import {AppBar, createTheme, CssBaseline, ThemeProvider} from "@mui/material";
import React from "react";
import {Navigate, Route, Routes, useLocation} from "react-router-dom";
import {FinanceIndexDB} from "./api/FinanceIndexDB";
import './App.scss';
import BottomNav from "./components/BottomNav";
import ThemeManager from "./components/ThemeManager";
import Home from "./pages/home/Home";
import TagExpenses from "./pages/home/TagExpenses";
import UpdateGmail from "./pages/UpdateGmail";
import TagList from "./pages/unused/TagList";
import Settings from "./pages/setting/Settings";
import Statistics from "./pages/stats/Statistics";
import Configuration from "./pages/setting/setting-views/Configuration";
import {selectExpense} from "./store/expenseActions";
import ManageTags from "./pages/setting/setting-views/ManageTags";
import {useSelector} from "react-redux";
import Login from "./pages/login/Login";
import {AuthProvider, useAuth} from "./pages/login/AuthContext";
import ManageVendorTags from "./pages/setting/setting-views/ManageVendorTags";

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({children}) => {
  const {currentUser, loading} = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!currentUser) {
    return <Navigate to="/login" state={{from: location}} replace/>;
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

function App() {

  FinanceIndexDB.initDB();

  // define theme1
  const { bankConfig } = useSelector(selectExpense);
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
  const theme = bankConfig.darkMode ? darkTheme : lightTheme;



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
          <Route path='/home' element={<ProtectedRoute><Home/></ProtectedRoute>}/>
          <Route path='/profile' element={<ProtectedRoute><Settings/></ProtectedRoute>}/>
          <Route path='/stats' element={<ProtectedRoute><Statistics/></ProtectedRoute>}/>
          <Route path='/tag' element={<ProtectedRoute><TagList/></ProtectedRoute>}/>
          <Route path='/Update' element={<ProtectedRoute><UpdateGmail/></ProtectedRoute>}/>
          <Route path='/config' element={<ProtectedRoute><Configuration/></ProtectedRoute>}/>
          <Route path='/setting-tags' element={<ProtectedRoute><ManageTags/></ProtectedRoute>}/>
          <Route path='/setting-tag-maps' element={<ProtectedRoute><ManageVendorTags/></ProtectedRoute>}/>
          <Route path='/' element={<ProtectedRoute><Home/></ProtectedRoute>}/>
        </Routes>
        <ThemeManager/>

        {/* Using the bottom nav component that safely uses useAuth hook */}
        <BottomNavAuth/>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
