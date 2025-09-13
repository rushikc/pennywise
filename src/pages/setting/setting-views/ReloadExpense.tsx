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
import {Box, Button, CircularProgress, Container, IconButton, Paper, Stack, Typography} from '@mui/material';
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
	* ReloadExpense component allows users to reload expense data
	* either for a specific date or all expenses.
	*/
const ReloadExpense: React.FC = () => {
	const navigate = useNavigate();
	const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);

	useEffect(() => {
		if (success) {
			const timer = setTimeout(() => {
				setSuccess(false);
			}, 2500);
			return () => clearTimeout(timer);
		}
	}, [success]);

	const handleReloadAll = async () => {
		setLoading(true);
		try {
			console.log('Reloading all expenses');
			await ExpenseAPI.getExpenseList(getUnixTimestamp('2020-01-01'));
			setSuccess(true);
		} catch (error) {
			console.error('Failed to reload all expenses:', error);
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
			setSuccess(true);
		} catch (error) {
			console.error('Failed to reload expenses for selected date:', error);
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

	const SuccessMessage: React.FC = () => {
		if (!success) return null;

		return (
			<Paper elevation={0} className="success-message">
				<Stack direction="row" alignItems="center" spacing={1}>
					<CheckCircleIcon/>
					<Typography variant="body2">
						Reload successful!
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
					Reload Expenses
				</Typography>
			</Box>
			<Stack spacing={3}>
				<DateSpecificSection/>
				<ReloadAllSection/>
				<SuccessMessage/>
			</Stack>
		</Container>
	);
};

export default ReloadExpense;
