/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import MergeIcon from '@mui/icons-material/Merge';
import AddIcon from '@mui/icons-material/Add';
import {Avatar, Chip, Fab, IconButton, InputAdornment, TextField, Zoom} from '@mui/material';
import Fade from '@mui/material/Fade';
import CircularProgress from '@mui/material/CircularProgress';
import React, {FC, ReactElement, useCallback, useEffect, useRef, useState} from 'react';
import {useSelector} from 'react-redux';
import {Col, Row} from 'reactstrap';
import {Expense} from '../../Types';
import Loading from '../../components/Loading';
import {
  deleteExpense,
  mergeSaveExpense,
  selectExpense,
  setExpenseList,
  setTagExpense
} from '../../store/expenseActions';
import {formatVendorName, getDateMonth, sortByKey} from '../../utility/utility';
import {
  DateRange,
  filterExpensesByDate,
  filterOptions,
  GroupByOption,
  groupByOptions,
  GroupedExpenses,
  groupExpenses,
  searchExpenses,
  SortByOption,
  sortByOptions
} from '../dataValidations';
import './Home.scss';
import MergeExpenses from './home-views/MergeExpenses';
import AddExpense from './home-views/AddExpense';
import {ExpenseAPI} from '../../api/ExpenseAPI';
import {CreditCard, Sort} from '@mui/icons-material';
import Container from '@mui/material/Container';
import {useLongPress} from '../../hooks/useLongPress';

// Add interface to extend Window type
declare global {
  // noinspection JSUnusedGlobalSymbols
  interface Window {
    scrollTimeout: ReturnType<typeof setTimeout> | undefined;
  }
}


