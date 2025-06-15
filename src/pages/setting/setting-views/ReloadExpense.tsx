import React, {useState, useEffect} from 'react';
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
import {AdapterDateFns} from '@mui/x-date-pickers/AdapterDateFns';
import {DatePicker, LocalizationProvider} from '@mui/x-date-pickers';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { format } from 'date-fns';
import {ExpenseAPI} from "../../../api/ExpenseAPI";
import {getDateFormat} from "../../../utility/utility";
// import '../settingsViews.scss';

interface ReloadExpenseProps {
  open: boolean;
  onClose: () => void;
}

const ReloadExpense: React.FC<ReloadExpenseProps> = ({open, onClose}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Effect to close modal after showing success icon
  useEffect(() => {
    if (success) {
      // Delay closing the modal to show success icon
      const timer = setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500); // 1.5 seconds delay
      return () => clearTimeout(timer);
    }
  }, [success, onClose]);

  const handleCancel = () => {
    onClose();
  };

  const handleReloadAll = async () => {
    setLoading(true);
    setSuccess(false);
    try {
      // Implement the reload all functionality here
      console.log("Reloading all expenses");
      // Simulate API call
      // await ExpenseAPI.getExpenseList('2020-01-01'); // date to fetch all expenses
      setSuccess(true);
    } catch (error) {
      console.error("Failed to reload all expenses:", error);
      onClose(); // Close immediately on error
    } finally {
      setLoading(false);
      // Don't close here, let the useEffect handle it after showing success
    }
  };

  const handleReloadSelected = async () => {
    if (!selectedDate) return;

    setLoading(true);
    setSuccess(false);
    try {
      // Implement the reload selected date functionality here
      console.log("Reloading expenses for:", selectedDate);
      // Simulate API call
      await ExpenseAPI.getExpenseList(getDateFormat(selectedDate));
      setSuccess(true);
    } catch (error) {
      console.error("Failed to reload expenses for selected date:", error);
      onClose(); // Close immediately on error
    } finally {
      setLoading(false);
      // Don't close here, let the useEffect handle it after showing success
    }
  };

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
        <Typography variant="h6" component="div">
          Reload Expenses
        </Typography>
        <IconButton edge="end" color="inherit" onClick={handleCancel} aria-label="close">
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />
      <DialogContent>
        <Stack spacing={3}>
          {/* Section 1: Reload from specific date */}
          <Paper elevation={0} sx={{ p: 2, bgcolor: '#324e656b', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 2 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="medium" sx={{ color: '#fff' }}>
              Reload Expenses by Date
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, gap: 2, mt: 1 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Select Date"
                  value={selectedDate}
                  onChange={(newDate) => setSelectedDate(newDate)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small",
                      sx: {
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          '& fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.23)',
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.5)',
                          },
                        },
                        '& .MuiInputLabel-root, & .MuiOutlinedInput-input': {
                          color: 'rgba(255, 255, 255, 0.9)',
                        },
                        '& .MuiSvgIcon-root': {
                          color: 'rgba(255, 255, 255, 0.7)',
                        }
                      }
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
                {loading ? <CircularProgress size={24}/> : `Reload from ${selectedDate ? format(selectedDate, 'MMM dd, yyyy') : ''}`}
              </Button>
            </Box>
          </Paper>

          {/* Section 2: Reload all with disclaimer */}
          <Paper elevation={0} sx={{ p: 2, bgcolor: '#324e656b', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 2 }}>
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

          {/* Success Message */}
          {success && (
            <Paper elevation={0} sx={{ p: 2, bgcolor: '#2e7d32', color: '#fff', borderRadius: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <CheckCircleIcon />
                <Typography variant="body2" sx={{ color: '#fff' }}>
                  Reload successful!
                </Typography>
              </Stack>
            </Paper>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default ReloadExpense;
