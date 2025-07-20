/*
Copyright (C) 2025 Rushikesh <rushikc.dev@gmail.com>

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
import {
  Box,
  Button,
  CircularProgress,
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
  Typography
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowBack as BackIcon,
  CreditCard as CreditCardIcon,
  RemoveCircleOutline
} from '@mui/icons-material';
import {useNavigate} from 'react-router-dom';
import {motion} from 'framer-motion';
import {ExpenseAPI} from '../../../api/ExpenseAPI';
import {BankConfig} from "../../../Types";
import './settingViews.scss';

const Configuration: React.FC = () => {
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
    <Container className="config-container" maxWidth="sm">
      <Box className="config-header">
        <IconButton
          onClick={() => navigate('/profile')}
          className="back-button"
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
        className="section-paper bank-section"
      >
        {isLoading ? (
          <Box className="loading-container">
            <CircularProgress size={28} className="loading-indicator"/>
          </Box>
        ) : (
          <>
            <Typography variant="h6" className="section-title">
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
                className="loading-indicator mini"
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
        className="section-paper"
      >
        <Box className="section-header">
          <Typography variant="h6" className="section-title">
            Credit Cards
          </Typography>
          <Button
            startIcon={<AddIcon/>}
            variant="contained"
            color="primary"
            size="small"
            onClick={handleAddCreditCard}
            className="add-card-button"
            disabled={isLoading || isSaving}
          >
            Add Credit Card
          </Button>
        </Box>

        <Divider sx={{mb: 2}}/>

        {isLoading ? (
          <Box className="loading-container">
            <CircularProgress size={28} className="loading-indicator"/>
          </Box>
        ) : (
          <List>
            {bankConfig.creditCards.map((cardDigits, index) => (
              <ListItem
                key={index}
                className="card-list-item"
                secondaryAction={
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleRemoveCard(cardDigits)}
                    disabled={isSaving}
                    className="delete-button"
                  >
                    <RemoveCircleOutline/>
                  </IconButton>
                }
              >
                <CreditCardIcon className="card-icon"/>
                <ListItemText
                  primary={`HDFC ****${cardDigits}`}
                  primaryTypographyProps={{
                    className: "card-text"
                  }}
                />
              </ListItem>
            ))}

            {bankConfig.creditCards.length === 0 && (
              <Typography variant="body2" className="empty-cards-message">
                No credit cards added yet
              </Typography>
            )}
          </List>
        )}

        {isSaving && (
          <CircularProgress
            size={16}
            className="loading-indicator mini"
          />
        )}
      </Paper>



      {/* Credit Card Dialog */}
      <Dialog
        open={cardDialogOpen}
        onClose={handleCloseCardDialog}
        className="card-dialog"
      >
        <DialogTitle className="dialog-title">Add HDFC Credit Card</DialogTitle>
        <DialogContent>
          <DialogContentText className="dialog-text">
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
            className="text-field"
          />
        </DialogContent>
        <DialogActions className="dialog-actions">
          <Button
            onClick={handleCloseCardDialog}
            className="cancel-button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveCard}
            variant="contained"
            className="save-button"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Configuration;