const Home: FC<Record<string, never>> = (): ReactElement => {
  const {expenseList, isAppLoading} = useSelector(selectExpense);
  const [selectedRange, setSelectedRange] = useState<DateRange>('7d');
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [isRegrouping, setIsRegrouping] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilteredExpenses, setDateFilteredExpenses] = useState<Expense[]>([]);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [groupedExpenses, setGroupedExpenses] = useState<GroupedExpenses>({});
  const [collapsedGroups, setCollapsedGroups] = useState<{ [groupKey: string]: boolean }>({});
  const [selectedGroupBy, setSelectedGroupBy] = useState<GroupByOption>('days');
  const [selectedSortBy, setSelectedSortBy] = useState<SortByOption>(null);
  const [showGroupByOptions, setShowGroupByOptions] = useState(false);
  const [allCollapsed, setAllCollapsed] = useState(false);
  const [selectedExpenses, setSelectedExpenses] = useState<Expense[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [showAddExpenseDialog, setShowAddExpenseDialog] = useState(false);

  // Refs for handling outside clicks
  const filterPanelRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLDivElement>(null);
  const groupByPanelRef = useRef<HTMLDivElement>(null);
  const groupByButtonRef = useRef<HTMLDivElement>(null);

  const onSetExpense = (expense: Expense) => setTagExpense(expense);

  // console.log('Expense List STore:', expenseList);

  useEffect(() => {
    setLoading(isAppLoading);
  }, [isAppLoading]);

  const reloadExpenseList = () => {
    setLoading(true);
    ExpenseAPI.getExpenseList()
      .then(expenses => {
        const sortedExpenses = sortByKey(expenses, 'date');
        setExpenseList(sortedExpenses);
        setTimeout(() => setLoading(false), 300);
      })
      .catch(error => {
        console.error('Error reloading expenses:', error);
        setLoading(false);
      });
  };

  const toggleFilters = () => {
    if (selectionMode) return; // Don't show filters in selection mode
    setShowFilters(!showFilters);
    if (showGroupByOptions) setShowGroupByOptions(false);
  };

  const toggleGroupByOptions = () => {
    if (selectionMode) return; // Don't show group options in selection mode
    setShowGroupByOptions(!showGroupByOptions);
    if (showFilters) setShowFilters(false);
  };

  // Toggle expense selection
  const toggleExpenseSelection = (expense: Expense, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent opening the expense details

    if (!selectionMode) {
      // Enter selection mode and select this expense
      setSelectionMode(true);
      setSelectedExpenses([expense]);
      // Hide any open panels
      setShowFilters(false);
      setShowGroupByOptions(false);
    } else {
      // Already in selection mode
      const isSelected = selectedExpenses.some(e => e.id === expense.id);

      if (isSelected) {
        // Deselect this expense
        const newSelected = selectedExpenses.filter(e => e.id !== expense.id);
        setSelectedExpenses(newSelected);

        // If no expenses remain selected, exit selection mode
        if (newSelected.length === 0) {
          setSelectionMode(false);
        }
      } else {
        // Add this expense to selection
        setSelectedExpenses([...selectedExpenses, expense]);
      }
    }
  };

  // Cancel selection mode
  const cancelSelection = useCallback(() => {
    setSelectedExpenses([]);
    setSelectionMode(false);
  }, []);

  // Handle delete selected expenses
  const handleDeleteSelected = async () => {
    if (selectedExpenses.length === 0) return;

    setLoading(true); // Show loading state while deleting

    try {

      // Delete each selected expense using the ExpenseAPI
      const deletePromises = selectedExpenses.map(expense => {
        ExpenseAPI.addExpense(expense, 'delete');
      });

      // Wait for all delete operations to complete
      await Promise.all(deletePromises);

      selectedExpenses.forEach(expense => deleteExpense(expense));

    } catch (error) {
      console.error('Error deleting expenses:', error);
    } finally {
      // setLoading(false);
      cancelSelection();
      setTimeout(reloadExpenseList, 500);
    }
  };

  // Handle merge selected expenses
  const handleMergeSelected = () => {
    if (selectedExpenses.length < 2) return;
    setShowMergeDialog(true); // Show the merge dialog
  };

  // Handle merge completion
  const handleMergeComplete = (mergedExpense: Expense) => {
    // Close the merge dialog
    setShowMergeDialog(false);

    // Update the Redux store directly - more efficient than API call
    mergeSaveExpense(selectedExpenses, mergedExpense);

    // Exit selection mode
    cancelSelection();

    // setTimeout(reloadExpenseList, 500);
  };

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
    // console.log('effect 1', expenseList, selectedRange);
    if (expenseList.length === 0) {
      setDateFilteredExpenses([]);
      return;
    }

    const filtered = filterExpensesByDate(expenseList, selectedRange);
    const sortedExpenses = sortByKey(filtered, 'date');
    setDateFilteredExpenses(sortedExpenses);

    // console.log('Filtered Expenses:', sortedExpenses);

  }, [expenseList, selectedRange]);

  // Apply search filter after date filtering
  useEffect(() => {
    const searchResults = searchExpenses(dateFilteredExpenses, searchTerm);
    setFilteredExpenses(searchResults);
  }, [dateFilteredExpenses, searchTerm]);

  // Group expenses based on selected grouping option
  useEffect(() => {
    if (filteredExpenses.length === 0) {
      setGroupedExpenses({});
      setIsRegrouping(false); // Reset regrouping state
      return;
    }

    const grouped = groupExpenses(filteredExpenses, selectedGroupBy);

    // console.log('Grouped Expenses:', grouped);
    // Initialize collapsed state for new groups
    Object.keys(grouped).forEach(groupKey => {
      setCollapsedGroups(prev => ({
        ...prev,
        [groupKey]: selectedGroupBy !== 'days'
      }));
    });

    setGroupedExpenses(grouped);
    setLoading(false);

    setTimeout(() => {
      setIsRegrouping(false);
    }, 300);

  }, [filteredExpenses, selectedGroupBy, selectedSortBy]);

  // Exit selection mode when search term changes
  useEffect(() => {
    if (searchTerm && selectionMode) {
      cancelSelection();
    }
  }, [searchTerm, cancelSelection, selectionMode]);

  // Toggle collapse state for a group
  const toggleGroupCollapse = (groupKey: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  // Toggle all groups collapse state
  const toggleAllGroupsCollapse = () => {
    const newCollapsedState = !allCollapsed;
    setAllCollapsed(newCollapsedState);

    // Create a new object with all groups set to the same collapse state
    const updatedCollapsedGroups: { [key: string]: boolean } = {};
    Object.keys(groupedExpenses).forEach(key => {
      updatedCollapsedGroups[key] = newCollapsedState;
    });

    setCollapsedGroups(updatedCollapsedGroups);
  };

  // Update allCollapsed state when grouped expenses change
  useEffect(() => {
    if (Object.keys(groupedExpenses).length === 0) {
      setAllCollapsed(false);
      return;
    }

    // Check if all groups are currently collapsed
    const areAllCollapsed = Object.keys(groupedExpenses).every(
      key => collapsedGroups[key]
    );

    setAllCollapsed(areAllCollapsed);
  }, [groupedExpenses, collapsedGroups]);

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

  // Handle clicks outside group by panel and scroll events
  useEffect(() => {
    if (!showGroupByOptions) return; // Skip if options not shown

    const handleClickOutside = (event: MouseEvent) => {
      if (
        groupByPanelRef.current &&
        groupByButtonRef.current &&
        !groupByPanelRef.current.contains(event.target as Node) &&
        !groupByButtonRef.current.contains(event.target as Node)
      ) {
        setShowGroupByOptions(false);
      }
    };

    const handleScroll = () => setShowGroupByOptions(false);

    // Add and clean up event listeners
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [showGroupByOptions]);

  // Handle range selection
  const handleRangeChange = (range: DateRange) => {
    setSelectedRange(range);
    setShowFilters(false);
  };

  // Handle group by option selection
  const handleGroupByChange = (option: GroupByOption) => {
    setIsRegrouping(true);
    if (option === 'days' && selectedSortBy !== null) {
      setSelectedGroupBy(option);
      setSelectedSortBy('date');
    } else {
      setSelectedGroupBy(option);
      setSelectedSortBy('count');
    }
    setShowGroupByOptions(false);
  };

  // Handle sort by option selection
  const handleSortByChange = (option: SortByOption) => {
    console.log('Option selected:', option);
    if (option !== selectedSortBy) {
      setIsRegrouping(true);
      setSelectedSortBy(option);
      setShowGroupByOptions(false);
    } else {
      setSelectedSortBy(null);
    }

  };

  // Render expense item
  const renderExpenseItem = (expense: Expense, index: number) => {
    const isSelected = selectedExpenses.some(e => e.id === expense.id);

    return (
      <ExpenseItem
        key={index}
        expense={expense}
        isSelected={isSelected}
        selectionMode={selectionMode}
        onSelect={toggleExpenseSelection}
        onView={onSetExpense}
      />
    );
  };

  // Render a group section
  const renderGroupSection = (groupKey: string, groupData: GroupedExpenses[string]) => {
    const isCollapsed = collapsedGroups[groupKey] || false;

    return (
      <div key={groupKey} className={`group-box ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="group-header" onClick={() => toggleGroupCollapse(groupKey)}>
          <div className="group-title">
            <span className="group-label">
              {
                selectedGroupBy === 'days' ? groupData.groupLabel : groupData.groupLabel.toLowerCase()
              }
            </span>
            <span
              className="expense-count">{groupData.expenses.length} expense{groupData.expenses.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="group-summary">
            <span className="total-amount">₹{groupData.totalAmount.toFixed(0)}</span>
            <IconButton className={`collapse-button ${isCollapsed ? 'collapsed' : ''}`}>
              {isCollapsed ? <KeyboardArrowDownIcon/> : <KeyboardArrowDownIcon/>}
            </IconButton>
          </div>
        </div>

        <div className={`group-expenses ${isCollapsed ? 'collapsing' : ''}`}>
          {!isCollapsed && groupData.expenses.map((expense, index) => renderExpenseItem(expense, index))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <Loading/>;
  }

  return (
    <Container maxWidth="sm" className="home-root">
      {/* Loading overlay for regrouping */}
      <Fade in={isRegrouping} timeout={100} unmountOnExit>
        <div className="regrouping-overlay">
          <CircularProgress color="primary"/>
        </div>
      </Fade>

      <div className="search-container">
        <TextField
          fullWidth
          placeholder="Search expenses..."
          value={searchTerm}
          onChange={handleSearchChange}
          variant="outlined"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon/>
                </InputAdornment>
              ),
            },
          }}
        />
      </div>

      <div className="home-list">
        {filteredExpenses.length === 0 ? (
          <div className="no-expenses">
            {searchTerm ? 'No matching expenses found' : 'No expenses found for selected period'}
          </div>
        ) : (
          Object.entries(groupedExpenses)
            .sort(([keyA, groupDataA], [keyB, groupDataB]) => {

              if (selectedGroupBy === 'days' &&
                (selectedSortBy === 'date' || selectedSortBy == null))
                return keyB.localeCompare(keyA);

              return selectedSortBy === 'cost' ?
                groupDataB.totalAmount - groupDataA.totalAmount :
                groupDataB.expenses.length - groupDataA.expenses.length;
            })
            .map(([groupKey, groupData]) => renderGroupSection(groupKey, groupData))
        )}
      </div>

      {/* Button containers */}
      <div className="buttons-container">
        {!selectionMode ? (
          <>
            {/* Filter button */}
            <div className="filter-button" onClick={toggleFilters} ref={filterButtonRef}>
              <Chip
                icon={<FilterListIcon/>}
                label={filterOptions.find(option => option.id === selectedRange)?.label}
                color="primary"
                clickable
              />
            </div>

            {/* Add Expense button*/}
            <div>
              <Fab
                color="secondary"
                className="add-expense-button"
                size="large"
                aria-label="add expense"
                onClick={() => {
                  setSelectionMode(false);
                  setShowAddExpenseDialog(true);
                }}
              >
                <AddIcon/>
              </Fab>
            </div>

            {/* Group by button */}
            <div className="group-by-button" onClick={toggleGroupByOptions} ref={groupByButtonRef}>
              <Chip
                icon={<Sort/>}
                label={'Group: ' + groupByOptions.find(option => option.id === selectedGroupBy)?.label}
                color="primary"
                clickable
              />
            </div>
          </>
        ) : (
          <>
            {/* Selected count display */}
            <div className="selected-count-display">
              <span>{selectedExpenses.length} {selectedExpenses.length === 1 ? 'expense' : 'expenses'} selected</span>
            </div>

            {/* Cancel button */}
            <div className="action-button">
              <Chip
                icon={<CloseIcon fontSize="small"/>}
                label="Clear"
                color="warning"
                clickable
                onClick={cancelSelection}
              />
            </div>

            {/* Delete button */}
            <div className="action-button">
              <Chip
                icon={<DeleteIcon fontSize="small"/>}
                label="Delete"
                color="error"
                clickable
                onClick={handleDeleteSelected}
              />
            </div>

            {/* Merge button */}
            <div className="action-button">
              <Chip
                icon={<MergeIcon fontSize="small"/>}
                label="Merge"
                color="primary"
                clickable
                onClick={handleMergeSelected}
                disabled={selectedExpenses.length < 2}
              />
            </div>
          </>
        )}
      </div>

      {/* Filter panel */}
      <FilterPanel
        show={showFilters && !selectionMode}
        onClose={() => setShowFilters(false)}
        selectedRange={selectedRange}
        onRangeChange={handleRangeChange}
        panelRef={filterPanelRef}
      />

      {/* Group by panel */}
      <GroupByPanel
        show={showGroupByOptions && !selectionMode}
        onClose={() => setShowGroupByOptions(false)}
        selectedGroupBy={selectedGroupBy}
        selectedSortBy={selectedSortBy}
        onGroupByChange={handleGroupByChange}
        onSortByChange={handleSortByChange}
        panelRef={groupByPanelRef}
      />

      {/* Scroll to top button */}
      <Zoom in={showScrollTop}>
        <Fab
          color="primary"
          size="medium"
          aria-label="scroll back to top"
          onClick={scrollToTop}
          className="scroll-top-button"
        >
          <KeyboardArrowUpIcon/>
        </Fab>
      </Zoom>

      {/* Collapse all button - only show when we have expenses and not in selection mode */}
      {filteredExpenses.length > 0 && !selectionMode && (
        <Fab
          color="primary"
          size="medium"
          aria-label={allCollapsed ? 'expand all groups' : 'collapse all groups'}
          onClick={toggleAllGroupsCollapse}
          className="collapse-all-button"
        >
          {allCollapsed ? <UnfoldMoreIcon/> : <UnfoldLessIcon/>}
        </Fab>
      )}

      {/* Merge expenses dialog - only show in selection mode and when merge dialog is triggered */}
      <MergeExpenses
        open={showMergeDialog}
        onClose={() => setShowMergeDialog(false)}
        expenses={selectedExpenses}
        onMergeComplete={handleMergeComplete}
      />

      {/* Add expense dialog - only show when add expense dialog is triggered */}
      <AddExpense
        open={showAddExpenseDialog}
        onClose={() => setShowAddExpenseDialog(false)}
      />
    </Container>
  );
};


// Filter Panel Component
const FilterPanel: FC<{
  show: boolean;
  onClose: () => void;
  selectedRange: DateRange;
  onRangeChange: (range: DateRange) => void;
  panelRef: React.RefObject<HTMLDivElement>;
}> = ({show, onClose, selectedRange, onRangeChange, panelRef}) => {
  if (!show) return null;

  return (
    <div className="filter-panel" ref={panelRef}>
      <div className="panel-header">
        <span className="panel-title">Filter by date range</span>
        <IconButton
          size="small"
          className="close-button"
          onClick={onClose}
        >
          <CloseIcon/>
        </IconButton>
      </div>
      <div className="filter-options">
        {filterOptions.map(option => (
          <Chip
            key={option.id}
            label={option.label}
            color="primary"
            variant={selectedRange === option.id ? 'filled' : 'outlined'}
            onClick={() => onRangeChange(option.id)}
            className="filter-chip"
          />
        ))}
      </div>
    </div>
  );
};

// Group By Panel Component
const GroupByPanel: FC<{
  show: boolean;
  onClose: () => void;
  selectedGroupBy: GroupByOption;
  selectedSortBy: SortByOption;
  onGroupByChange: (option: GroupByOption) => void;
  onSortByChange: (option: SortByOption) => void;
  panelRef: React.RefObject<HTMLDivElement>;
}> = ({show, onClose, selectedGroupBy, selectedSortBy, onGroupByChange, onSortByChange, panelRef}) => {
  if (!show) return null;

  return (
    <div className="group-by-panel" ref={panelRef}>
      <div className="panel-header">
        <span className="panel-title">Expense Options</span>
        <IconButton
          size="small"
          className="close-button"
          onClick={onClose}
        >
          <CloseIcon/>
        </IconButton>
      </div>

      {/* Group by section */}
      <div className="panel-section">
        <div className="section-title">Group by</div>
        <div className="group-by-options">
          {
            groupByOptions.map(option => (
              <Chip
                key={option.id}
                label={option.label}
                color="primary"
                variant={selectedGroupBy === option.id ? 'filled' : 'outlined'}
                onClick={() => onGroupByChange(option.id)}
                className="filter-chip"
              />
            ))
          }
        </div>
      </div>

      {/* Sort by section */}
      <div className="panel-section">
        <div className="section-title">Sort by</div>
        <div className="sort-by-options">
          {sortByOptions.map(option => (
            <Chip
              key={option.id}
              label={option.label}
              color="primary"
              variant={selectedSortBy === option.id ? 'filled' : 'outlined'}
              onClick={() => onSortByChange(option.id)}
              className="filter-chip"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// ExpenseItem Component - Separated to properly use hooks
const ExpenseItem: FC<{
  expense: Expense;
  isSelected: boolean;
  selectionMode: boolean;
  onSelect: (expense: Expense, e: React.MouseEvent) => void;
  onView: (expense: Expense) => void;
}> = ({expense, isSelected, selectionMode, onSelect, onView}) => {

  // Create a minimal synthetic event object once instead of recreating it in each handler
  const createSyntheticEvent = useCallback(() => {
    return {
      stopPropagation: () => { /* intentionally empty for synthetic event */
      }
    } as React.MouseEvent;
  }, []);

  // Handle long press on expense row - activates selection mode
  const handleLongPress = useCallback(() => {
    onSelect(expense, createSyntheticEvent());
  }, [expense, onSelect, createSyntheticEvent]);

  // Handle regular click - either selects in selection mode or views details
  const handleClick = useCallback(() => {
    if (selectionMode) {
      onSelect(expense, createSyntheticEvent());
    } else {
      onView(expense);
    }
  }, [expense, selectionMode, onSelect, onView, createSyntheticEvent]);

  // Setup long press gesture handlers
  const longPressHandlers = useLongPress(handleLongPress, handleClick, {delay: 500});


  return (
    <Row
      className={`expense-row ${isSelected ? 'selected' : ''}`}
      {...longPressHandlers}
    >
      <Col xs="auto" className="avatar-col">
        <Avatar className={`expense-avatar ${isSelected ? 'selected' : ''}`}>
          {isSelected ?
            <CheckCircleIcon fontSize="inherit"/> :
            expense.type === 'credit-card' ?
              <CreditCard fontSize="inherit"/> :
              <CurrencyRupeeIcon fontSize="inherit"/>
          }
        </Avatar>
      </Col>
      <Col className="content-col">
        <Row className="expense-row-header">
          <Col className="vendor-name-col">
            <span className="vendor-name">{formatVendorName(expense.vendor)[0]}</span>
          </Col>
          <Col xs="auto" className="expense-cost-col">
            <span className="expense-type">
              {expense.costType === 'debit' ? '' : '+'}
            </span>
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
};

export default Home;

