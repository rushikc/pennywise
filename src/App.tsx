import {AppBar, createTheme, CssBaseline, ThemeProvider} from "@mui/material";
import React, {useEffect} from "react";
import {Navigate, Route, Routes, useLocation} from "react-router-dom";
import {ExpenseAPI} from "./api/ExpenseAPI";
import {FinanceIndexDB} from "./api/FinanceIndexDB";
import './App.scss';
import BottomNav from "./components/BottomNav";
import Home from "./pages/home/Home";
import TagExpenses from "./pages/home/TagExpenses";
import UpdateGmail from "./pages/UpdateGmail";
import {sortByKeyDate} from "./utility/utility";
import TagList from "./pages/unused/TagList";
import Settings from "./pages/setting/Settings";
import Statistics from "./pages/stats/Statistics";
import Configuration from "./pages/setting/setting-views/Configuration";
import {selectExpense, setExpenseAndTag, setTagList} from "./store/expenseActions";
import ManageTags from "./pages/setting/setting-views/ManageTags";
import {useSelector} from "react-redux";
import Login from "./pages/login/Login";
import {AuthProvider, useAuth} from "./auth/AuthContext";

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
  const theme = createTheme({
    palette: {
      mode: 'dark',
    },
  });

  useEffect(() => {

    void ExpenseAPI.processData();
    const tagMapApi = ExpenseAPI.getTagMapList();
    const expenseApi = ExpenseAPI.getExpenseList();
    const tagListApi = ExpenseAPI.getTagList();

    Promise.all([tagMapApi, expenseApi, tagListApi]).then((res) => {

      const tagResult = res[0];
      const expenseResult = res[1];
      const tagList = res[2];
      const expenseList = sortByKeyDate(expenseResult, 'date');

      setExpenseAndTag(expenseList, tagResult);
      setTagList(tagList);


      // console.log("Expense List -> ", expenseList);
      // console.log("TagMap List -> ", tagResult);

    }).catch((res1) => alert(res1))
  }, []);

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
          <Route path='/' element={<ProtectedRoute><Home/></ProtectedRoute>}/>
        </Routes>

        {/* Using the bottom nav component that safely uses useAuth hook */}
        <BottomNavAuth/>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
