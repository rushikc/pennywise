import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import {Avatar} from '@mui/material';
import {FC, ReactElement} from "react";
import {useSelector} from 'react-redux';
import {Col, Row} from "reactstrap";
import {Expense} from '../api/Types';
import Loading from '../components/Loading';
import {selectExpense, setTagExpense} from '../store/expenseActions';
import {getDateMonth} from '../utility/utility';


const Home: FC<any> = (): ReactElement => {



  const { expenseList, isAppLoading } = useSelector(selectExpense);


  const onSetExpense = (expense: Expense) => {
    setTagExpense(expense);
  }


  const expenseSubList = expenseList.slice(0,50);


  return (
    <div>
      {
        isAppLoading ?
          <Loading />
          :
          expenseSubList.map((val: Expense, ind) => (
            <Row key={ind} style={{ margin: 30 }} onClick={() => onSetExpense(val)}>

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
  );
};

export default Home;