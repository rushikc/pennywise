import React, {useState} from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography
} from '@mui/material';
import {AdapterDateFns} from '@mui/x-date-pickers/AdapterDateFns';
import {DatePicker, LocalizationProvider} from '@mui/x-date-pickers';

interface ReloadExpenseProps {
  open: boolean;
  onClose: () => void;
}

const ReloadExpense: React.FC<ReloadExpenseProps> = ({open, onClose}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [loading, setLoading] = useState(false);

  const handleCancel = () => {
    onClose();
  };

  const handleReloadAll = async () => {
    setLoading(true);
    try {
      // Implement the reload all functionality here
      console.log("Reloading all expenses");
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("Failed to reload all expenses:", error);
    } finally {
      setLoading(false);
      onClose();
    }
  };

  const handleReloadSelected = async () => {
    if (!selectedDate) return;

    setLoading(true);
    try {
      // Implement the reload selected date functionality here
      console.log("Reloading expenses for:", selectedDate);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("Failed to reload expenses for selected date:", error);
    } finally {
      setLoading(false);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" component="div">
          Reload Expenses
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{my: 2}}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Select Date"
              value={selectedDate}
              onChange={(newDate) => setSelectedDate(newDate)}
              slotProps={{ textField: { fullWidth: true, margin: "normal" } }}
            />
          </LocalizationProvider>
        </Box>
      </DialogContent>
      <DialogActions sx={{px: 3, pb: 2, justifyContent: 'space-between'}}>
        <Button
          onClick={handleCancel}
          color="inherit"
          disabled={loading}
        >
          Cancel
        </Button>
        <Box>
          <Button
            onClick={handleReloadAll}
            color="primary"
            variant="contained"
            sx={{mr: 2}}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24}/> : 'Reload All'}
          </Button>
          <Button
            onClick={handleReloadSelected}
            color="secondary"
            variant="contained"
            disabled={loading || !selectedDate}
          >
            {loading ? <CircularProgress size={24}/> : 'Reload Selected Date'}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default ReloadExpense;
