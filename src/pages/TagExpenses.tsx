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
import { selectExpense } from "../store/expenseActions";
import { useSelector } from "react-redux";


const PaperStyled = styled(Paper)(({ theme }) => ({
  ...theme.typography.body2,
  textAlign: 'center',
  color: theme.palette.text.secondary,
  height: 60,
  lineHeight: '40px',
}));


const ButtonStyled = styled(Button)(({ theme }) => ({
  ...theme.typography.body2,
  textAlign: 'center',
  color: theme.palette.text.secondary,
  height: 60,
}));



const tag_list = ['food', 'groceries', 'Amenities', 'veg & fruits', 'snacks',
  'shopping', 'rent', 'extra', 'ironing', 'petrol', 'transport', 'bike', 'parents',
  'parents-amazon', 'Skin & Hair', 'emi', 'medical', 'clothes', 'noodles', 'fitness', 'alcohol']


  interface Props {
    expense: Expense

  }

const TagExpenses: FC<any> = (props: Props): ReactElement => {

  let expense = props.expense;
  const [selectedExpense, setSelectedExpense] = useState<string[]>([]);

  const [autoTag, setAutoTag] = useState<boolean>(false);

  const { tagMap } = useSelector(selectExpense);




  const handleSelectedTag = (id: string, tag: string) => {


    // setSelectedExpense([tag]);

    // let _vendor = expense.vendor;

    // if (autoTag) {
    //   let tagObj = tagMap.find(({ vendor }) => vendor === _vendor);

    //   if (!tagObj) {
    //     let key = _vendor;
    //     tagObj = {
    //       vendor: _vendor,
    //       tag
    //     }
    //     ExpenseAPI.setOneDoc(key, tagObj, 'tagMap');
    //     tagMap.push(tagObj);
    //     setStorage('tagMap', tagMap);
    //     // console.log('Adding new tagMap  ', expense);
    //   }

    //   let expenseList = expense.filter(({ vendor }) => vendor === _vendor);

    //   // console.log('Clicked if expenseList  ', expenseList);

    //   expenseList.forEach(_expense => {
    //     _expense.tag = tag;
    //     ExpenseAPI.addExpense(_expense);
    //   })


    //   setTimeout(() => {
    //     setexpenseIndex(expenseIndex + 1);
    //     setSelectedExpense([]);
    //     setAutoTag(false);
    //   }, timeOut);

    // } else {

    //   expense.tag = tag;
    //   console.log('Clicked expense ', expense);
    //   console.log('Clicked expense ', expense);
    //   ExpenseAPI.addExpense(expense);
    //   setTimeout(() => {
    //     setexpenseIndex(expenseIndex + 1);
    //     setSelectedExpense([]);
    //     setAutoTag(false);
    //   }, timeOut);
    // }
  }



  return (
    <div style={{zIndex: 100, paddingTop: 20}}>
      <PaperStyled elevation={10} sx={{ marginTop: 4, margin: 2, height: '120vh' }}>
        
        <Chip
          icon={<CurrencyRupeeIcon sx={{ width: 25 }} />}
          label={expense.cost}
          sx={{ fontSize: "25px" }}
        />


        <div style={{ fontSize: "18px", overflow: 'hidden' }}>
          {expense.vendor}
        </div>


        {
          expense.date ?
            <div style={{ fontSize: "18px" }}>
              {getDate(expense.date)}
              {" - "}
              <b>{getTimeJs(expense.date)}</b>
            </div>
            :
            <div style={{ fontSize: "18px" }}>
              Loading ...
            </div>
        }

        <div style={{padding: 10}}>
          <ButtonStyled
            style={{
              width: '110px',
              height: '35px',
            }}
            variant={autoTag ? "contained" : "outlined"}
            onClick={() => setAutoTag(!autoTag)}
          >
            Auto Tag
          </ButtonStyled>
        </div>


        <div className="container">
          <div className="row" >

            {
              tag_list.map((val, index) => (
                <div className="col" style={{padding: 10}} key={index} >
                  <Button
                    style={{
                      width: '100px',
                      height: '45px',
                    }}
                    variant={selectedExpense.includes(val) ? "contained" : "outlined"}
                    onClick={() =>
                      handleSelectedTag(expense.id, selectedExpense.includes(val) ? "" : val)}
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
                  handleSelectedTag(expense.id, 'NA')}
              >
                skip
              </Button>
            </Col>

          </Row>
        </div>
      </PaperStyled>
    </div>
  );
};

export default TagExpenses;