import React, {useState} from 'react';
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Switch,
  TextField,
  Typography,
  useTheme
} from '@mui/material';
import {Add as AddIcon, ArrowBack as BackIcon, CreditCard as CreditCardIcon} from '@mui/icons-material';
import {useNavigate} from 'react-router-dom';
import {motion} from 'framer-motion';

// Credit card interface
interface CreditCard {
  id: string;
  bank: string;
  lastFourDigits: string;
}

const Configuration: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [enableHdfcUpi, setEnableHdfcUpi] = useState<boolean>(false);

  // Sample credit cards data
  const [creditCards, setCreditCards] = useState<CreditCard[]>([
    { id: '1', bank: 'HDFC', lastFourDigits: '4567' },
    { id: '2', bank: 'ICICI', lastFourDigits: '8901' },
    { id: '3', bank: 'SBI', lastFourDigits: '2345' }
  ]);

  // States for the add credit card modal
  const [cardDialogOpen, setCardDialogOpen] = useState(false);
  const [newCardDigits, setNewCardDigits] = useState('');
  const [cardError, setCardError] = useState('');

  const handleHdfcUpiToggle = () => {
    setEnableHdfcUpi(!enableHdfcUpi);
    // Here you would typically save the setting to your backend or local storage
  };

  const handleAddCreditCard = () => {
    // Open the modal dialog
    setCardDialogOpen(true);

    // Reset form fields
    setNewCardDigits('');
    setCardError('');
  };

  const handleCloseCardDialog = () => {
    setCardDialogOpen(false);
  };

  const handleSaveCard = () => {
    // Validate input
    if (!newCardDigits) {
      setCardError('Please enter the last 4 digits');
      return;
    }

    if (!/^\d{4}$/.test(newCardDigits)) {
      setCardError('Please enter exactly 4 digits');
      return;
    }

    // Create new card and add to state
    const newCard: CreditCard = {
      id: Date.now().toString(), // Simple ID generation
      bank: 'HDFC', // Fixed bank as HDFC
      lastFourDigits: newCardDigits
    };

    setCreditCards([...creditCards, newCard]);
    setCardDialogOpen(false);
  };

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
          Configuration
        </Typography>
      </Box>

      <Paper
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        elevation={3}
        sx={{
          p: 3,
          borderRadius: '16px',
          background: '#23272a',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
          mb: 3,
        }}
      >
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'medium' }}>
          Bank Account
        </Typography>

        <FormControlLabel
          control={
            <Switch
              checked={enableHdfcUpi}
              onChange={handleHdfcUpiToggle}
              color="primary"
            />
          }
          label="Enable HDFC UPI"
          sx={{ width: '100%' }}
        />
      </Paper>

      {/* Credit Cards Section */}
      <Paper
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        elevation={3}
        sx={{
          p: 3,
          borderRadius: '16px',
          background: '#23272a',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
            Credit Cards
          </Typography>
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            color="primary"
            size="small"
            onClick={handleAddCreditCard}
            sx={{ borderRadius: 2 }}
          >
            Add Credit Card
          </Button>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <List>
          {creditCards.map((card) => (
            <ListItem key={card.id} sx={{
              py: 1,
              borderRadius: 1,
              mb: 1,
              bgcolor: '#2a3035',
              '&:hover': { bgcolor: '#323a42' }
            }}>
              <CreditCardIcon sx={{ mr: 2, color: '#90caf9' }} />
              <ListItemText
                primary={`${card.bank} ****${card.lastFourDigits}`}
                primaryTypographyProps={{
                  sx: { color: '#e0e0e0', fontWeight: 500 }
                }}
              />
            </ListItem>
          ))}

          {creditCards.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              No credit cards added yet
            </Typography>
          )}
        </List>
      </Paper>

      {/* Credit Card Dialog */}
      <Dialog
        open={cardDialogOpen}
        onClose={handleCloseCardDialog}
        sx={{
          '& .MuiPaper-root': {
            backgroundColor: '#23272a',
            borderRadius: '16px',
          }
        }}
      >
        <DialogTitle sx={{ color: '#e0e0e0' }}>Add HDFC Credit Card</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#b0bec5', mb: 2 }}>
            Please enter the last 4 digits of your HDFC credit card.
          </DialogContentText>

          <TextField
            autoFocus
            margin="dense"
            id="last-digits"
            label="Last 4 Digits"
            type="text"
            fullWidth
            variant="outlined"
            value={newCardDigits}
            onChange={(e) => {
              // Allow only digits and limit to 4 characters
              const input = e.target.value.replace(/\D/g, '').slice(0, 4);
              setNewCardDigits(input);
              setCardError('');
            }}
            error={!!cardError}
            helperText={cardError}
            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#e0e0e0',
                '& fieldset': {
                  borderColor: '#3a4045',
                },
                '&:hover fieldset': {
                  borderColor: '#90caf9',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#90caf9',
                },
              },
              '& .MuiFormLabel-root': {
                color: '#90caf9',
              },
              '& .MuiFormHelperText-root': {
                color: '#ef5350',
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleCloseCardDialog}
            sx={{ color: '#90caf9' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveCard}
            variant="contained"
            sx={{
              bgcolor: '#2a3035',
              '&:hover': { bgcolor: '#323a42' }
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Configuration;
