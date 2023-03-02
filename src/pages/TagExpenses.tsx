// src/pages/Home.tsx

import React, {ReactElement, FC, useState, useEffect} from "react";
import {Box, Typography, Chip} from "@mui/material";
import { styled, useTheme, Theme, CSSObject } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import DoneIcon from '@mui/icons-material/Done';
import { ExpenseAPI } from "../api/ExpenseAPI";
import { Col, Row } from "reactstrap";
import { JSONObject } from "./Constants";
import Button from "@mui/material/Button/Button";
import { DateTime } from "luxon";
import { getDateTime, sortByTime } from "../Utiliy";
import Checkbox from "@mui/material/Checkbox/Checkbox";
import { setTagForExpense } from "../api/BaseApi";
import { Expense } from "../api/Types";
import { getDate, getStorage, getTime } from "../utility/utility";
import { AnyAaaaRecord } from "dns";


const Item = styled(Paper)(({ theme }) => ({
  ...theme.typography.body2,
  textAlign: 'center',
  color: theme.palette.text.secondary,
  height: 60,
  lineHeight: '60px',
}));



const tag_list = ['food', 'groceries', 'Amenities', 'veg & fruits', 'snacks',
'shopping' , 'rent', 'extra','ironing', 'petrol', 'transport', 'parents', 
'parents-amazon', 'Skin & Hair care',
'emi', 'medical', 'clothes','noodles', 'fitness', 'alcohol']



const TagExpenses: FC<any> = (): ReactElement => {

    const DrawerHeader = styled('div')(({ theme }) => ({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: theme.spacing(0, 1),
        // necessary for content to be below app bar
        ...theme.mixins.toolbar,
      }));


    
    const [expenseIndex, setexpenseIndex] = useState<number>(0);
    const [expense, setexpense] = useState<Expense[]>([]);
    const [selectedExpense, setSelectedExpense] = useState<string[]>([]);
    const [autoTag, setAutoTag] = useState<boolean>(false);


    

    useEffect(() => {

      ExpenseAPI.getUnTaggedExpenseList().then((res) => {
        res = sortByTime(res, 'date');
        console.log("Expense List -> ", res[1]);
        setexpense(res);
      });

    }, []);


    const handleSelectedTag = (id: string, tag: string) => {

      console.log('Clicked');

      let key = '01-01-2023 10:06:00 q733837202';

      setSelectedExpense([tag]);
      // if(autoTag){
      //   ExpenseAPI.autoTagExpense(expense[expenseIndex].vendor, tag).then(() => {
      //     setTimeout(() => {
      //       setexpenseIndex(expenseIndex+1);
      //       setSelectedExpense([]);
      //       setAutoTag(false);
      //     }, 200);
      //   })
      // }else{
        // ExpenseAPI.tagExpense(id, tag).then(() => {
        //   setTimeout(() => {
        //     setexpenseIndex(expenseIndex+1);
        //     setSelectedExpense([]);
        //     setAutoTag(false);
        //   }, 200);
        // })
      // }
    }

    
    

    return (
      <Box component="main">
        <DrawerHeader />

        {
          expense.length > 0 &&
          <Item elevation={10} sx={{marginTop: 4,margin: 2, height: '120vh'}}>
              <div style={{fontSize: '20px', fontWeight: 600, color: '#26559bcf'}}>
                  Tag Expenses
              </div>
              <Chip 
                  icon={<CurrencyRupeeIcon sx={{width: 25}} />} 
                  label={expense[expenseIndex].cost} 
                  sx={{fontSize: "25px"}}
              />

              
              <div style={{fontSize: "18px", overflow: 'hidden'}}>
                  {expense[expenseIndex].vendor}
              </div>

              
              <div style={{fontSize: "18px"}}>
                  {getDate(expense[expenseIndex].date.seconds)}
                  {" - "}
                  <b>{getTime(expense[expenseIndex].date.seconds)}</b>
              </div>

              <div>
                <Button 
                  style={{
                    width: '110px', 
                    height: '35px',
                    // marginRight: (index+1)%2 == 0? '10px': '0px',
                    // marginLeft: (index+1)%2 == 0? '0px': '10px',
                  }} 
                  variant={autoTag? "contained": "outlined"}
                  onClick={() => setAutoTag(!autoTag)}
                  >
                  Auto Tag
                </Button>
              </div>
              

              <div className="container">
                <div className="row" >
                  
                  {
                    tag_list.map((val, index) => (
                      <div className="col-4" key={index} >
                        <Button 
                          style={{
                            width: '120px', 
                            height: '50px',
                            // marginRight: (index+1)%2 == 0? '10px': '0px',
                            // marginLeft: (index+1)%2 == 0? '0px': '10px',
                          }} 
                          variant={selectedExpense.includes(val)? "contained": "outlined"}
                          onClick={() => 
                            handleSelectedTag(expense[expenseIndex].id, selectedExpense.includes(val)? "" : val)}
                          >
                          {val}
                        </Button>
                      </div>
                    ))
                  }
                </div>
                <Row>
                  <Button 
                    style={{
                      width: '170px', 
                      height: '40px',
                      marginTop: '30px',
                      marginLeft: '45px',
                    }}
                    variant={"contained"}
                    onClick={() => 
                      handleSelectedTag(expense[expenseIndex].id,'ignore')}
                    >
                    skip
                  </Button>
                  <Button style={{
                      width: '170px', 
                      height: '40px',
                      marginTop: '30px',
                      marginLeft: '10px',
                    }} 
                    variant="contained" 
                    startIcon={<SettingsBackupRestoreIcon />}
                    onClick={() => setexpenseIndex(expenseIndex-1)}
                  />
                  
                </Row>
              </div>
          </Item>
        }
      </Box>
    );
};

export default TagExpenses;