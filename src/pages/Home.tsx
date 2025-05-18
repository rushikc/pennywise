import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import FilterListIcon from '@mui/icons-material/FilterList';
import { Avatar, Chip } from '@mui/material';
import { FC, ReactElement, useState, useEffect, useRef } from "react";
import { useSelector } from 'react-redux';
import { Col, Row } from "reactstrap";
import { Expense } from '../api/Types';
import Loading from '../components/Loading';
import { selectExpense, setTagExpense } from '../store/expenseActions';
import { getDateMonth } from '../utility/utility';
import './Home.scss';
import dayjs from 'dayjs';

// Define date range options
type DateRange = '1d' | '7d' | '14d' | '30d';

const filterOptions: {id: DateRange, label: string}[] = [
  { id: '1d', label: '1 Day' },
  { id: '7d', label: '7 Days' },
  { id: '14d', label: '2 Weeks' },
  { id: '30d', label: '1 Month' },
];

const Home: FC<any> = (): ReactElement => {
  const { expenseList, isAppLoading } = useSelector(selectExpense);
  const [selectedRange, setSelectedRange] = useState<DateRange>('7d');
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Refs for handling outside clicks
  const filterPanelRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLDivElement>(null);

  const onSetExpense = (expense: Expense) => setTagExpense(expense);
  const toggleFilters = () => setShowFilters(!showFilters);

  // Filter expenses based on selected date range
  useEffect(() => {
    if (expenseList.length === 0) {
      setFilteredExpenses([]);
      return;
    }

    const now = dayjs();
    let startDate: dayjs.Dayjs;

    switch(selectedRange) {
      case '1d': startDate = now.subtract(1, 'day'); break;
      case '7d': startDate = now.subtract(7, 'day'); break;
      case '14d': startDate = now.subtract(14, 'day'); break;
      case '30d': startDate = now.subtract(30, 'day'); break;
      default: startDate = now.subtract(7, 'day');
    }

    const filtered = expenseList.filter(expense => {
      const expenseDate = dayjs(expense.date);
      return expenseDate.isAfter(startDate) || expenseDate.isSame(startDate, 'day');
    });

    setFilteredExpenses(filtered);
  }, [expenseList, selectedRange]);

  // Handle clicks outside filter panel and scroll events
  useEffect(() => {
    if (!showFilters) return; // Skip if filters not shown

    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterPanelRef.current &&
        filterButtonRef.current &&
        !filterPanelRef.current.contains(event.target as Node) &&
        !filterButtonRef.current.contains(event.target as Node)
      ) {
        setShowFilters(false);
      }
    };

    const handleScroll = () => setShowFilters(false);

    // Add and clean up event listeners
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [showFilters]);

  // Handle range selection
  const handleRangeChange = (range: DateRange) => {
    setSelectedRange(range);
    setShowFilters(false);
  };

  // Render expense item
  const renderExpenseItem = (expense: Expense, index: number) => (
    <Row key={index} className="expense-row" onClick={() => onSetExpense(expense)}>
      <Avatar className="expense-avatar">
        <CurrencyRupeeIcon fontSize="inherit" />
      </Avatar>
      <Col>
        <Row className="expense-row-header">
          <Col>
            <span className="vendor-name">{expense.vendor.toLowerCase()}</span>
          </Col>
          <Col xs="auto" className='d-flex justify-content-end mr-2'>
            <span className="expense-currency">₹</span>
            <span className="expense-cost">{expense.cost}</span>
          </Col>
        </Row>
        <Row className="expense-date-row">
          <span className="expense-date">{getDateMonth(expense.date)}</span>
        </Row>
        <Row>
          <Col>
            <span className={expense.tag ? 'tag-text-red' : 'tag-text-purple-light'}>
              {expense.tag ? expense.tag : 'untagged'}
            </span>
          </Col>
        </Row>
      </Col>
    </Row>
  );

  return (
    <div className="home-root">
      {isAppLoading ? (
        <Loading />
      ) : (
        <>
          <div className="home-list">
            {filteredExpenses.length === 0 ? (
              <div className="no-expenses">No expenses found for selected period</div>
            ) : (
              filteredExpenses.map(renderExpenseItem)
            )}
          </div>

          {/* Filter button */}
          <div className="filter-button" onClick={toggleFilters} ref={filterButtonRef}>
            <Chip
              icon={<FilterListIcon />}
              label={filterOptions.find(option => option.id === selectedRange)?.label}
              color="primary"
              clickable
            />
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="filter-panel" ref={filterPanelRef}>
              <div className="filter-options">
                {filterOptions.map(option => (
                  <Chip
                    key={option.id}
                    label={option.label}
                    color="primary"
                    variant={selectedRange === option.id ? "filled" : "outlined"}
                    onClick={() => handleRangeChange(option.id)}
                    className="filter-chip"
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Home;

