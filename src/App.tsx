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
import MySpeedDial from "./components/MySpeedDial";
import { GoogleOAuthProvider } from '@react-oauth/google';


function App() {
  // define theme
  const theme = createTheme({
    palette: {
      mode: 'light',
    },
  });

  
  return (
    <GoogleOAuthProvider 
    clientId="542311218762-phbirt127dfih7s96g8j8iq40mqpmr2r.apps.googleusercontent.com"
    >
      <ThemeProvider theme={theme}>
        <MiniDrawer />
        <CssBaseline />
        <MySpeedDial/>
        
        <Routes>
          <Route path='/Home' element={<Home/>} />
          <Route path='/Tag' element={<TagExpenses/>} />
          <Route path='/Update' element={<UpdateGmail/>} />
          <Route path='/' element={<Home/>} />
        </Routes>

      </ThemeProvider>
    </GoogleOAuthProvider>
    
  );
}

export default App;