import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import {Avatar, Chip, InputAdornment, TextField, Fab, Zoom} from '@mui/material';
import {FC, ReactElement, useEffect, useRef, useState} from "react";
import {useSelector} from 'react-redux';
import {Col, Row} from "reactstrap";
import {Expense} from '../api/Types';
import Loading from '../components/Loading';
import {selectExpense, setTagExpense} from '../store/expenseActions';
import {getDateMonth, sortByKeyDate} from '../utility/utility';
import './Home.scss';
import dayjs from 'dayjs';

// Add interface to extend Window type
declare global {
  interface Window {
    scrollTimeout: ReturnType<typeof setTimeout> | undefined;
  }
}

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
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilteredExpenses, setDateFilteredExpenses] = useState<Expense[]>([]);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Refs for handling outside clicks
  const filterPanelRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLDivElement>(null);

  const onSetExpense = (expense: Expense) => setTagExpense(expense);
  const toggleFilters = () => setShowFilters(!showFilters);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Handle scroll events to show/hide scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      // Show button when user scrolls down 300px
      setShowScrollTop(window.scrollY > 300);

      // Add scrolling class to body during scroll
      document.body.classList.add('scrolling');

      // Clear previous timeout if it exists
      if (window.scrollTimeout) {
        clearTimeout(window.scrollTimeout);
      }

      // Set timeout to remove scrolling class after scrolling stops
      window.scrollTimeout = setTimeout(() => {
        document.body.classList.remove('scrolling');
      }, 300); // Remove class after 300ms of scroll inactivity
    };

    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);

    // Cleanup function to remove event listener
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (window.scrollTimeout) {
        clearTimeout(window.scrollTimeout);
      }
    };
  }, []);

  // Filter expenses based on selected date range
  useEffect(() => {
    if (expenseList.length === 0) {
      setDateFilteredExpenses([]);
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

    const sortedExpenses = sortByKeyDate(filtered, 'date');
    setDateFilteredExpenses(sortedExpenses);

  }, [expenseList, selectedRange]);

  // Apply search filter after date filtering
  useEffect(() => {
    if (searchTerm.trim() === '') {
      // If no search term, show all date-filtered expenses
      setFilteredExpenses(dateFilteredExpenses);
      return;
    }

    const searchTermLower = searchTerm.toLowerCase();
    const searchResults = dateFilteredExpenses.filter(expense => {
      return (
        expense.vendor.toLowerCase().includes(searchTermLower) ||
        expense.cost.toString().includes(searchTermLower) ||
        (expense.tag && expense.tag.toLowerCase().includes(searchTermLower))
      );
    });

    setFilteredExpenses(searchResults);
  }, [dateFilteredExpenses, searchTerm]);

  // Handle search input changes
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

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
          <div className="search-container">
            <TextField
              fullWidth
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={handleSearchChange}
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon className="search-icon" />
                  </InputAdornment>
                ),
                className: "search-input"
              }}
            />
          </div>

          <div className="home-list">
            {filteredExpenses.length === 0 ? (
              <div className="no-expenses">
                {searchTerm ? "No matching expenses found" : "No expenses found for selected period"}
              </div>
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

          {/* Scroll to top button */}
          <Zoom in={showScrollTop}>
            <Fab
              color="primary"
              size="medium"
              aria-label="scroll back to top"
              onClick={scrollToTop}
              className="scroll-top-button"
            >
              <KeyboardArrowUpIcon />
            </Fab>
          </Zoom>
        </>
      )}
    </div>
  );
};

export default Home;

