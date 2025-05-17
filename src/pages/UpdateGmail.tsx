import {Box} from "@mui/material";
import Button from "@mui/material/Button/Button";
import CircularProgress from "@mui/material/CircularProgress/CircularProgress";
import Paper from '@mui/material/Paper';
import {styled} from '@mui/material/styles';
import React, {FC, ReactElement, useState} from "react";
import {Row} from "reactstrap";
import {ExpenseAPI} from "../api/ExpenseAPI";
import {getDateTimeSecFromISO} from "../utility/utility";


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
    

    // ExpenseAPI.getAllDoc('tagMap').then((res: any) => {
    //   console.log("Expense List -> ", res);
    //   console.log("Expense length -> ", res.length);
      
    // }).catch((res1) => alert(res1))

    let tags = [
      {
        "vendor" : "**6319",
        "tag" : "parents"
      },
      {
        "vendor" : "bharatpe09897685965@yesbankltd",
        "tag" : "snacks"
      },
      {
        "vendor" : "BHARATPE90724815332@yesbankltd",
        "tag" : "snacks"
      },
      {
        "vendor" : "CORNER",
        "tag" : "snacks"
      },
      {
        "vendor" : "EATCLUBBRANDSPRIVATELI",
        "tag" : "food"
      },
      {
        "vendor" : "GREEN",
        "tag" : "alcohol"
      },
      {
        "vendor" : "KOBE",
        "tag" : "food"
      },
      {
        "vendor" : "mab0450001a0061446@yesbank",
        "tag" : "food"
      },
      {
        "vendor" : "mab0450001a0061447@yesbank",
        "tag" : "food"
      },
      {
        "vendor" : "paytm-62454355@paytm",
        "tag" : "food"
      },
      {
        "vendor" : "paytmqr2810050501011dsl76x3njqi@paytm",
        "tag" : "snacks"
      },
      {
        "vendor" : "paytmqr2810050501011td33djpjve3@paytm",
        "tag" : "snacks"
      },
      {
        "vendor" : "paytmqr2810050501011u8l4cw7fokm@paytm",
        "tag" : "food"
      },
      {
        "vendor" : "paytmqr281005050101cpbrk2vj6ync@paytm",
        "tag" : "snacks"
      },
      {
        "vendor" : "paytmqr281005050101oryv7wq3xw2s@paytm",
        "tag" : "food"
      },
      {
        "vendor" : "paytmqr281005050101qm3yyqcm91ch@paytm",
        "tag" : "snacks"
      },
      {
        "vendor" : "q416942075@ybl",
        "tag" : "veg & fruits"
      },
      {
        "vendor" : "q600813335@ybl",
        "tag" : "food"
      },
      {
        "vendor" : "q804502121@ybl",
        "tag" : "food"
      },
      {
        "vendor" : "q980637884@ybl",
        "tag" : "food"
      },
      {
        "vendor" : "razorpay.2@icici",
        "tag" : "Amenities"
      },
      {
        "vendor" : "SUBWAY",
        "tag" : "food"
      },
      {
        "vendor" : "ZOMATO",
        "tag" : "food"
      }
    ]

    tags.forEach(tag => {
      ExpenseAPI.setOneDoc(tag.vendor, tag, 'tagMap');
    });
    

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