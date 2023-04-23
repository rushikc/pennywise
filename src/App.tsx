// src/App.tsx

import React from "react";
import { AppBar, Box, CssBaseline, ThemeProvider, Toolbar } from "@mui/material";
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

const StyledFab = styled(MySpeedDial)({
  position: 'absolute',
  zIndex: 1,
  top: -30,
  left: 0,
  right: 0,
  margin: '0 auto',
});



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
        <CssBaseline />
        <MyAppBar/>
        <div style={{marginTop: 80}}></div>
        
        <Routes>
          <Route path='/Home' element={<Home/>} />
          <Route path='/Tag' element={<TagExpenses/>} />
          <Route path='/Update' element={<UpdateGmail/>} />
          <Route path='/' element={<Home/>} />
        </Routes>

        <AppBar position="fixed" color="primary" sx={{ top: 'auto', bottom: 0 }}>
        <Toolbar>
          <MySpeedDial/>
          <Box sx={{ flexGrow: 1 }} />
        </Toolbar>
      </AppBar>

      </ThemeProvider>
    </GoogleOAuthProvider>
    
  );
}

export default App;