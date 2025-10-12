/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import React, {useState} from 'react';
import {Box, Button, CircularProgress, Container, IconButton, Paper, Stack, Typography} from '@mui/material';
import {AdapterDayjs} from '@mui/x-date-pickers/AdapterDayjs';
import {DatePicker, LocalizationProvider} from '@mui/x-date-pickers';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import dayjs, {Dayjs} from 'dayjs';
import {ExpenseAPI} from '../../../api/ExpenseAPI';
import {FinanceIndexDB} from '../../../api/FinanceIndexDB';
import {getUnixTimestamp} from '../../../utility/utility';
import {useNavigate} from 'react-router-dom';
import {createTimedAlert} from '../../../store/alertActions';
import './settingViews.scss';

/**
 * ReloadData component allows users to reload expense data
 * either for a specific date or all expenses.
 */
const ReloadData: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
  const [loading, setLoading] = useState(false);

  const handleReloadAll = async () => {
    setLoading(true);
    try {
      console.log('Reloading all expenses');
      await ExpenseAPI.getExpenseList(getUnixTimestamp('2020-01-01'));
      createTimedAlert({type: 'success', message: 'All expenses reloaded successfully.'});
    } catch (error) {
      console.error('Failed to reload all expenses:', error);
      createTimedAlert({type: 'error', message: 'Failed to reload expenses. Please try again later.'});
    } finally {
      setLoading(false);
    }
  };

  const handleReloadSelected = async () => {
    if (!selectedDate) return;

    setLoading(true);
    try {
      console.log('Reloading expenses for:', selectedDate);
      await ExpenseAPI.getExpenseList(getUnixTimestamp(selectedDate.toDate()));
      createTimedAlert({
        type: 'success',
        message: `Expenses for ${dayjs(selectedDate).format('MMM DD, YYYY')} reloaded successfully.`
      });
    } catch (error) {
      console.error('Failed to reload expenses for selected date:', error);
      createTimedAlert({type: 'error', message: 'Failed to reload expenses. Please try again later.'});
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = async () => {
    setLoading(true);
    try {
      await FinanceIndexDB.clearIndexedDBData();
      createTimedAlert({type: 'success', message: 'Cache deleted successfully.'});
    } catch (error) {
      createTimedAlert({type: 'error', message: 'Clearing cache failed.'});
    } finally {
      setLoading(false);
    }
  };

  const DateSpecificSection = () => (
    <Paper elevation={0} className="reload-section-paper">
      <Typography variant="subtitle1" gutterBottom fontWeight="medium" className="section-title">
        Reload Expenses by Date
      </Typography>
      <Box className="date-reload-container">
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Select Date"
            value={selectedDate}
            onChange={(newDate) => setSelectedDate(newDate)}
            slotProps={{
              textField: {
                fullWidth: true,
                size: 'small',
                className: 'reload-date-picker'
              }
            }}
          />
        </LocalizationProvider>
        <Button
          onClick={handleReloadSelected}
          color="primary"
          variant="contained"
          disabled={loading || !selectedDate}
          className="reload-button"
        >
          {loading ?
            <CircularProgress size={24}/> :
            `Reload from ${selectedDate ? dayjs(selectedDate).format('MMM DD, YYYY') : ''}`
          }
        </Button>
      </Box>
    </Paper>
  );

  const ReloadAllSection = () => (
    <Paper elevation={0} className="reload-section-paper">
      <Typography variant="subtitle1" gutterBottom fontWeight="medium" className="section-title">
        Reload All Expenses
      </Typography>
      <Typography variant="body2" className="reload-warning-text">
        Caution: Reloading all expense data from Firebase can be costly. Repeated operations, particularly with
        large
        datasets, may significantly impact your billing due to increased Cloud Reads. Please use this option
        sparingly.
      </Typography>
      <Button
        onClick={handleReloadAll}
        color="error"
        variant="contained"
        disabled={loading}
        className="reload-all-button"
      >
        {loading ? <CircularProgress size={24}/> : 'Reload All Expenses'}
      </Button>
    </Paper>
  );

  const ClearCacheSection = () => (
    <Paper elevation={0} className="reload-section-paper">
      <Typography variant="subtitle1" gutterBottom fontWeight="medium" className="section-title">
        Clear Local Cache (IndexedDB)
      </Typography>
      <Typography variant="body2" className="reload-warning-text">
        Warning: This action completely erases all locally cached data including expenses,
        vendor tags, configurations, and budgets stored in your browser IndexedDB.
        This will force the app to reload all data from Firebase on next use,
      </Typography>
      <Button
        onClick={handleClearCache}
        color="warning"
        variant="contained"
        disabled={loading}
        className="clear-cache-button"
      >
        {loading ? <CircularProgress size={24}/> : 'Clear Cache'}
      </Button>
    </Paper>
  );

  return (
    <Container className="config-container" maxWidth="sm">
      <Box className="config-header">
        <IconButton
          onClick={() => navigate('/profile')}
          className="back-button"
        >
          <ArrowBackIcon/>
        </IconButton>
        <Typography variant="h5" fontWeight="bold">
          Reload Expenses
        </Typography>
      </Box>
      <Stack spacing={3}>
        <DateSpecificSection/>
        <ReloadAllSection/>
        <ClearCacheSection/>
      </Stack>
    </Container>
  );
};

export default ReloadData;
