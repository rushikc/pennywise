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
import { getDateTime, sortByTime, sortByTime2 } from "../Utiliy";
import Checkbox from "@mui/material/Checkbox/Checkbox";
import { setTagForExpense } from "../api/BaseApi";
import { Expense } from "../api/Types";
import { getDate, getISODate, getStorage, getTime, getTimeJs, setStorage, sortBy2Key } from "../utility/utility";
import { AnyAaaaRecord } from "dns";


const Item = styled(Paper)(({ theme }) => ({
  ...theme.typography.body2,
  textAlign: 'center',
  color: theme.palette.text.secondary,
  height: 60,
  lineHeight: '60px',
}));



const tag_list = ['food', 'groceries', 'Amenities', 'veg & fruits', 'snacks',
'shopping' , 'rent', 'extra','ironing', 'petrol', 'transport', 'bike', 'parents', 
'parents-amazon', 'Skin & Hair care',
'emi', 'medical', 'clothes','noodles', 'fitness', 'alcohol']



const TagExpenses: FC<any> = (): ReactElement => {

    const DrawerHeader = styled('div')(({ theme }) => ({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: theme.spacing(0, 1),
        ...theme.mixins.toolbar,
      }));


    
    const [expenseIndex, setexpenseIndex] = useState<number>(0);
    const timeOut = 500;
    const [expense, setExpense] = useState<Expense[]>([]);
    const [selectedExpense, setSelectedExpense] = useState<string[]>([]);
    const [autoTag, setAutoTag] = useState<boolean>(false);
    const [tagMap, setTagMap] = useState<any[]>([]);


    

    useEffect(() => {

      ExpenseAPI.getExpenseList().then((res) => {
        res = res.filter((doc:any) => doc.tag === null);
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
      
      if(autoTag) {
        let tagObj = tagMap.find(({vendor}) => vendor === _vendor);

        if(!tagObj){
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

        let expenseList = expense.filter(({vendor}) => vendor === _vendor);
        let expenseNew = expense.filter(({vendor}) => vendor !== _vendor);

        // console.log('Clicked if expenseList  ', expenseList);
        // console.log('Clicked if expenseNew  ', expenseNew);
        
        
        expenseList.forEach(_expense => {
          _expense.tag = tag;
          ExpenseAPI.addExpense(_expense);
        })


        setTimeout(() => {
          setexpenseIndex(expenseIndex+1);
          setSelectedExpense([]);
          setAutoTag(false);
        }, timeOut);

      }else{

        expense[expenseIndex].tag = tag;
        const expenseNew = expense.filter((exp) => exp.tag === null);
        console.log('Clicked expense ', expense);
        console.log('Clicked expense ', expense[expenseIndex]);
        ExpenseAPI.addExpense(expense[expenseIndex]);
        setTimeout(() => {
          setexpenseIndex(expenseIndex+1);
          setSelectedExpense([]);
          setAutoTag(false);
        }, timeOut);
      }
    }


    const handleRevert = () => {
      
      setTimeout(() => {
        setexpenseIndex(expenseIndex-1);
        setAutoTag(false);
        window.scroll(0,0);
      }, timeOut);

    }

    
    

    return (
      <div>
        {
          expense.length > 0 &&
          <Item elevation={10} sx={{marginTop: 4,margin: 2, height: '120vh'}}>
              <div style={{fontSize: '20px', fontWeight: 600, color: '#26559bcf'}}>
                  Tag Expenses 
                  ({expense.length})
              </div>
              <Chip 
                  icon={<CurrencyRupeeIcon sx={{width: 25}} />} 
                  label={expense[expenseIndex].cost} 
                  sx={{fontSize: "25px"}}
              />

              
              <div style={{fontSize: "18px", overflow: 'hidden'}}>
                  {expense[expenseIndex].vendor}
              </div>

              
              {
                expense[expenseIndex].date.seconds ?
                <div style={{fontSize: "18px"}}>
                    {getDate(expense[expenseIndex].date.seconds)}
                    {" - "}
                    <b>{getTimeJs(expense[expenseIndex].date.seconds)}</b>
                </div>
                :
                <div style={{fontSize: "18px"}}>
                    Loading ...
                </div>
              }

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
                      handleSelectedTag(expense[expenseIndex].id,'NA')}
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
                    onClick={() => handleRevert()}
                  />
                  
                </Row>
              </div>
          </Item>
        }
      </div>
    );
};

export default TagExpenses;