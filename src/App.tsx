// src/App.tsx

import React from "react";
import { Box, CssBaseline, ThemeProvider } from "@mui/material";
import { createTheme } from "@mui/material/styles";
import { BrowserRouter as Router, Routes, Route, BrowserRouter } from "react-router-dom";
import { routes as appRoutes } from "./routes";
import MiniDrawer from "./components/MiniDrawer";
import Home from "./pages/Home";
import TagExpenses from "./pages/TagExpenses";
import './App.css'; 

import UpdateGmail from "./pages/UpdateGmail";


function App() {
  // define theme
  const theme = createTheme({
    palette: {
      mode: 'light',
    },
  });

  
  return (
    <ThemeProvider theme={theme}>
      <MiniDrawer />
      <CssBaseline />
      
      <Routes>
        <Route path='/Home' element={<Home/>} />
        <Route path='/Tag_Expenses' element={<TagExpenses/>} />
        <Route path='/Update_Gmail' element={<UpdateGmail/>} />
        <Route path='/' element={<Home/>} />
      </Routes>

    </ThemeProvider>
  );
}

export default App;