/*
Copyright (C) 2025 Rushikesh <rushikc.dev@gmail.com>

This program is free software; you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the
Free Software Foundation; version 3 of the License.

This program is distributed in the hope that it will be useful, but
WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details, or get a copy at
<https://www.gnu.org/licenses/gpl-3.0.txt>.
*/

import React, {useEffect, useRef, useState} from 'react';
import {Box, Chip, Container, IconButton, Paper, Stack, Typography, useTheme} from '@mui/material';
import {motion} from 'framer-motion';
import {TrendingDown as TrendingDownIcon, TrendingUp as TrendingUpIcon} from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import {ExpenseAPI} from '../../api/ExpenseAPI';
import {sortByKeyDate} from '../../utility/utility';

import Loading from "../../components/Loading";
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import {
  CalculationOption,
  calculationOptions,
  DateRange,
  filterExpensesByDate,
  filterOptions,
  GroupByOption,
  groupByOptions,
} from '../../utility/validations';
import '../home/Home.scss';
import './Insights.scss';
import {Expense} from "../../Types";
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

// Interface for line graph data
interface LineDataPoint {
  date: string;

  [key: string]: string | number;
}

const truncate = (str: string, n: number) => {
  return str.length > n ? str.slice(0, n - 1) + '...' : str;
};

