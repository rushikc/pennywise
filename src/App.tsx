import {AppBar, CssBaseline, ThemeProvider} from "@mui/material";
import {createTheme} from "@mui/material/styles";
import {GoogleOAuthProvider} from '@react-oauth/google';
import {useEffect} from "react";
import {Route, Routes} from "react-router-dom";
import {ExpenseAPI} from "./api/ExpenseAPI";
import {FinanceIndexDB} from "./api/FinanceIndexDB";
import './App.scss';
import BottomNav from "./components/BottomNav";
import Home from "./pages/Home";
import TagExpenses from "./pages/TagExpenses";
import UpdateGmail from "./pages/UpdateGmail";
import {sortByKeyDate} from "./utility/utility";
import TagList from "./pages/TagList";
import Settings from "./pages/dashboard/Settings";
import Profile from "./pages/profile/Profile";
import Statistics from "./pages/stats/Statistics";
import Configuration from "./pages/config/Configuration";
import {setExpenseAndTag} from "./store/expenseActions";

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
    const tagMapApi = ExpenseAPI.getTagList();
    const expenseApi = ExpenseAPI.getExpenseList();

    Promise.all([tagMapApi, expenseApi]).then((res) => {

      const tagResult = res[0];
      const expenseResult = res[1];
      const expenseList = sortByKeyDate(expenseResult, 'date');

      setExpenseAndTag(expenseList, tagResult);

      // console.log("Expense List -> ", expenseList);
      // console.log("TagMap List -> ", tagResult);

    }).catch((res1) => alert(res1))
  }, []);

  return (
    <GoogleOAuthProvider clientId="542311218762-phbirt127dfih7s96g8j8iq40mqpmr2r.apps.googleusercontent.com">
      <ThemeProvider theme={theme}>
        <CssBaseline />

        <TagExpenses />

        <Routes>
          <Route path='/home' element={<Home />} />
          <Route path='/profile' element={<Settings />} />
          <Route path='/stats' element={<Statistics />} />
          <Route path='/tag' element={<TagList />} />
          <Route path='/Update' element={<UpdateGmail />} />
          <Route path='/profile' element={<Profile />} />
          <Route path='/stats' element={<Statistics />} />
          <Route path='/config' element={<Configuration />} />
          <Route path='/' element={<Home />} />
        </Routes>

        <AppBar position="fixed" sx={{ top: 'auto', bottom: 0 }}>
          <BottomNav />
        </AppBar>

      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;

