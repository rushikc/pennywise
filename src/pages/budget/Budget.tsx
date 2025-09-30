/*
Copyright (C) 2025 <rushikc> <rushikc.dev@gmail.com>

This program is free software; you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the
Free Software Foundation; version 3 of the License.

This program is distributed in the hope that it will be useful, but
WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details, or get a copy at
<https://www.gnu.org/licenses/gpl-3.0.txt>.
*/

import React, {FC, ReactElement, useEffect, useRef, useState} from 'react';
import {useSelector} from 'react-redux';
import {Col, Container, Row} from 'reactstrap';
import {Box, Card, CardContent, Chip, Fade, IconButton, LinearProgress, Typography} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';
import dayjs from 'dayjs';
import {selectExpense} from '../../store/expenseActions';
import {Budget, BudgetProgress, Expense, MonthYear} from '../../Types';
import Loading from '../../components/Loading';
import './Budget.scss';
import {isEmpty} from '../../utility/utility';

const budgetList: Budget[] = [
  {
    'id': '1234567890abcdef',
    'name': 'Total',
    'amount': 50000,
    'tagList': ['All'],
  },
  {
    'id': '1234567890abcded',
    'name': 'Food',
    'amount': 20000,
    'tagList': ['food', 'groceries', 'snacks']
  },
  {
    'id': '1234567890abcdej',
    'name': 'Travel',
    'amount': 10000,
    'tagList': ['transport'],
  }
];

const BudgetPage: FC<Record<string, never>> = (): ReactElement => {
  const {expenseList, isAppLoading} = useSelector(selectExpense);
  const [selectedMonth, setSelectedMonth] = useState<MonthYear | null>(null);
  const [budgetProgress, setBudgetProgress] = useState<BudgetProgress[]>([]);
  const [monthOptions, setMonthOptions] = useState<MonthYear[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setLoading] = useState(true);

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

  // Handle outside clicks to close filter panel
  useEffect(() => {
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

    if (showFilters) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilters]);

  // Initialize component
  useEffect(() => {
    const options = generateMonthOptions();
    setMonthOptions(options);

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
    if (expenseList.length > 0 && selectedMonth) {
      const filtered = filterExpensesByMonth(expenseList, selectedMonth);
      const progress = calculateBudgetProgress(filtered, budgetList);
      setBudgetProgress(progress);
    }
    setLoading(false);
  }, [expenseList, selectedMonth]);

  const handleMonthSelect = (month: MonthYear) => {
    setSelectedMonth(month);
    setShowFilters(false);
  };

  const getProgressColor = (percentage: number): 'success' | 'warning' | 'error' => {
    if (percentage <= 50) return 'success';
    if (percentage <= 80) return 'warning';
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

  if (isAppLoading || isLoading) {
    return <Loading/>;
  }

  return (
    <Container fluid className="budget-container">
      <div className="budget-header">
        <Row className="align-items-center mb-3">
          <Col>
            <div className="d-flex align-items-baseline gap-3">
              <Typography variant="h4" className="budget-title">
                Budget Overview
              </Typography>
              <Typography variant="subtitle1" className="budget-subtitle">
                {selectedMonth ? selectedMonth.label : 'Select a month'}
              </Typography>
            </div>
          </Col>
          <Col xs="auto">
            <div ref={filterButtonRef}>
              <IconButton
                onClick={() => setShowFilters(!showFilters)}
                className="filter-button"
                color="primary"
              >
                <FilterListIcon/>
              </IconButton>
            </div>
          </Col>
        </Row>

        {/* Filter Panel */}
        <Fade in={showFilters}>
          <div className="filter-panel" ref={filterPanelRef}>
            <div className="filter-header">
              <Typography variant="h6">Filter by Month</Typography>
              <IconButton
                size="small"
                onClick={() => setShowFilters(false)}
                className="close-button"
              >
                <CloseIcon/>
              </IconButton>
            </div>

            <div className="filter-content">
              <div className="month-grid">
                {monthOptions.map((month) => (
                  <Chip
                    key={month.value}
                    label={month.label}
                    onClick={() => handleMonthSelect(month)}
                    variant={selectedMonth?.value === month.value ? 'filled' : 'outlined'}
                    color={selectedMonth?.value === month.value ? 'primary' : 'default'}
                    className="month-chip"
                  />
                ))}
              </div>
            </div>
          </div>
        </Fade>
      </div>

      {/* Budget Cards */}
      <div className="budget-list">
        {budgetProgress.map((progress) => (
          <Card key={progress.budget.id} className="budget-card">
            <CardContent>
              <div className="budget-card-header">
                <Typography variant="h6" className="budget-name">
                  {progress.budget.name}
                </Typography>
                <Typography variant="body2" className="budget-amount">
                  {formatCurrency(progress.budget.amount)}
                </Typography>
              </div>

              <div className="budget-progress">
                <Box className="progress-info">
                  <Typography variant="body2" className="spent-amount">
                    Spent: {formatCurrency(progress.spent)}
                  </Typography>
                  <Typography variant="body2" className="remaining-amount">
                    Remaining: {formatCurrency(progress.remaining)}
                  </Typography>
                </Box>

                <Box className="progress-bar-container">
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, progress.percentage)}
                    color={getProgressColor(progress.percentage)}
                    className="progress-bar"
                  />
                  <Typography variant="body2" className="progress-percentage">
                    {progress.percentage.toFixed(1)}%
                  </Typography>
                </Box>
              </div>

              <div className="budget-tags">
                {progress.budget.tagList.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    size="small"
                    variant="outlined"
                    className="tag-chip"
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
    </Container>
  );
};

export default BudgetPage;
