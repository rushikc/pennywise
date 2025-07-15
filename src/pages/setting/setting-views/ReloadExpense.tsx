import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  Divider,
  IconButton,
  Paper,
  Stack,
  Typography
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import dayjs, {Dayjs} from 'dayjs';
import { ExpenseAPI } from "../../../api/ExpenseAPI";
import {getDateFormat, getDateFromString} from "../../../utility/utility";

interface ReloadExpenseProps {
  open: boolean;
  onClose: () => void;
}

const PAPER_STYLES = {
  p: 2,
  bgcolor: '#324e656b',
  color: '#fff',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: 2
};

const DATE_PICKER_STYLES = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.23)' },
    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
  },
  '& .MuiInputLabel-root, & .MuiOutlinedInput-input': { color: 'rgba(255, 255, 255, 0.9)' },
  '& .MuiSvgIcon-root': { color: 'rgba(255, 255, 255, 0.7)' }
};

/**
 * ReloadExpense component allows users to reload expense data
 * either for a specific date or all expenses.
 */
const ReloadExpense: React.FC<ReloadExpenseProps> = ({ open, onClose }) => {
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [success, onClose]);


  const handleReloadAll = async () => {
    setLoading(true);
    try {
      console.log("Reloading all expenses");
      await ExpenseAPI.getExpenseList('2020-01-01');
      setSuccess(true);
    } catch (error) {
      console.error("Failed to reload all expenses:", error);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleReloadSelected = async () => {
    if (!selectedDate) return;

    setLoading(true);
    try {
      console.log("Reloading expenses for:", selectedDate);
      await ExpenseAPI.getExpenseList(getDateFormat(selectedDate.toDate()));
      setSuccess(true);
    } catch (error) {
      console.error("Failed to reload expenses for selected date:", error);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const DialogHeader = () => (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
        <Typography variant="h6" component="div">
          Reload Expenses
        </Typography>
        <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />
    </>
  );

  const DateSpecificSection = () => (
    <Paper elevation={0} sx={PAPER_STYLES}>
      <Typography variant="subtitle1" gutterBottom fontWeight="medium" sx={{ color: '#fff' }}>
        Reload Expenses by Date
      </Typography>
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'stretch', sm: 'center' },
        gap: 2,
        mt: 1
      }}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Select Date"
            value={selectedDate}
            onChange={(newDate) => setSelectedDate(newDate)}
            slotProps={{
              textField: {
                fullWidth: true,
                size: "small",
                sx: DATE_PICKER_STYLES
              }
            }}
          />
        </LocalizationProvider>
        <Button
          onClick={handleReloadSelected}
          color="primary"
          variant="contained"
          disabled={loading || !selectedDate}
          sx={{ minWidth: '220px', height: '40px' }}
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
    <Paper elevation={0} sx={PAPER_STYLES}>
      <Typography variant="subtitle1" gutterBottom fontWeight="medium" sx={{ color: '#fff' }}>
        Reload All Expenses
      </Typography>
      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
        Warning: This action will reload all expense data from your sources. This operation
        might be costly in terms of Firebase cloud reads and could impact your billing.
        Only use this option when necessary.
      </Typography>
      <Button
        onClick={handleReloadAll}
        color="error"
        variant="contained"
        disabled={loading}
        sx={{ minWidth: '180px' }}
      >
        {loading ? <CircularProgress size={24}/> : 'Reload All Expenses'}
      </Button>
    </Paper>
  );

  const SuccessMessage: React.FC = () => {
    if (!success) return null;

    return (
      <Paper elevation={0} sx={{ p: 2, bgcolor: '#2e7d32', color: '#fff', borderRadius: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <CheckCircleIcon />
          <Typography variant="body2" sx={{ color: '#fff' }}>
            Reload successful!
          </Typography>
        </Stack>
      </Paper>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogHeader />
      <DialogContent>
        <Stack spacing={3}>
          <DateSpecificSection />
          <ReloadAllSection />
          <SuccessMessage />
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default ReloadExpense;
