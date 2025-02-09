// src/pages/Home.tsx
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import { Avatar } from '@mui/material';
import Paper from '@mui/material/Paper';
import { styled } from '@mui/material/styles';
import { FC, ReactElement, useEffect, useState } from "react";
import { Col, Row } from "reactstrap";
import { ExpenseAPI } from "../api/ExpenseAPI";
import { getDateMonth, sortBy2Key, sortByKey } from '../utility/utility';
import Loading from '../components/Loading';
import { Expense } from '../api/Types';
import TagExpenses from './TagExpenses';
import { useSelector } from 'react-redux';
import { selectExpense } from '../store/expenseActions';


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

  const [expense, setExpense] = useState<Expense | null>(null);
  const [isTagExpense, setTagExpense] = useState<boolean>(false);

  const { expenseList, isAppLoading } = useSelector(selectExpense);


  const tagExpense = (expense: Expense) => {
    console.log("clicked tag")
    setExpense(expense);
    setTagExpense(true);
  }



  return (
    <>
      <div>
        {
          isTagExpense && expense &&
          <TagExpenses expense={expense} />
        }
      </div>
      <div>
        {
          isAppLoading ?
            <Loading />
            :
            expenseList.map((val: Expense, ind) => (
              <Row key={ind} style={{ margin: 30 }} onClick={() => tagExpense(val)}>

                <Avatar style={{ marginTop: 3 }}>
                  <CurrencyRupeeIcon />
                </Avatar>

                <Col>
                  <Row>
                    <Col>
                      <span>{val.vendor.substring(0, 10).toLowerCase()}</span>
                    </Col>
                    <Col className='d-flex justify-content-end mr-2'>
                      <span>₹</span>
                      <span>{val.cost}</span>
                    </Col>
                  </Row>
                  <Row>
                    <span className='font-600 font-12'>{getDateMonth(val.date)}</span>
                  </Row>
                  <Row>
                    <Col>
                      <span className={val.tag ? 'tag-text-red' : 'tag-text-purple-light'}>
                        {val.tag ? val.tag : 'untagged'}
                      </span>
                    </Col>
                  </Row>
                </Col>
              </Row>
            ))
        }
      </div>
    </>
  );
};

export default Home;