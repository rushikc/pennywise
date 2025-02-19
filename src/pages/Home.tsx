// src/pages/Home.tsx
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import { Avatar } from '@mui/material';
import { FC, ReactElement, useState } from "react";
import { useSelector } from 'react-redux';
import { Col, Row } from "reactstrap";
import { Expense } from '../api/Types';
import Loading from '../components/Loading';
import { selectExpense } from '../store/expenseActions';
import { getDateMonth } from '../utility/utility';
import TagExpenses from './TagExpenses';


const Home: FC<any> = (): ReactElement => {


  const [expense, setExpense] = useState<Expense | null>(null);
  const [isTagExpense, setTagExpense] = useState<boolean>(false);

  const { expenseList, isAppLoading } = useSelector(selectExpense);


  console.log("home tsx")

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