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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {expenseSubList.map((val: Expense, ind) => (
            <Row
              key={ind}
              style={{
                background: '#23272a',
                borderRadius: 16,
                boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
                padding: 24,
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'box-shadow 0.2s',
                margin: 0
              }}
              onClick={() => onSetExpense(val)}
              className="expense-row"
            >
              <Avatar
                style={{
                  marginRight: 20,
                  background: '#263238',
                  color: '#90caf9',
                  width: 48,
                  height: 48,
                  fontSize: 28
                }}
              >
                <CurrencyRupeeIcon fontSize="inherit" />
              </Avatar>
              <Col>
                <Row style={{ alignItems: 'center', marginBottom: 8 }}>
                  <Col>
                    <span style={{
                      fontWeight: 600,
                      fontSize: 18,
                      color: '#e0e0e0'
                    }}>
                      {val.vendor.substring(0, 16).toLowerCase()}
                    </span>
                  </Col>
                  <Col className='d-flex justify-content-end mr-2'>
                    <span style={{
                      fontWeight: 700,
                      fontSize: 20,
                      color: '#81c784',
                      marginRight: 4
                    }}>₹</span>
                    <span style={{
                      fontWeight: 700,
                      fontSize: 20,
                      color: '#81c784'
                    }}>{val.cost}</span>
                  </Col>
                </Row>
                <Row style={{ marginBottom: 8 }}>
                  <span style={{
                    fontWeight: 500,
                    fontSize: 13,
                    color: '#b0bec5'
                  }}>{getDateMonth(val.date)}</span>
                </Row>
                <Row>
                  <Col>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '2px 10px',
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 500,
                      background: val.tag ? 'rgba(239,154,154,0.08)' : 'rgba(179,157,219,0.08)',
                      color: val.tag ? '#ef9a9a' : '#b39ddb',
                      border: val.tag ? '1px solid #ef9a9a' : '1px solid #b39ddb',
                      minWidth: 54,
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

