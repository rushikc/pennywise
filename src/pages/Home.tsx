import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import {Avatar} from '@mui/material';
import {FC, ReactElement} from "react";
import {useSelector} from 'react-redux';
import {Col, Row} from "reactstrap";
import {Expense} from '../api/Types';
import Loading from '../components/Loading';
import {selectExpense, setTagExpense} from '../store/expenseActions';
import {getDateMonth} from '../utility/utility';
import './PageStyles.scss';

const Home: FC<any> = (): ReactElement => {

  const { expenseList, isAppLoading } = useSelector(selectExpense);

  const onSetExpense = (expense: Expense) => {
    setTagExpense(expense);
  }

  const expenseSubList = expenseList.slice(0,50);

  return (
    <div className="home-root">
      {
        isAppLoading ? (
          <Loading />
        ) : (
          <div className="home-list">
            {expenseSubList.map((val: Expense, ind) => (
              <Row
                key={ind}
                className="expense-row"
                onClick={() => onSetExpense(val)}
              >
                <Avatar className="expense-avatar">
                  <CurrencyRupeeIcon fontSize="inherit" />
                </Avatar>
                <Col>
                  <Row className="expense-row-header">
                    <Col>
                      <span className="vendor-name">
                        {val.vendor.substring(0, 16).toLowerCase()}
                      </span>
                    </Col>
                    <Col xs="auto" className='d-flex justify-content-end mr-2'>
                      <span className="expense-currency">₹</span>
                      <span className="expense-cost">{val.cost}</span>
                    </Col>
                  </Row>
                  <Row className="expense-date-row">
                    <span className="expense-date">{getDateMonth(val.date)}</span>
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
            ))}
          </div>
        )
      }
    </div>
  );
};

export default Home;

