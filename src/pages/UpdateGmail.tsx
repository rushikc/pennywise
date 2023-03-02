// src/pages/Home.tsx

import { Box } from "@mui/material";
import Button from "@mui/material/Button/Button";
import CircularProgress from "@mui/material/CircularProgress/CircularProgress";
import Paper from '@mui/material/Paper';
import { styled } from '@mui/material/styles';
import React, { FC, ReactElement, useState } from "react";
import { Row } from "reactstrap";
import { addExpense } from "../api/BaseApi";
import { ExpenseAPI } from "../api/ExpenseAPI";
import { getDateTimeSecFromISO } from "../utility/utility";



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

    console.log('update G ', getDateTimeSecFromISO('2023-02-26T13:35:05.000Z'));
    // ExpenseAPI.getConfig("gmailLastUpdated").then((res) => {
    //   console.log(res);
    // });
    // ExpenseAPI.addConfig("gmailLastUpdated", 1677079070).then((res) => {
    //   console.log(res);
    // });

    // ExpenseAPI.getExpenseList().then((res) => {
    //   console.log("Expense List -> ", res[1]);
    //   // addExpense(res[1]);
    //   res.forEach((element: any) => {
    //     addExpense(element);
    //   });

    // }).catch((res1) => alert(res1))


  }



  return (
    <Box component="main">
      <DrawerHeader />


      <Row style={{ paddingTop: '4rem' }}>
        {
          isLoading === 'ns' &&
          <div style={{ paddingLeft: '9rem', paddingTop: '4rem' }}>
            <span>Update Gmail Data</span>
            <br />
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
          <div style={{ paddingLeft: '9rem', paddingTop: '4rem' }}>
            <span>Fetaching Gmail Data</span>
            <br />
            <CircularProgress style={{ marginTop: '1rem' }} />
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