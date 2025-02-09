// src/App.tsx

import React, { useEffect } from "react";
import { AppBar, BottomNavigation, Box, CssBaseline, ThemeProvider, Toolbar } from "@mui/material";
import { createTheme } from "@mui/material/styles";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import TagExpenses from "./pages/TagExpenses";
import './App.scss'; 
import { styled } from '@mui/material/styles';
import UpdateGmail from "./pages/UpdateGmail";
import MySpeedDial from "./components/MySpeedDial";
import { GoogleOAuthProvider } from '@react-oauth/google';
import MyAppBar from "./components/MyAppBar";
import { FinanceIndexDB } from "./api/FinanceIndexDB";
import BottomNav from "./components/BottomNav";
import { ExpenseAPI } from "./api/ExpenseAPI";
import { sortByKey } from "./utility/utility";
import { setExpenseAndTag, setExpenseList } from "./store/expenseActions";

const StyledFab = styled(MySpeedDial)({
  position: 'absolute',
  zIndex: 1,
  top: -30,
  left: 0,
  right: 0,
  margin: '0 auto',
});



function App() {


  FinanceIndexDB.initDB();

  // define theme1
  const theme = createTheme({
    palette: {
      mode: 'dark',
    },
  });

  useEffect(() => {
    const tagMapApi = ExpenseAPI.getAllDoc('tagMap');
    const expenseApi = ExpenseAPI.getExpenseList();

    Promise.all([tagMapApi, expenseApi]).then((res) => {
        console.log("Expense List -> ", res);
        const tagResult = res[0];
        const expenseResult = res[1];
        const expenseList = sortByKey(expenseResult, 'date');
        
        setExpenseAndTag(expenseList, tagResult);
  
        console.log("Expense total length -> ", expenseList.length);
        console.log("Expense sublist -> ", expenseList[2]);
  
      }).catch((res1) => alert(res1))
    }, []);
  
  return (
    <GoogleOAuthProvider 
    clientId="542311218762-phbirt127dfih7s96g8j8iq40mqpmr2r.apps.googleusercontent.com"
    >
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <MyAppBar/>
        <div style={{marginTop: 80}}></div>
        
        <Routes>
          <Route path='/home' element={<Home/>} />
          <Route path='/dashboard' element={<Home/>} />
          <Route path='/tag' element={<TagExpenses/>} />
          <Route path='/Update' element={<UpdateGmail/>} />
          <Route path='/' element={<Home/>} />
        </Routes>

        <AppBar position="fixed" sx={{ top: 'auto', bottom: 0 }}>
        
        <BottomNav/>

      </AppBar>

      </ThemeProvider>
    </GoogleOAuthProvider>
    
  );
}

export default App;