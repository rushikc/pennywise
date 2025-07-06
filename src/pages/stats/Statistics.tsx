import React, {useEffect, useState} from 'react';
import {
  Alert,
  Box,
  Button,
  ButtonGroup,
  Container,
  FormControl,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Typography,
  useTheme
} from '@mui/material';
import {motion} from 'framer-motion';
import {
  ArrowBack as BackIcon,
  DateRange as DateRangeIcon,
  PieChart as PieChartIcon,
  Timeline as TimelineIcon,
  TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import {useNavigate} from 'react-router-dom';
import {ExpenseAPI} from '../../api/ExpenseAPI';
import {sortByKeyDate} from '../../utility/utility';

import Loading from "../../components/Loading";

// Interface for expense data
interface Expense {
  id: string;
  cost: number;
  date: string;
  category: string;
  description: string;
  tags?: string[];
}

const Statistics: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
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

  const handleTimeRangeChange = (event: SelectChangeEvent) => {
    setTimeRange(event.target.value);
  };

  const handleChartTypeChange = (type: string) => {
    setChartType(type);
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Container maxWidth="sm" sx={{ pb: 10, pt: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton
          onClick={() => navigate('/dashboard')}
          sx={{ mr: 2, color: theme.palette.primary.main }}
        >
          <BackIcon />
        </IconButton>
        <Typography variant="h5" fontWeight="bold">
          Statistics & Insights
        </Typography>
      </Box>

      {/* Development Notification */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Alert
          severity="info"
          variant="filled"
          sx={{
            mb: 3,
            borderRadius: 2,
            boxShadow: 2,
            '& .MuiAlert-icon': { color: 'white' },
            '& .MuiAlert-message': { fontWeight: 'medium' }
          }}
        >
          Stats page is still under development
        </Alert>
      </motion.div>

      {/* Time Range Selector */}
      <Paper
        elevation={3}
        sx={{ p: 2, mb: 3, borderRadius: 2 }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <DateRangeIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
            <Typography variant="subtitle1">Time Range</Typography>
          </Box>
          <FormControl sx={{ minWidth: 120 }} size="small">
            <Select
              value={timeRange}
              onChange={handleTimeRangeChange}
              displayEmpty
              variant="outlined"
            >
              <MenuItem value="week">Last Week</MenuItem>
              <MenuItem value="month">Last Month</MenuItem>
              <MenuItem value="year">Last Year</MenuItem>
              <MenuItem value="all">All Time</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
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
        </Grid>

        <Grid item xs={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
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
        </Grid>
      </Grid>

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


    </Container>
  );
};

export default Statistics;
