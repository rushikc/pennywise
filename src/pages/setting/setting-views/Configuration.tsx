import React, {useState, useEffect} from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  FormControlLabel,
  Switch,
  IconButton,
  useTheme,
  List,
  ListItem,
  ListItemText,
  Button,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  CircularProgress
} from '@mui/material';
import {ArrowBack as BackIcon, CreditCard as CreditCardIcon, Add as AddIcon, RemoveCircleOutline} from '@mui/icons-material';
import {useNavigate} from 'react-router-dom';
import {motion} from 'framer-motion';
import {ExpenseAPI} from '../../../api/ExpenseAPI';
import {BankConfig} from "../../../Types";


const Configuration: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  // State for bank configuration
  const [bankConfig, setBankConfig] = useState<BankConfig>({enableUpi: false, creditCards: []});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // States for the add credit card modal
  const [cardDialogOpen, setCardDialogOpen] = useState(false);
  const [newCardDigits, setNewCardDigits] = useState('');
  const [cardError, setCardError] = useState('');

  // Fetch bank configuration on component mount
  useEffect(() => {
    const fetchBankConfig = async () => {
      setIsLoading(true);
      try {
        const config = await ExpenseAPI.getBankConfig();
        setBankConfig(config);
      } catch (error) {
        console.error('Error fetching bank configuration:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchBankConfig();

  }, []);

  const handleHdfcUpiToggle = async () => {
    setIsSaving(true);
    const updatedConfig = {
      ...bankConfig,
      enableUpi: !bankConfig.enableUpi
    };

    try {
      const success = await ExpenseAPI.updateBankConfig(updatedConfig);
      if (success) {
        setBankConfig(updatedConfig);
      } else {
        console.error('Failed to update UPI setting');
      }
    } catch (error) {
      console.error('Error updating UPI setting:', error);
    } finally {
      setIsSaving(false);
    }
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

  const handleSaveCard = async () => {
    // Validate input
    if (!newCardDigits) {
      setCardError('Please enter the last 4 digits');
      return;
    }

    if (!/^\d{4}$/.test(newCardDigits)) {
      setCardError('Please enter exactly 4 digits');
      return;
    }

    // Check for duplicates
    if (bankConfig.creditCards.includes(newCardDigits)) {
      setCardError('This card has already been added');
      return;
    }

    setIsSaving(true);

    // Add the new card to the existing cards
    const updatedConfig = {
      ...bankConfig,
      creditCards: [...bankConfig.creditCards, newCardDigits]
    };

    try {
      const success = await ExpenseAPI.updateBankConfig(updatedConfig);
      if (success) {
        setBankConfig(updatedConfig);
        setCardDialogOpen(false);
      } else {
        setCardError('Failed to add credit card');
      }
    } catch (error) {
      console.error('Error adding credit card:', error);
      setCardError('Error saving credit card');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveCard = async (cardDigits: string) => {
    setIsSaving(true);

    const updatedConfig = {
      ...bankConfig,
      creditCards: bankConfig.creditCards.filter(card => card !== cardDigits)
    };

    try {
      const success = await ExpenseAPI.updateBankConfig(updatedConfig);
      if (success) {
        setBankConfig(updatedConfig);
      } else {
        console.error('Failed to remove credit card');
      }
    } catch (error) {
      console.error('Error removing credit card:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{pb: 10, pt: 2}}>
      <Box sx={{display: 'flex', alignItems: 'center', mb: 3}}>
        <IconButton
          onClick={() => navigate('/dashboard')}
          sx={{mr: 2, color: theme.palette.primary.main}}
        >
          <BackIcon/>
        </IconButton>
        <Typography variant="h5" fontWeight="bold">
          Configuration
        </Typography>
      </Box>

      <Paper
        component={motion.div}
        initial={{opacity: 0, y: 20}}
        animate={{opacity: 1, y: 0}}
        transition={{duration: 0.5}}
        elevation={3}
        sx={{
          p: 3,
          borderRadius: '16px',
          background: '#23272a',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
          mb: 3,
          position: 'relative',
        }}
      >
        {isLoading ? (
          <Box sx={{display: 'flex', justifyContent: 'center', py: 2}}>
            <CircularProgress size={28} sx={{color: '#90caf9'}}/>
          </Box>
        ) : (
          <>
            <Typography variant="h6" sx={{mb: 2, fontWeight: 'medium'}}>
              Bank Account Settings
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={bankConfig.enableUpi}
                  onChange={handleHdfcUpiToggle}
                  color="primary"
                  disabled={isSaving}
                />
              }
              label="Enable HDFC UPI"
              sx={{width: '100%'}}
            />

            {isSaving && (
              <CircularProgress
                size={16}
                sx={{
                  color: '#90caf9',
                  position: 'absolute',
                  top: '16px',
                  right: '16px'
                }}
              />
            )}
          </>
        )}
      </Paper>

      {/* Credit Cards Section */}
      <Paper
        component={motion.div}
        initial={{opacity: 0, y: 20}}
        animate={{opacity: 1, y: 0}}
        transition={{duration: 0.5, delay: 0.1}}
        elevation={3}
        sx={{
          p: 3,
          borderRadius: '16px',
          background: '#23272a',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
          position: 'relative',
        }}
      >
        <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2}}>
          <Typography variant="h6" sx={{fontWeight: 'medium'}}>
            Credit Cards
          </Typography>
          <Button
            startIcon={<AddIcon/>}
            variant="contained"
            color="primary"
            size="small"
            onClick={handleAddCreditCard}
            sx={{borderRadius: 2}}
            disabled={isLoading || isSaving}
          >
            Add Credit Card
          </Button>
        </Box>

        <Divider sx={{mb: 2}}/>

        {isLoading ? (
          <Box sx={{display: 'flex', justifyContent: 'center', py: 2}}>
            <CircularProgress size={28} sx={{color: '#90caf9'}}/>
          </Box>
        ) : (
          <List>
            {bankConfig.creditCards.map((cardDigits, index) => (
              <ListItem
                key={index}
                sx={{
                  py: 1,
                  borderRadius: 1,
                  mb: 1,
                  bgcolor: '#2a3035',
                  '&:hover': {bgcolor: '#323a42'}
                }}
                secondaryAction={
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleRemoveCard(cardDigits)}
                    disabled={isSaving}
                    sx={{color: '#ef5350'}}
                  >
                    <RemoveCircleOutline />
                  </IconButton>
                }
              >
                <CreditCardIcon sx={{mr: 2, color: '#90caf9'}}/>
                <ListItemText
                  primary={`HDFC ****${cardDigits}`}
                  primaryTypographyProps={{
                    sx: {color: '#e0e0e0', fontWeight: 500}
                  }}
                />
              </ListItem>
            ))}

            {bankConfig.creditCards.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{textAlign: 'center', py: 2}}>
                No credit cards added yet
              </Typography>
            )}
          </List>
        )}

        {isSaving && (
          <CircularProgress
            size={16}
            sx={{
              color: '#90caf9',
              position: 'absolute',
              top: '16px',
              right: '16px'
            }}
          />
        )}
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
        <DialogTitle sx={{color: '#e0e0e0'}}>Add HDFC Credit Card</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{color: '#b0bec5', mb: 2}}>
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
            inputProps={{inputMode: 'numeric', pattern: '[0-9]*'}}
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
        <DialogActions sx={{px: 3, pb: 2}}>
          <Button
            onClick={handleCloseCardDialog}
            sx={{color: '#90caf9'}}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveCard}
            variant="contained"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Configuration;
