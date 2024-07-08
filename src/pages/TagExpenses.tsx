// src/pages/Home.tsx
import { FC, ReactElement, useEffect, useState } from "react";

import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import { Chip } from "@mui/material";
import Button from "@mui/material/Button/Button";
import Paper from '@mui/material/Paper';
import { styled } from '@mui/material/styles';
import { Col, Row } from "reactstrap";
import { ExpenseAPI } from "../api/ExpenseAPI";
import { Expense } from "../api/Types";
import Loading from "../components/Loading";
import { getDate, getTimeJs, setStorage, sortBy2Key } from "../utility/utility";


const Item = styled(Paper)(({ theme }) => ({
  ...theme.typography.body2,
  textAlign: 'center',
  color: theme.palette.text.secondary,
  height: 60,
  lineHeight: '60px',
}));



const tag_list = ['food', 'groceries', 'Amenities', 'veg & fruits', 'snacks',
  'shopping', 'rent', 'extra', 'ironing', 'petrol', 'transport', 'bike', 'parents',
  'parents-amazon', 'Skin & Hair', 'emi', 'medical', 'clothes', 'noodles', 'fitness', 'alcohol']



const TagExpenses: FC<any> = (): ReactElement => {

  const [expenseIndex, setexpenseIndex] = useState<number>(0);
  const timeOut = 500;
  const [expense, setExpense] = useState<Expense[]>([]);
  const [selectedExpense, setSelectedExpense] = useState<string[]>([]);
  const [autoTag, setAutoTag] = useState<boolean>(false);
  const [tagMap, setTagMap] = useState<any[]>([]);


  useEffect(() => {

    ExpenseAPI.getExpenseList().then((res) => {
      res = res.filter((doc: any) => doc.tag === null);
      res = sortBy2Key(res, 'date', 'seconds')
      setExpense(res);
    });

    ExpenseAPI.getAllDoc('tagMap').then((res) => {
      setTagMap(res);
    });

  }, []);




  const handleSelectedTag = (id: string, tag: string) => {


    setSelectedExpense([tag]);

    let _vendor = expense[expenseIndex].vendor;

    if (autoTag) {
      let tagObj = tagMap.find(({ vendor }) => vendor === _vendor);

      if (!tagObj) {
        let key = _vendor;
        tagObj = {
          vendor: _vendor,
          tag
        }
        ExpenseAPI.setOneDoc(key, tagObj, 'tagMap');
        tagMap.push(tagObj);
        setStorage('tagMap', tagMap);
        // console.log('Adding new tagMap  ', expense[expenseIndex]);
      }

      let expenseList = expense.filter(({ vendor }) => vendor === _vendor);
      let expenseNew = expense.filter(({ vendor }) => vendor !== _vendor);

      // console.log('Clicked if expenseList  ', expenseList);
      // console.log('Clicked if expenseNew  ', expenseNew);


      expenseList.forEach(_expense => {
        _expense.tag = tag;
        ExpenseAPI.addExpense(_expense);
      })


      setTimeout(() => {
        setexpenseIndex(expenseIndex + 1);
        setSelectedExpense([]);
        setAutoTag(false);
      }, timeOut);

    } else {

      expense[expenseIndex].tag = tag;
      const expenseNew = expense.filter((exp) => exp.tag === null);
      console.log('Clicked expense ', expense);
      console.log('Clicked expense ', expense[expenseIndex]);
      ExpenseAPI.addExpense(expense[expenseIndex]);
      setTimeout(() => {
        setexpenseIndex(expenseIndex + 1);
        setSelectedExpense([]);
        setAutoTag(false);
      }, timeOut);
    }
  }


  const handleRevert = () => {

    setTimeout(() => {
      setexpenseIndex(expenseIndex - 1);
      setAutoTag(false);
      window.scroll(0, 0);
    }, timeOut);

  }




  return (
    <div>
      {
        expense.length == 0 ?
          <Loading />
          :
          <Item elevation={10} sx={{ marginTop: 4, margin: 2, height: '120vh' }}>
            <div style={{ fontSize: '20px', fontWeight: 600, color: '#6799e2' }}>
              Tag Expenses
              ({expense.length})
            </div>
            <Chip
              icon={<CurrencyRupeeIcon sx={{ width: 25 }} />}
              label={expense[expenseIndex].cost}
              sx={{ fontSize: "25px" }}
            />


            <div style={{ fontSize: "18px", overflow: 'hidden' }}>
              {expense[expenseIndex].vendor}
            </div>


            {
              expense[expenseIndex].date ?
                <div style={{ fontSize: "18px" }}>
                  {getDate(expense[expenseIndex].date)}
                  {" - "}
                  <b>{getTimeJs(expense[expenseIndex].date)}</b>
                </div>
                :
                <div style={{ fontSize: "18px" }}>
                  Loading ...
                </div>
            }

            <div>
              <Button
                style={{
                  width: '110px',
                  height: '35px',
                }}
                variant={autoTag ? "contained" : "outlined"}
                onClick={() => setAutoTag(!autoTag)}
              >
                Auto Tag
              </Button>
            </div>


            <div className="container">
              <div className="row" >

                {
                  tag_list.map((val, index) => (
                    <div className="col" key={index} >
                      <Button
                        style={{
                          width: '100px',
                          height: '50px',
                        }}
                        variant={selectedExpense.includes(val) ? "contained" : "outlined"}
                        onClick={() =>
                          handleSelectedTag(expense[expenseIndex].id, selectedExpense.includes(val) ? "" : val)}
                      >
                        {val}
                      </Button>
                    </div>
                  ))
                }
              </div>
              <Row>
                <Col>
                  <Button
                    style={{
                      width: '140px',
                      height: '40px',
                      marginTop: '30px',
                    }}
                    variant={"contained"}
                    onClick={() =>
                      handleSelectedTag(expense[expenseIndex].id, 'NA')}
                  >
                    skip
                  </Button>
                </Col>
                <Col>
                  <Button style={{
                    width: '140px',
                    height: '40px',
                    marginTop: '30px',
                  }}
                    variant="contained"
                    startIcon={<SettingsBackupRestoreIcon />}
                    onClick={() => handleRevert()}
                  />
                </Col>

              </Row>
            </div>
          </Item>
      }
    </div>
  );
};

export default TagExpenses;