/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import React, {FC, ReactElement, useEffect, useRef, useState} from 'react';
import {useSelector} from 'react-redux';
import {Container} from 'reactstrap';
import {Box, Card, CardContent, Chip, Fab, IconButton, LinearProgress, Typography} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import dayjs from 'dayjs';
import {AnimatePresence, motion} from 'framer-motion';
import {selectExpense} from '../../store/expenseActions';
import {Budget, BudgetProgress, Expense, MonthYear} from '../../Types';
import Loading from '../../components/Loading';
import EditBudget from './EditBudget';
import './Budget.scss';
import {isEmpty} from '../../utility/utility';


const BudgetPage: FC<Record<string, never>> = (): ReactElement => {

  const {expenseList, budgetList, isAppLoading} = useSelector(selectExpense);
  const [selectedMonth, setSelectedMonth] = useState<MonthYear | null>(null);
  const [budgetProgress, setBudgetProgress] = useState<BudgetProgress[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<'current' | 'last3'>('current');

  // EditBudget modal state
  const [editBudgetOpen, setEditBudgetOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

  // Refs for handling outside clicks
  const filterPanelRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLDivElement>(null);


  // Generate month options for the last 3 years
  const generateMonthOptions = (): MonthYear[] => {
    const options: MonthYear[] = [];
    const currentDate = dayjs();
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    // Generate options for the last 3 years
    for (let yearOffset = 0; yearOffset < 3; yearOffset++) {
      const year = currentDate.year() - yearOffset;
      const startMonth = yearOffset === 0 ? currentDate.month() : 11;

      for (let month = startMonth; month >= 0; month--) {
        options.push({
          month,
          year,
          label: `${monthNames[month]} ${year}`,
          value: `${year}-${String(month + 1).padStart(2, '0')}`
        });
      }
    }

    return options;
  };

  // Filter expenses by selected month
  const filterExpensesByMonth = (expenses: Expense[], monthYear: MonthYear): Expense[] => {
    return expenses.filter(expense => {
      const expenseDate = dayjs(new Date(expense.date));
      return expenseDate.year() === monthYear.year && expenseDate.month() === monthYear.month;
    });
  };

  // Calculate budget progress
  const calculateBudgetProgress = (expenses: Expense[], budgets: Budget[]): BudgetProgress[] => {
    return budgets.map(budget => {
      let spent: number;

      if (budget.tagList.includes('All')) {
        // For 'All' budget, sum all expenses
        spent = expenses
          .filter(expense => expense.costType === 'debit')
          .reduce((sum, expense) => sum + expense.cost, 0);
      } else {
        // For specific tag budgets, sum expenses with matching tags
        console.log('Budget lis ', expenses
          .filter(expense => !isEmpty(expense.tag))
          .filter(expense => expense.costType === 'debit'));

        spent = expenses
          .filter(expense => !isEmpty(expense.tag))
          .filter(expense => expense.costType === 'debit')
          .filter(expense =>
            budget.tagList.some(tag => expense.tag.toLowerCase() === tag.toLowerCase())
          )
          .reduce((sum, expense) => sum + expense.cost, 0);
      }

      const remaining = Math.max(0, budget.amount - spent);
      const percentage = (spent / budget.amount) * 100;

      return {
        budget,
        spent,
        remaining,
        percentage
      };
    });
  };

  // Handle outside clicks to close filter panel and scroll events
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

  // Initialize component
  useEffect(() => {
    const options = generateMonthOptions();

    // Set current month as default
    const currentMonth = dayjs();
    const currentMonthOption = options.find(option =>
      option.month === currentMonth.month() && option.year === currentMonth.year()
    );

    if (currentMonthOption) {
      setSelectedMonth(currentMonthOption);
    }
  }, []);

  // Update filtered expenses and budget progress when data changes
  useEffect(() => {
    if (expenseList.length > 0 && budgetList.length > 0 && selectedMonth) {
      const filtered = filterExpensesByMonth(expenseList, selectedMonth);
      const progress = calculateBudgetProgress(filtered, budgetList);
      setBudgetProgress(progress);
    }
    setLoading(false);
  }, [expenseList, budgetList, selectedMonth]);

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleYearSegmentChange = (yearType: 'current' | 'last3') => {
    setSelectedYear(yearType);
  };

  const handleMonthSelect = (month: MonthYear) => {
    setSelectedMonth(month);
    setShowFilters(false);
  };

  const getProgressColor = (percentage: number): 'success' | 'warning' | 'error' => {
    if (percentage <= 85) return 'success';
    if (percentage <= 100) return 'warning';
    return 'error';
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Handle budget card click to open edit modal
  const handleBudgetCardClick = (budget: Budget) => {
    setSelectedBudget(budget);
    setEditBudgetOpen(true);
  };

  // Handle budget update/delete callbacks
  const handleBudgetUpdated = () => {
    // The store has already been updated by the EditBudget component
    // Recalculate budget progress with the updated budget list and current expenses
    if (expenseList.length > 0 && budgetList.length > 0 && selectedMonth) {
      const filtered = filterExpensesByMonth(expenseList, selectedMonth);
      const progress = calculateBudgetProgress(filtered, budgetList);
      setBudgetProgress(progress);
    }

    // Reset selected budget to clear any stale references
    setSelectedBudget(null);

    // Close the modal if it's still open
    setEditBudgetOpen(false);
  };

  const handleBudgetDeleted = (budgetId: string) => {
    // The store has already been updated by the EditBudget component
    // Recalculate budget progress with the updated budget list (minus deleted budget)
    if (expenseList.length > 0 && budgetList.length > 0 && selectedMonth) {
      // Filter out the deleted budget from current progress
      const updatedProgress = budgetProgress.filter(progress => progress.budget.id !== budgetId);
      setBudgetProgress(updatedProgress);
    }

    // Reset selected budget since it may have been the deleted one
    setSelectedBudget(null);

    // Close the modal if it's still open
    setEditBudgetOpen(false);
  };

  if (isAppLoading || isLoading) {
    return <Loading/>;
  }

  return (
    <Container fluid className="budget-container">
      <div className="page-header">
        <Typography variant="h5" fontWeight="bold">
          Budget Overview
        </Typography>
      </div>

      {/* Budget Cards */}
      <AnimatePresence mode="wait">
        <motion.div
          className="budget-list"
          initial={{opacity: 0}}
          animate={{opacity: 1}}
          transition={{duration: 0.4}}
        >
          {budgetProgress.map((progress, index) => (
            <motion.div
              key={progress.budget.id}
              initial={{opacity: 0, y: 20}}
              animate={{opacity: 1, y: 0}}
              transition={{
                duration: 0.4,
                delay: index * 0.05,
                ease: 'easeOut'
              }}
              whileHover={{
                y: -2,
                transition: {duration: 0.15, ease: 'easeOut'}
              }}
            >
              <Card
                className="budget-card"
                onClick={() => handleBudgetCardClick(progress.budget)}
              >
                <CardContent>
                  <motion.div
                    className="budget-card-header"
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    transition={{delay: index * 0.05 + 0.1, duration: 0.3}}
                  >
                    <Typography variant="h6" className="budget-name">
                      {progress.budget.name}
                    </Typography>
                    <motion.div
                      initial={{opacity: 0}}
                      animate={{opacity: 1}}
                      transition={{delay: index * 0.05 + 0.15, duration: 0.3}}
                    >
                      <Typography variant="body2" className="budget-amount">
                        {formatCurrency(progress.budget.amount)}
                      </Typography>
                    </motion.div>
                  </motion.div>

                  <motion.div
                    className="budget-progress"
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    transition={{delay: index * 0.05 + 0.2, duration: 0.3}}
                  >
                    <Box className="progress-info">
                      <Typography variant="body2" className="spent-amount">
                        Spent: {formatCurrency(progress.spent)}
                      </Typography>
                      <Typography variant="body2" className="remaining-amount">
                        Remaining: {formatCurrency(progress.remaining)}
                      </Typography>
                    </Box>

                    <Box className="progress-bar-container">
                      <motion.div
                        className="progress-bar-wrapper"
                        initial={{scaleX: 0, originX: 0}}
                        animate={{scaleX: 1}}
                        transition={{
                          delay: index * 0.05 + 0.3,
                          duration: 0.6,
                          ease: 'easeOut'
                        }}
                      >
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(100, progress.percentage)}
                          color={getProgressColor(progress.percentage)}
                          className="progress-bar"
                        />
                      </motion.div>
                      <motion.div
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        transition={{delay: index * 0.05 + 0.5, duration: 0.2}}
                      >
                        <Typography variant="body2" className="progress-percentage">
                          {progress.percentage.toFixed(1)}%
                        </Typography>
                      </motion.div>
                    </Box>
                  </motion.div>

                  <motion.div
                    className="budget-tags"
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    transition={{delay: index * 0.05 + 0.4, duration: 0.3}}
                  >
                    {progress.budget.tagList.map((tag, tagIndex) => (
                      <motion.div
                        key={tagIndex}
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        transition={{
                          delay: index * 0.05 + 0.5 + tagIndex * 0.02,
                          duration: 0.2
                        }}
                        whileHover={{
                          scale: 1.02,
                          transition: {duration: 0.1}
                        }}
                        whileTap={{scale: 0.98}}
                      >
                        <Chip
                          label={tag}
                          size="small"
                          variant="outlined"
                          className="tag-chip"
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {budgetProgress.length === 0 && (
        <div className="no-data">
          <Typography variant="h6" color="textSecondary">
            No budget data available
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {selectedMonth ? `No expenses found for ${selectedMonth.label}` : 'Please select a month to view budget progress'}
          </Typography>
        </div>
      )}

      {/* Filter button container at bottom */}
      <div className="buttons-container">
        <div className="filter-button" onClick={toggleFilters} ref={filterButtonRef}>
          <Chip
            icon={<FilterListIcon/>}
            label={selectedMonth ? selectedMonth.label : 'Select Month'}
            color="primary"
            clickable
          />
        </div>
      </div>

      {/* Add Budget button - Positioned independently at bottom right */}
      <div className="add-budget-button">
        <Fab
          color="primary"
          aria-label="add"
          onClick={() => {
            setSelectedBudget(null);
            setEditBudgetOpen(true);
          }}
        >
          <AddIcon/>
        </Fab>
      </div>

      {/* Filter panel */}
      <FilterPanel
        show={showFilters}
        onClose={() => setShowFilters(false)}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onMonthChange={handleMonthSelect}
        onYearSegmentChange={handleYearSegmentChange}
        panelRef={filterPanelRef}
      />

      {/* Edit Budget Modal - Pass selectedBudget to EditBudget component */}
      <EditBudget
        open={editBudgetOpen}
        onClose={() => setEditBudgetOpen(false)}
        budget={selectedBudget}
        onBudgetUpdated={handleBudgetUpdated}
        onBudgetDeleted={handleBudgetDeleted}
      />
    </Container>
  );
};

// Filter Panel Component
const FilterPanel: FC<{
  show: boolean;
  onClose: () => void;
  selectedMonth: MonthYear | null;
  selectedYear: 'current' | 'last3';
  onMonthChange: (month: MonthYear) => void;
  onYearSegmentChange: (yearType: 'current' | 'last3') => void;
  panelRef: React.RefObject<HTMLDivElement>;
}> = ({show, onClose, selectedMonth, onMonthChange, panelRef}) => {
  const currentDate = dayjs();
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  // Initialize with current year and current month selected
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.year());

  // Calculate last 3 years dynamically (2025, 2024, 2023)
  const getLast3Years = () => {
    const currentYear = currentDate.year();
    return [currentYear, currentYear - 1, currentYear - 2];
  };

  // Generate month options for selected year
  const generateMonthOptions = (year: number): MonthYear[] => {
    const options: MonthYear[] = [];

    // Determine how many months to show based on whether it's current year or not
    const maxMonth = year === currentDate.year() ? currentDate.month() : 11;

    for (let month = 0; month <= maxMonth; month++) {
      options.push({
        month,
        year,
        label: `${monthNames[month]} ${year}`, // Changed from just monthNames[month] to include year
        value: `${year}-${String(month + 1).padStart(2, '0')}`
      });
    }

    return options;
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
  };

  const handleMonthChange = (month: MonthYear) => {
    onMonthChange(month);
  };

  const years = getLast3Years();
  const monthOptions = generateMonthOptions(selectedYear);

  if (!show) return null;

  return (
    <div className="group-by-panel" ref={panelRef}>
      <div className="panel-header">
        <span className="panel-title">Filter by date</span>
        <IconButton
          size="small"
          className="close-button"
          onClick={onClose}
        >
          <CloseIcon/>
        </IconButton>
      </div>

      {/* Years section */}
      <div className="panel-section">
        <div className="section-title">Year</div>
        <div className="group-by-options">
          {years.map(year => (
            <Chip
              key={year}
              label={year.toString()}
              color="primary"
              variant={selectedYear === year ? 'filled' : 'outlined'}
              onClick={() => handleYearChange(year)}
              className="filter-chip"
            />
          ))}
        </div>
      </div>

      {/* Months section */}
      <div className="panel-section">
        <div className="section-title">Month</div>
        <div className="group-by-options">
          {monthOptions.map(option => (
            <Chip
              key={option.value}
              label={option.label}
              color="primary"
              variant={selectedMonth?.value === option.value ? 'filled' : 'outlined'}
              onClick={() => handleMonthChange(option)}
              className="filter-chip"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default BudgetPage;
