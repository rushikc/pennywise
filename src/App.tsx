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
import {setExpenseAndTag} from "./store/expenseActions";
import {sortByKeyDate} from "./utility/utility";
import TagList from "./pages/TagList";

function App() {

  FinanceIndexDB.initDB();

  // define theme1
  const theme = createTheme({
    palette: {
      mode: 'dark',
    },
  });

  useEffect(() => {

    ExpenseAPI.processData();
    const tagMapApi = ExpenseAPI.getTagList();
    const expenseApi = ExpenseAPI.getExpenseList();

    Promise.all([tagMapApi, expenseApi]).then((res) => {

      const tagResult = res[0];
      const expenseResult = res[1];
      const expenseList = sortByKeyDate(expenseResult, 'date');

      setExpenseAndTag(expenseList, tagResult);

      // console.log("Expense List -> ", expenseList);
      // console.log("TagMap List -> ", tagResult);

      console.log("Expense total length -> ", expenseList.length);
      console.log("Expense sublist -> ", expenseList[2]);

    }).catch((res1) => alert(res1))
  }, []);

  return (
    <GoogleOAuthProvider clientId="542311218762-phbirt127dfih7s96g8j8iq40mqpmr2r.apps.googleusercontent.com">
      <ThemeProvider theme={theme}>
        <CssBaseline />

        <TagExpenses />

        <Routes>
          <Route path='/home' element={<Home />} />
          <Route path='/dashboard' element={<Home />} />
          <Route path='/tag' element={<TagList />} />
          <Route path='/Update' element={<UpdateGmail />} />
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

