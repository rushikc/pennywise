// src/pages/Home.tsx

import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import CircularProgress from "@mui/material/CircularProgress/CircularProgress";
import Paper from '@mui/material/Paper';
import { styled } from '@mui/material/styles';
import React, {ReactElement, FC, useState, useEffect} from "react";
import { Col, Row } from "reactstrap";
import { ExpenseAPI } from "../api/ExpenseAPI";
import { Avatar } from '@mui/material';
import { red } from '@mui/material/colors';


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
      <div>
        {
          isLoading === 'loading' &&
          <div style={{paddingLeft: '9rem', paddingTop: '1rem'}}>
            {/* <span>Fetaching Gmail Data</span>
            <br/> */}
            <CircularProgress style={{marginTop: '1rem'}}  />
          </div>
        }

        {
          isLoading === 'loaded' &&
          expense.map((val: {vendor: string, cost: number, id: number}, ind) => (
            <Row key={ind} style={{margin: 30}}>

              <Avatar style={{marginTop: 3}}>
                <CurrencyRupeeIcon />
              </Avatar>
              
              <Col>
                <Row>
                  <Col>
                    <span>Zomato</span>
                  </Col>
                  <Col className='d-flex justify-content-end mr-2'>
                    <span>₹</span>
                    <span>1562</span>
                  </Col>
                </Row>
                <Row>
                  <span className='font-600 font-12'>23 Apr</span>
                </Row>
                <Row>
                  <Col>
                    <span className='tag-text'>Food & Dining</span>
                  </Col>
                </Row>
              </Col>
            </Row>
          ))
        }
      </div>
    );
};

export default Home;