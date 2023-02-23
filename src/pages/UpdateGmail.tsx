// src/pages/Home.tsx

import React, {ReactElement, FC, useState, useEffect} from "react";
import {Box, Typography, Chip} from "@mui/material";
import { styled, useTheme, Theme, CSSObject } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import DoneIcon from '@mui/icons-material/Done';
import { ExpenseAPI } from "../api/ExpenseAPI";
import { Row } from "reactstrap";
import CircularProgress from "@mui/material/CircularProgress/CircularProgress";
import Button from "@mui/material/Button/Button";
import { GoogleLogin } from '@react-oauth/google';

import { google } from 'googleapis';
import { addExpense, addUser, getExpenseList, getUnTaggedExpenseList } from "../api/BaseApi";


const Item = styled(Paper)(({ theme }) => ({
  ...theme.typography.body2,
  textAlign: 'center',
  color: theme.palette.text.secondary,
  height: 60,
  lineHeight: '60px',
}));



const UpdateGmail: FC<any> = (): ReactElement => {

    const DrawerHeader = styled('div')(({ theme }) => ({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: theme.spacing(0, 1),
        // necessary for content to be below app bar
        ...theme.mixins.toolbar,
      }));


    
    const [response, setResponse] = useState([]);
    const [isLoading, setLoading] = useState('ns');


    const updateGmail = () => {
      console.log('update G');

      // ExpenseAPI.getExpenseList().then((res) => {
      //   console.log("Expense List -> ", res[1]);
        
      //   res.forEach((element:any) => {
      //     addExpense(element);
      //   });


      // }).catch((res1) => alert(res1))


      getUnTaggedExpenseList();
      
    }

    

    // useGoogleOneTapLogin({
    //   onSuccess: credentialResponse => {
    //     console.log(credentialResponse);
    //   },
    //   onError: () => {
    //     console.log('Login Failed');
    //   },
    // });


    // useEffect(() => {
      
    // }, []);

    return (
      <Box component="main">
        <DrawerHeader />

        <GoogleLogin
          onSuccess={(credentialResponse: any) => {
            const payload = JSON.stringify({
              type: 'authorized_user',
              client_id: credentialResponse.clientId,
              client_secret: credentialResponse.credential,
              // refresh_token: client.credentials.refresh_token,
            });

            console.log(credentialResponse);

            // getGAuth(payload).then(res => console.log(res));



          }}
          onError={() => {
            console.log('Login Failed');
          }}
        />;
        
        <Row style={{ paddingTop: '4rem'}}>
        {
          isLoading === 'ns' &&
          <div style={{paddingLeft: '9rem', paddingTop: '4rem'}}>
            <span>Update Gmail Data</span>
            <br/>
            <Button 
            style={{
              width: '90px', 
              height: '40px',
              marginTop: '25px',
              marginLeft: '25px',
            }}
              variant={"contained"}
              onClick={() => updateGmail()}
            >
              Update
            </Button>
          </div>

        }

        {
          isLoading === 'loading' &&
          <div style={{paddingLeft: '9rem', paddingTop: '4rem'}}>
            <span>Fetaching Gmail Data</span>
            <br/>
            <CircularProgress style={{marginTop: '1rem'}}  />
          </div>
        }

        {
          isLoading === 'loaded' &&
          response.map((val: string, index: number) => (
            <span key={index}>{val}</span>
          ))
        }

        </Row>
        

      </Box>
    );
};

export default UpdateGmail;