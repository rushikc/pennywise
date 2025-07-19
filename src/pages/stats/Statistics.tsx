import React, {useEffect, useRef, useState} from 'react';
import { Box, Button, ButtonGroup, Chip, Container, IconButton, Paper, Stack, Typography, useTheme } from '@mui/material';
import {motion} from 'framer-motion';
import { PieChart as PieChartIcon, Timeline as TimelineIcon, TrendingDown as TrendingDownIcon, TrendingUp as TrendingUpIcon } from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import {ExpenseAPI} from '../../api/ExpenseAPI';
import {sortByKeyDate} from '../../utility/utility';

import Loading from "../../components/Loading";
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import { GroupByOption, SortByOption, groupByOptions, sortByOptions } from '../home/validations';
import '../home/Home.scss';

// Interface for expense data
interface Expense {
  id: string;
  cost: number;
  date: string;
  category: string;
  description: string;
  tags?: string[];
}

// Filter options for stats
const statsFilterOptions: { id: string; label: string }[] = [
  { id: 'week', label: 'Last Week' },
  { id: 'month', label: 'Last Month' },
  { id: 'year', label: 'Last Year' },
  { id: 'all', label: 'All Time' },
];

const Statistics: React.FC = () => {
  const theme = useTheme();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month');
  const [chartType, setChartType] = useState('spending');

  // Colors for charts
  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.error.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    '#8884d8',
    '#82ca9d',
    '#ffc658'
  ];

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
  const getFilteredExpenses = () => {
    const now = new Date();
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      if (timeRange === 'week') {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return expenseDate >= oneWeekAgo;
      } else if (timeRange === 'month') {
        const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        return expenseDate >= oneMonthAgo;
      } else if (timeRange === 'year') {
        const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        return expenseDate >= oneYearAgo;
      }
      return true; // Show all if 'all' is selected
    });
  };

  // Generate spending by category data for pie chart
  const getCategoryData = () => {
    const filtered = getFilteredExpenses();
    const categoryMap = new Map<string, number>();

    filtered.forEach(expense => {
      const category = expense.category || 'Uncategorized';
      const currentAmount = categoryMap.get(category) || 0;
      categoryMap.set(category, currentAmount + expense.cost);
    });

    const categoryData = Array.from(categoryMap.entries()).map(([name, value]) => ({
      name,
      value
    }));

    return categoryData.sort((a, b) => b.value - a.value).slice(0, 8); // Top 8 categories
  };

  // Generate daily spending data for line/bar chart
  const getDailySpendingData = () => {
    const filtered = getFilteredExpenses();
    const dailyMap = new Map<string, number>();

    filtered.forEach(expense => {
      const dateStr = new Date(expense.date).toLocaleDateString();
      const currentAmount = dailyMap.get(dateStr) || 0;
      dailyMap.set(dateStr, currentAmount + expense.cost);
    });

    const dailyData = Array.from(dailyMap.entries())
      .map(([date, cost]) => ({
        date,
        cost
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Limit to last 10 days if there are too many
    if (dailyData.length > 10) {
      return dailyData.slice(dailyData.length - 10);
    }

    return dailyData;
  };

  // Calculate total spending
  const getTotalSpending = () => {
    const filtered = getFilteredExpenses();
    // console.log("Filtered Expenses: ", filtered);
    return filtered.reduce((sum, expense) => sum + Number(expense.cost), 0).toFixed(2);
  };

  // Calculate average daily spending
  const getAverageDailySpending = () => {
    const filtered = getFilteredExpenses();
    if (filtered.length === 0) return '0.00';

    const totalAmount = filtered.reduce((sum, expense) => sum + Number(expense.cost), 0);
    const uniqueDates = new Set(filtered.map(expense =>
      new Date(expense.date).toLocaleDateString()
    ));

    const avgAmount = totalAmount / Math.max(uniqueDates.size, 1);
    return avgAmount.toFixed(2);
  };

  const handleChartTypeChange = (type: string) => {
    setChartType(type);
  };

  const [showFilters, setShowFilters] = useState(false);
  const filterPanelRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLDivElement>(null);

  const [showGroupByOptions, setShowGroupByOptions] = useState(false);
  const groupByPanelRef = useRef<HTMLDivElement>(null);
  const groupByButtonRef = useRef<HTMLDivElement>(null);
  const [selectedGroupBy, setSelectedGroupBy] = useState<GroupByOption>('days');
  const [selectedSortBy, setSelectedSortBy] = useState<SortByOption>(null);

  const toggleFilters = () => {
    setShowFilters(!showFilters);
    if (showGroupByOptions) setShowGroupByOptions(false);
  };
  const toggleGroupByOptions = () => {
    setShowGroupByOptions(!showGroupByOptions);
    if (showFilters) setShowFilters(false);
  };
  const handleRangeChange = (id: string) => {
    setTimeRange(id);
    setShowFilters(false);
  };
  const handleGroupByChange = (option: GroupByOption) => {
    setSelectedGroupBy(option);
    setShowGroupByOptions(false);
  };
  const handleSortByChange = (option: SortByOption) => {
    setSelectedSortBy(option);
    setShowGroupByOptions(false);
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Container maxWidth="sm" sx={{ pb: 10, pt: 2 }}>
      <div style={{paddingBottom:10}}>
        <Typography variant="h5" fontWeight="bold">
          Statistics & Insights
        </Typography>
      </div>


      {/* Summary Cards */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{ flex: 1 }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 2,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`
            }}
          >
            <Typography variant="subtitle2" color="rgba(255,255,255,0.7)">
              Total Spending
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', mt: 1 }}>
              <Typography variant="h4" fontSize={22} fontWeight="bold" color="white">
                ₹{getTotalSpending()}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <TrendingUpIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', mr: 0.5 }} />
              <Typography variant="caption" color="rgba(255,255,255,0.7)">
                {timeRange === 'all' ? 'All time' :
                  timeRange === 'year' ? 'Last Year' :
                  timeRange === 'month' ? 'Last Month' : 'Last Week'}
              </Typography>
            </Box>
          </Paper>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          style={{ flex: 1 }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 2,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${theme.palette.secondary.dark} 0%, ${theme.palette.secondary.main} 100%)`
            }}
          >
            <Typography variant="subtitle2" color="rgba(255,255,255,0.7)">
              Daily Average
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', mt: 1 }}>
              <Typography variant="h4" fontSize={22} fontWeight="bold" color="white">
                ${getAverageDailySpending()}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <TrendingDownIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', mr: 0.5 }} />
              <Typography variant="caption" color="rgba(255,255,255,0.7)">
                Per Day
              </Typography>
            </Box>
          </Paper>
        </motion.div>
      </Stack>

      {/* Chart Type Selector */}
      <Box sx={{ mb: 3 }}>
        <ButtonGroup variant="outlined" fullWidth>
          <Button
            variant={chartType === 'spending' ? 'contained' : 'outlined'}
            onClick={() => handleChartTypeChange('spending')}
            startIcon={<TimelineIcon />}
          >
            Spending
          </Button>
          <Button
            variant={chartType === 'categories' ? 'contained' : 'outlined'}
            onClick={() => handleChartTypeChange('categories')}
            startIcon={<PieChartIcon />}
          >
            Categories
          </Button>
        </ButtonGroup>
      </Box>

      {/* Filter & Group By Controls */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
        <div ref={filterButtonRef}>
          <Chip
            icon={<FilterListIcon />}
            label={statsFilterOptions.find(o => o.id === timeRange)?.label}
            clickable
            onClick={toggleFilters}
          />
        </div>
        <div ref={groupByButtonRef}>
          <Chip
            icon={<SortIcon />}
            label={`Group: ${groupByOptions.find(o => o.id === selectedGroupBy)?.label}`}
            clickable
            onClick={toggleGroupByOptions}
          />
        </div>
      </Box>

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
        selectedSortBy={selectedSortBy}
        onGroupByChange={handleGroupByChange}
        onSortByChange={handleSortByChange}
        panelRef={groupByPanelRef}
      />

    </Container>
  );
};

export default Statistics;

// Filter Panel Component for Stats
const FilterPanel: React.FC<{
  show: boolean;
  onClose: () => void;
  selectedRange: string;
  onRangeChange: (id: string) => void;
  panelRef: React.RefObject<HTMLDivElement>;
}> = ({ show, onClose, selectedRange, onRangeChange, panelRef }) => {
  if (!show) return null;
  return (
    <div className="filter-panel" ref={panelRef}>
      <div className="panel-header">
        <span className="panel-title">Filter by date range</span>
        <IconButton size="small" className="close-button" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </div>
      <div className="filter-options">
        {statsFilterOptions.map(option => (
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
  selectedSortBy: SortByOption;
  onGroupByChange: (o: GroupByOption) => void;
  onSortByChange: (o: SortByOption) => void;
  panelRef: React.RefObject<HTMLDivElement>;
}> = ({ show, onClose, selectedGroupBy, selectedSortBy, onGroupByChange, onSortByChange, panelRef }) => {
  if (!show) return null;
  return (
    <div className="group-by-panel" ref={panelRef}>
      <div className="panel-header">
        <span className="panel-title">Group by</span>
        <IconButton size="small" className="close-button" onClick={onClose}>
          <CloseIcon />
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
        <div className="section-title">Sort by</div>
        <div className="sort-by-options">
          {sortByOptions.map(option => (
            <Chip
              key={option.id}
              label={option.label}
              color="primary"
              variant={selectedSortBy === option.id ? "filled" : "outlined"}
              onClick={() => onSortByChange(option.id)}
              className="filter-chip"
            />
          ))}
        </div>
      </div>
    </div>
  );
};