// Insights component
const Insights: React.FC = () => {
  const theme = useTheme();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<DateRange>('30d');

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setLoading(true);
        const expenseResult = await ExpenseAPI.getExpenseList();
        const sortedExpenses = sortByKeyDate(expenseResult, 'date');
        setExpenses(sortedExpenses);
      } catch (error) {
        console.error('Error fetching expenses:', error);
      } finally {
        setLoading(false);
      }
    };

    void fetchExpenses();
  }, []);

  // Filter expenses based on selected time range
  const getFilteredExpenses = () => filterExpensesByDate(expenses, timeRange);

  // Calculate total spending
  const getTotalSpending = () => {
    const filtered = getFilteredExpenses();
    console.log("Total spending Filtered Expenses: ", filtered);
    return filtered.reduce((sum, expense) => sum + Number(expense.cost), 0).toFixed(2);
  };

  // Calculate average monthly spending
  const getAverageMonthlySpending = () => {
    const filtered = getFilteredExpenses();
    if (filtered.length === 0) return '0.00';

    // Check if the time range is a month or less
    const isMonthOrLess = timeRange === '7d' || timeRange === '30d';
    if (isMonthOrLess) {
      return getAverageDailySpending();
    }

    const expensesByMonth = new Map<string, number>();
    filtered.forEach(expense => {
      const date = new Date(expense.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      const currentTotal = expensesByMonth.get(monthKey) || 0;
      expensesByMonth.set(monthKey, currentTotal + Number(expense.cost));
    });

    const monthlyTotals = Array.from(expensesByMonth.values());

    if (selectedCalculation === 'average') {
      const totalAmount = monthlyTotals.reduce((sum, total) => sum + total, 0);
      const avgAmount = totalAmount / Math.max(monthlyTotals.length, 1);
      return avgAmount.toFixed(2);
    } else { // median
      const sortedTotals = [...monthlyTotals].sort((a, b) => a - b);
      const mid = Math.floor(sortedTotals.length / 2);
      const median = sortedTotals.length % 2 !== 0 ? sortedTotals[mid] : (sortedTotals[mid - 1] + sortedTotals[mid]) / 2;
      return median.toFixed(2);
    }
  };

  // Calculate average daily spending
  const getAverageDailySpending = () => {
    const filtered = getFilteredExpenses();
    if (filtered.length === 0) return '0.00';

    const expensesByDay = new Map<string, number>();
    filtered.forEach(expense => {
      const dayKey = new Date(expense.date).toLocaleDateString();
      const currentTotal = expensesByDay.get(dayKey) || 0;
      expensesByDay.set(dayKey, currentTotal + Number(expense.cost));
    });

    const dailyTotals = Array.from(expensesByDay.values());

    if (selectedCalculation === 'average') {
      const totalAmount = dailyTotals.reduce((sum, total) => sum + total, 0);
      const avgAmount = totalAmount / Math.max(dailyTotals.length, 1);
      return avgAmount.toFixed(2);
    } else { // median
      const sortedTotals = [...dailyTotals].sort((a, b) => a - b);
      const mid = Math.floor(sortedTotals.length / 2);
      const median = sortedTotals.length % 2 !== 0 ? sortedTotals[mid] : (sortedTotals[mid - 1] + sortedTotals[mid]) / 2;
      return median.toFixed(2);
    }
  };

  const [showFilters, setShowFilters] = useState(false);
  const filterPanelRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLDivElement>(null);

  const [showGroupByOptions, setShowGroupByOptions] = useState(false);
  const groupByPanelRef = useRef<HTMLDivElement>(null);
  const groupByButtonRef = useRef<HTMLDivElement>(null);
  const [selectedGroupBy, setSelectedGroupBy] = useState<GroupByOption>('days');
  const [selectedCalculation, setSelectedCalculation] = useState<CalculationOption>('median');

  const toggleFilters = () => {
    setShowFilters(!showFilters);
    if (showGroupByOptions) setShowGroupByOptions(false);
  };

  const toggleGroupByOptions = () => {
    setShowGroupByOptions(!showGroupByOptions);
    if (showFilters) setShowFilters(false);
  };

  const handleRangeChange = (range: DateRange) => {
    setTimeRange(range);
    setShowFilters(false);
  };

  const handleGroupByChange = (option: GroupByOption) => {
    setSelectedGroupBy(option);
    setShowGroupByOptions(false);
  };

  const handleCalculationChange = (option: CalculationOption) => {
    setSelectedCalculation(option);
    setShowGroupByOptions(false);
  };

  const prepareChartData = (
    expenses: Expense[],
    groupBy: GroupByOption,
    calculation: CalculationOption
  ): {
    lineChartData: LineDataPoint[];
    pieChartData: { name: string; value: number }[];
    lineKeys: string[];
  } => {


    if (expenses.length === 0) {
      return {lineChartData: [], pieChartData: [], lineKeys: []};
    }

    console.log("prepareChartData ", calculation);
    const expensesByDate = new Map<string, Expense[]>();
    expenses.forEach(expense => {
      const dateStr = new Date(expense.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      if (!expensesByDate.has(dateStr)) {
        expensesByDate.set(dateStr, []);
      }
      expensesByDate.get(dateStr)!.push(expense);
    });

    if (groupBy === 'days') {
      const lineChartData: LineDataPoint[] = [];
      Array.from(expensesByDate.entries()).forEach(([date, dateExpenses]) => {
        const totalCost = dateExpenses.reduce(
          (sum, exp) => sum + Number(exp.cost),
          0
        );
        lineChartData.push({
          date,
          'Daily Total': totalCost,
        });
      });

      lineChartData.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      return {
        lineChartData,
        pieChartData: [],
        lineKeys: ['Daily Total'],
      };
    }

    const getGroupKey = (expense: Expense): string => {
      if (groupBy === 'vendor') return expense.vendor;
      if (groupBy === 'tags') return expense.tag || 'Untagged';
      if (groupBy === 'cost') return getCostRange(expense.cost);
      return '';
    };

    const groupMetrics = new Map<string, number[]>();

    expenses.forEach(expense => {
      const groupKey = getGroupKey(expense);
      if (groupKey) {
        if (!groupMetrics.has(groupKey)) {
          groupMetrics.set(groupKey, []);
        }
        groupMetrics.get(groupKey)!.push(Number(expense.cost));
      }
    });

    let uniqueGroups = Array.from(groupMetrics.keys());

    // Sort groups by total spend (default)
    uniqueGroups.sort((a, b) => {
      const totalA = groupMetrics.get(a)!.reduce((sum, val) => sum + val, 0);
      const totalB = groupMetrics.get(b)!.reduce((sum, val) => sum + val, 0);
      return totalB - totalA;
    });

    if (groupBy === 'tags') {
      uniqueGroups = uniqueGroups.filter(group => group !== 'Untagged');
    }

    const topGroups = uniqueGroups.slice(0, 3);

    const pieChartData = topGroups.map(group => {
      const values = groupMetrics.get(group) || [0];
      const totalValue = values.reduce((sum, val) => sum + val, 0);
      return {
        name: group,
        value: totalValue,
      };
    });

    const dates = Array.from(expensesByDate.keys()).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );

    const newLineChartData = dates.map((date, index) => {
      const dataPoint: LineDataPoint = {date};

      topGroups.forEach(group => {
        // Get data for the last 7 days for rolling calculation
        const rollingDates = dates.slice(Math.max(0, index - 6), index + 1);
        const groupValues: number[] = [];

        rollingDates.forEach(rollingDate => {
          const dateExpenses = expensesByDate.get(rollingDate) || [];
          dateExpenses.forEach(expense => {
            if (getGroupKey(expense) === group) {
              groupValues.push(Number(expense.cost));
            }
          });
        });

        if (groupValues.length > 0) {
          if (calculation === 'average') {
            dataPoint[group] = groupValues.reduce((sum, val) => sum + val, 0) / groupValues.length;
          } else { // median
            const sortedValues = [...groupValues].sort((a, b) => a - b);
            const mid = Math.floor(sortedValues.length / 2);
            dataPoint[group] = sortedValues.length % 2 !== 0 ? sortedValues[mid] : (sortedValues[mid - 1] + sortedValues[mid]) / 2;
          }
        } else {
          dataPoint[group] = 0;
        }
      });
      return dataPoint;
    });

    return {lineChartData: newLineChartData, pieChartData, lineKeys: topGroups};
  };

  // Helper function to determine cost range bucket
  const getCostRange = (cost: number): string => {
    if (cost <= 100) return '₹0-₹100';
    if (cost <= 500) return '₹100-₹500';
    if (cost <= 1000) return '₹500-₹1000';
    return '₹1000+';
  };

  const [lineChartData, setLineChartData] = useState<LineDataPoint[]>([]);
  const [lineKeys, setLineKeys] = useState<string[]>([]);
  const [pieChartData, setPieChartData] = useState<{ name: string; value: number }[]>([]);

  // Update chart data when filters or grouping changes
  useEffect(() => {
    const filteredExpenses = getFilteredExpenses();
    const {lineChartData, pieChartData, lineKeys} = prepareChartData(
      filteredExpenses,
      selectedGroupBy,
      selectedCalculation
    );

    setLineChartData(lineChartData);
    setPieChartData(pieChartData);
    setLineKeys(lineKeys);
  }, [expenses, timeRange, selectedGroupBy, selectedCalculation]);

  if (isLoading) {
    return <Loading/>;
  }

  // Line colors for the chart
  const lineColors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.error.main,
    theme.palette.success.main,
    theme.palette.warning.main
  ];

  return (
    <Container maxWidth="sm" className="statistics-container">
      <div style={{paddingBottom: 10}}>
        <div className="statistics-header">
          <Typography variant="h5" fontWeight="bold">
            Expense Insights
          </Typography>
        </div>
      </div>

      {/* Summary Cards */}
      {/* Total Spending Card */}
      <motion.div
        initial={{opacity: 0, y: 20}}
        animate={{opacity: 1, y: 0}}
        transition={{duration: 0.3}}
      >
        <Paper className="total-card">
          <Typography variant="subtitle2" color="rgba(255,255,255,0.7)">
            Total Spending
          </Typography>
          <Box>
            <Typography variant="h4" fontSize={22} fontWeight="bold" color="white">
              ₹{getTotalSpending()}
            </Typography>
          </Box>
          <Box>
            <TrendingUpIcon sx={{fontSize: 16, color: 'rgba(255,255,255,0.7)', mr: 0.5}}/>
            <Typography variant="caption" color="rgba(255,255,255,0.7)">
              {filterOptions.find(o => o.id === timeRange)?.label}
            </Typography>
          </Box>
        </Paper>
      </motion.div>

      {/* Averages Row */}
      <Stack direction="row" className="summary-row">
        {/* Daily Average Card */}
        <motion.div
          initial={{opacity: 0, y: 20}}
          animate={{opacity: 1, y: 0}}
          transition={{duration: 0.3, delay: 0.1}}
          style={{flex: 1}}
        >
          <Paper className="daily-card">
            <Typography variant="subtitle2" color="rgba(255,255,255,0.7)">
              Daily Average
            </Typography>
            <Box>
              <Typography variant="h4" fontSize={22} fontWeight="bold" color="white">
                ₹{getAverageDailySpending()}
              </Typography>
            </Box>
            <Box>
              <TrendingDownIcon sx={{fontSize: 16, color: 'rgba(255,255,255,0.7)', mr: 0.5}}/>
              <Typography variant="caption" color="rgba(255,255,255,0.7)">
                Per Day
              </Typography>
            </Box>
          </Paper>
        </motion.div>

        {/* Monthly Average Card */}
        <motion.div
          initial={{opacity: 0, y: 20}}
          animate={{opacity: 1, y: 0}}
          transition={{duration: 0.3, delay: 0.2}}
          style={{flex: 1}}
        >
          <Paper className="monthly-card">
            <Typography variant="subtitle2" color="rgba(255,255,255,0.7)">
              Monthly Average
            </Typography>
            <Box>
              <Typography variant="h4" fontSize={22} fontWeight="bold" color="white">
                ₹{getAverageMonthlySpending()}
              </Typography>
            </Box>
            <Box>
              <TrendingDownIcon sx={{fontSize: 16, color: 'rgba(255,255,255,0.7)', mr: 0.5}}/>
              <Typography variant="caption" color="rgba(255,255,255,0.7)">
                {timeRange === '7d' || timeRange === '30d' ? 'Same as Daily Avg' : 'Per Month'}
              </Typography>
            </Box>
          </Paper>
        </motion.div>
      </Stack>

      {/* Line Graph / Pie Chart based on selected chart type */}
      <Box className="line-chart-container">
        {lineChartData.length > 0 ? (
          <Paper className="chart-paper" elevation={3}>
            <Typography variant="subtitle2" className="chart-title">
              Spending Trends
            </Typography>
            <ResponsiveContainer width="100%" height="95%">
              <LineChart
                data={lineChartData}
                margin={{top: 5, right: 20, left: 10, bottom: 5}}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider}/>
                <XAxis
                  dataKey="date"
                  stroke={theme.palette.text.secondary}
                  tick={{fontSize: 12}}
                  tickLine={{stroke: theme.palette.divider}}
                />
                <YAxis
                  stroke={theme.palette.text.secondary}
                  tick={{fontSize: 12}}
                  tickLine={{stroke: theme.palette.divider}}
                  width={50}
                  tickFormatter={(value) => `₹${value}`}
                  domain={['auto', 'auto']}
                  allowDataOverflow={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: '8px'
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  wrapperStyle={{fontSize: '12px', whiteSpace: 'normal'}}
                  formatter={(value) => truncate(value, 20)}
                />
                {lineKeys.map((key, index) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={lineColors[index % lineColors.length]}
                    activeDot={{r: 8}}
                    strokeWidth={2}
                    dot={{strokeWidth: 2}}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        ) : (
          <Paper className="chart-paper empty-chart" elevation={3}>
            <Typography variant="body1" color="text.secondary">
              No data available for the selected filters
            </Typography>
          </Paper>
        )}
      </Box>

      {/* Pie Chart */}
      {selectedGroupBy !== 'days' && pieChartData.length > 0 && (
        <Box className="pie-chart-container">
          <Paper className="chart-paper" elevation={3}>
            <Typography variant="subtitle2" className="chart-title">
              Group Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={330}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  style={{marginTop: 20}}
                  outerRadius={100}
                  fill={theme.palette.primary.main}
                  label={(entry) => `₹${Math.round(Number(entry.value) || 0)}`}
                >
                  {pieChartData.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={lineColors[index % lineColors.length]}
                    />
                  ))}
                </Pie>
                <Legend
                  verticalAlign="bottom"
                  wrapperStyle={{fontSize: '12px', whiteSpace: 'normal'}}
                  formatter={(value) => truncate(value, 20)}
                />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Box>
      )}

      {/* Floating Filter & Group By Buttons */}
      <div className="buttons-container">
        <div className="filter-button" ref={filterButtonRef} onClick={toggleFilters}>
          <Chip
            icon={<FilterListIcon/>}
            label={filterOptions.find(o => o.id === timeRange)?.label}
            clickable
            color="primary"
          />
        </div>
        <div className="group-by-button" ref={groupByButtonRef} onClick={toggleGroupByOptions}>
          <Chip
            icon={<SortIcon/>}
            label={`Group: ${groupByOptions.find(o => o.id === selectedGroupBy)?.label}`}
            clickable
            color="primary"
          />
        </div>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        show={showFilters}
        onClose={() => setShowFilters(false)}
        selectedRange={timeRange}
        onRangeChange={handleRangeChange}
        panelRef={filterPanelRef}
      />

      {/* Group By Panel */}
      <GroupByPanel
        show={showGroupByOptions}
        onClose={() => setShowGroupByOptions(false)}
        selectedGroupBy={selectedGroupBy}
        selectedCalculation={selectedCalculation}
        onGroupByChange={handleGroupByChange}
        onCalculationChange={handleCalculationChange}
        panelRef={groupByPanelRef}
      />

    </Container>
  );
};

