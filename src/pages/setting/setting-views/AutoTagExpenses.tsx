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

import React, {useEffect, useState} from 'react';
import {Alert, Box, Button, CircularProgress, Container, IconButton, Paper, Stack, Typography} from '@mui/material';
import {AdapterDayjs} from '@mui/x-date-pickers/AdapterDayjs';
import {DatePicker, LocalizationProvider} from '@mui/x-date-pickers';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import dayjs, {Dayjs} from 'dayjs';
import {ExpenseAPI} from '../../../api/ExpenseAPI';
import {getUnixTimestamp} from '../../../utility/utility';
import {useNavigate} from 'react-router-dom';
import './settingViews.scss';

/**
 * AutoTagExpenses component allows users to automatically tag past expenses
 * based on the vendor-tag mappings.
 */
const AutoTagExpenses: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);

  useEffect(() => {
    if (success) {


      const timer = setTimeout(() => {

        setSuccess(false);
        setProcessedCount(0);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleAutoTagAll = async () => {
    setLoading(true);
    try {
      console.log('Auto-tagging all expenses');
      const count = await ExpenseAPI.autoTagPastExpenses(getUnixTimestamp('2020-01-01'));
      setProcessedCount(count);
      setSuccess(true);
    } catch (error) {
      console.error('Failed to auto-tag all expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoTagSelected = async () => {
    if (!selectedDate) return;

    setLoading(true);
    try {
      console.log('Auto-tagging expenses for:', selectedDate);
      const count = await ExpenseAPI.autoTagPastExpenses(getUnixTimestamp(selectedDate.toDate()));
      setProcessedCount(count);
      setSuccess(true);
    } catch (error) {
      console.error('Failed to auto-tag expenses for selected date:', error);
    } finally {
      setLoading(false);
    }
  };

  const DateSpecificSection = () => (
    <Paper elevation={0} className="reload-section-paper">
      <Typography variant="subtitle1" gutterBottom fontWeight="medium"
                  className="section-title">
        Auto-tag Expenses by Date
      </Typography>
      <Box className="date-reload-container">
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Select Start Date"
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
          onClick={handleAutoTagSelected}
          color="primary"
          variant="contained"
          disabled={loading || !selectedDate}
          className="reload-button"
        >
          {loading ?
            <CircularProgress size={24}/> :
            `Auto-tag from ${selectedDate ? dayjs(selectedDate).format('MMM DD, YYYY') : ''}`
          }
        </Button>
      </Box>
    </Paper>
  );

  const AutoTagAllSection = () => (
    <Paper elevation={0} className="reload-section-paper">
      <Typography variant="subtitle1" gutterBottom fontWeight="medium"
                  className="section-title">
        Auto-tag All Past Expenses
      </Typography>
      <Typography variant="body2" className="reload-warning-text">
        This action will go through all past expenses and apply tags based on your
        vendor-tag mappings available in 'Manage Vendor Tags'.
      </Typography>
      <Button
        onClick={handleAutoTagAll}
        color="error"
        variant="contained"
        disabled={loading}
        className="reload-all-button"
      >
        {loading ? <CircularProgress size={24}/> : 'Auto-tag All Expenses'}
      </Button>
    </Paper>
  );

  const SuccessMessage: React.FC = () => {
    if (!success) return null;

    return (
      <Paper elevation={0} className="success-message">
        <Stack direction="row" alignItems="center" spacing={1}>
          <CheckCircleIcon/>
          <Typography variant="body2">
            {`Auto-tagging successful! ${processedCount} expenses were updated.`}
          </Typography>
        </Stack>
      </Paper>
    );
  };

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
          Auto-tag Expenses
        </Typography>
      </Box>
      <Alert severity="info" sx={{mb: 2}}>
        This feature automatically assigns tags to your past expenses based on the vendor
        names you have available in
        'Manage Vendor Tags'. It helps in organizing your old expenses without manual
        tagging.
      </Alert>
      <Stack spacing={3}>
        <DateSpecificSection/>
        <AutoTagAllSection/>
        <SuccessMessage/>
      </Stack>
    </Container>
  );
};

export default AutoTagExpenses;
