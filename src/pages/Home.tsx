// src/pages/Home.tsx

import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import { Box, Chip } from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress/CircularProgress";
import Paper from '@mui/material/Paper';
import { styled } from '@mui/material/styles';
import React, {ReactElement, FC, useState, useEffect} from "react";
import { Row } from "reactstrap";
import { ExpenseAPI } from "../api/ExpenseAPI";


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
    const [isLoading, setLoading] = useState('ns');

    useEffect(() => {
      setLoading('loading');
      ExpenseAPI.getExpenseList().then((res) => {
        console.log("Expense List -> ", res);
        setexpense(res);
        setLoading('loaded');
      }).catch((res1) => alert(res1))
    }, []);

    return (
      <Box component="main">
        <DrawerHeader />

        {
          isLoading === 'loading' &&
          <div style={{paddingLeft: '9rem', paddingTop: '4rem'}}>
            {/* <span>Fetaching Gmail Data</span>
            <br/> */}
            <CircularProgress style={{marginTop: '1rem'}}  />
          </div>
        }

        {
          isLoading === 'loaded' &&
          expense.map((val: {vendor: string, cost: number, id: number}, ind) => (
            <Item key={val.id} elevation={16} sx={{margin: 2, height: 100}}>
              <Row style={{margin: 0, borderRadius: '4px'}}>
                <Chip 
                  icon={<CurrencyRupeeIcon sx={{width: 20}} />} 
                  label={val.cost} 
                  sx={{fontSize: "18px", borderRadius: 0, backgroundColor: '#27539361'}}
                  // sx={{fontSize: "18px", borderRadius: 0, backgroundColor: '#0d6efd61'}}
                />
              </Row>
              <span>Vendor: {val.vendor}</span>
            </Item>
          ))
        }

      </Box>
    );
};

export default Home;