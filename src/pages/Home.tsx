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
  <div style={{ padding: 32, background: '#181a1b', minHeight: '100vh' }}>
    {
      isAppLoading ? (
        <Loading />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 19 }}>
          {expenseSubList.map((val: Expense, ind) => (
            <Row
              key={ind}
              style={{
                background: '#23272a',
                borderRadius: 12,
                boxShadow: '0 1px 6px rgba(0,0,0,0.18)',
                padding: 19,
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'box-shadow 0.2s',
                margin: 0,
                minHeight: 0
              }}
              onClick={() => onSetExpense(val)}
              className="expense-row"
            >
              <Avatar
                style={{
                  marginRight: 14,
                  background: '#263238',
                  color: '#90caf9',
                  width: 38,
                  height: 38,
                  fontSize: 20
                }}
              >
                <CurrencyRupeeIcon fontSize="inherit" />
              </Avatar>
              <Col>
                <Row style={{ alignItems: 'center', marginBottom: 4 }}>
                  <Col>
                    <span style={{
                      fontWeight: 600,
                      fontSize: 14,
                      color: '#e0e0e0',
                      letterSpacing: 0.1
                    }}>
                      {val.vendor.substring(0, 16).toLowerCase()}
                    </span>
                  </Col>
                  <Col xs="auto" className='d-flex justify-content-end mr-2'>
                    <span style={{
                      fontWeight: 700,
                      fontSize: 15,
                      color: '#81c784',
                      marginRight: 2
                    }}>₹</span>
                    <span style={{
                      fontWeight: 700,
                      fontSize: 15,
                      color: '#81c784'
                    }}>{val.cost}</span>
                  </Col>
                </Row>
                <Row style={{ marginBottom: 4 }}>
                  <span style={{
                    fontWeight: 500,
                    fontSize: 10,
                    color: '#b0bec5'
                  }}>{getDateMonth(val.date)}</span>
                </Row>
                <Row>
                  <Col>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '1px 7px',
                      borderRadius: 8,
                      fontSize: 10,
                      fontWeight: 500,
                      background: val.tag ? 'rgba(239,154,154,0.08)' : 'rgba(179,157,219,0.08)',
                      color: val.tag ? '#ef9a9a' : '#b39ddb',
                      border: val.tag ? '1px solid #ef9a9a' : '1px solid #b39ddb',
                      minWidth: 38,
                      justifyContent: 'center',
                      textTransform: 'capitalize',
                    }}>
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