export default Insights;

// Filter Panel Component for Stats
const FilterPanel: React.FC<{
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
        <IconButton size="small" className="close-button" onClick={onClose}>
          <CloseIcon/>
        </IconButton>
      </div>
      <div className="filter-options">
        {filterOptions.map(option => (
          <Chip
            key={option.id}
            label={option.label}
            color="primary"
            variant={selectedRange === option.id ? "filled" : "outlined"}
            onClick={() => onRangeChange(option.id)}
            className="filter-chip"
          />
        ))}
      </div>
    </div>
  );
};

// Group By Panel Component for Stats
const GroupByPanel: React.FC<{
  show: boolean;
  onClose: () => void;
  selectedGroupBy: GroupByOption;
  selectedCalculation: CalculationOption;
  onGroupByChange: (o: GroupByOption) => void;
  onCalculationChange: (o: CalculationOption) => void;
  panelRef: React.RefObject<HTMLDivElement>;
}> = ({show, onClose, selectedGroupBy, selectedCalculation, onGroupByChange, onCalculationChange, panelRef}) => {
  if (!show) return null;
  return (
    <div className="group-by-panel" ref={panelRef}>
      <div className="panel-header">
        <span className="panel-title">Group by</span>
        <IconButton size="small" className="close-button" onClick={onClose}>
          <CloseIcon/>
        </IconButton>
      </div>
      <div className="panel-section">
        <div className="section-title">Group by</div>
        <div className="group-by-options">
          {groupByOptions.map(option => (
            <Chip
              key={option.id}
              label={option.label}
              color="primary"
              variant={selectedGroupBy === option.id ? "filled" : "outlined"}
              onClick={() => onGroupByChange(option.id)}
              className="filter-chip"
            />
          ))}
        </div>
      </div>
      <div className="panel-section">
        <div className="section-title">Calculation</div>
        <div className="group-by-options">
          {calculationOptions.map(option => (
            <Chip
              key={option.id}
              label={option.label}
              color="primary"
              variant={selectedCalculation === option.id ? "filled" : "outlined"}
              onClick={() => onCalculationChange(option.id)}
              className="filter-chip"
            />
          ))}
        </div>
      </div>
    </div>
  );
};
