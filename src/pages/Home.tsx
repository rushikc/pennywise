// src/pages/Home.tsx

import React, {ReactElement, FC, useState, useEffect} from "react";
import {Box, Typography, Chip} from "@mui/material";
import { styled, useTheme, Theme, CSSObject } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import DoneIcon from '@mui/icons-material/Done';
import { ExpenseAPI } from "../api/ExpenseAPI";
import { Row } from "reactstrap";


const Item = styled(Paper)(({ theme }) => ({
  ...theme.typography.body2,
  textAlign: 'center',
  color: theme.palette.text.secondary,
  height: 60,
  lineHeight: '60px',
}));


const Home: FC<any> = (): ReactElement => {

    const DrawerHeader = styled('div')(({ theme }) => ({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: theme.spacing(0, 1),
        // necessary for content to be below app bar
        ...theme.mixins.toolbar,
      }));


    
    const [expense, setexpense] = useState([]);

    useEffect(() => {
      ExpenseAPI.getExpenseList().then((res) => {
        console.log("Expense List -> ", res);
        setexpense(res);
      }).catch((res1) => alert(res1))
    }, []);

    return (
      <Box component="main">
        <DrawerHeader />
        {
          expense.map((val: {vendor: string, cost: number, id: number}, ind) => (
            <Item key={val.id} elevation={16} sx={{margin: 2, height: 100}}>
              <Row>
                <Chip 
                  icon={<CurrencyRupeeIcon sx={{width: 20}} />} 
                  label={val.cost} 
                  sx={{fontSize: "18px"}}
                />
              </Row>
              <span>Vendor: {val.vendor}</span>
            </Item>
          ))
        }

        <Item elevation={16} sx={{margin: 2, height: 100}}>
          <Chip 
            icon={<CurrencyRupeeIcon sx={{width: 20}} />} 
            label="213.33" 
            sx={{fontSize: "18px"}}
          />
        </Item>

        <Item elevation={16} sx={{margin: 2, height: 100}}>
          {`elevation=`}
        </Item>
        <Item elevation={16} sx={{margin: 2, height: 100}}>
          {`elevation=`}
        </Item>

      </Box>
    );
};

export default Home;