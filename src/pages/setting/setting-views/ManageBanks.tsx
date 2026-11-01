/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import React, {useEffect, useState} from 'react';
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import {ExpenseAPI} from '../../../api/ExpenseAPI';
import AddIcon from '@mui/icons-material/Add';
import {ArrowBack as BackIcon, RemoveCircleOutline} from '@mui/icons-material';
import './settingViews.scss';
import {useNavigate} from 'react-router-dom';
import {BankEmailParsingEntry} from '../../../Types';
import {createTimedAlert} from '../../../store/alertActions';

function parseMatchStrings(input: string): string[] {
  return input
    .split(/[\n,]+/)
    .map(s => s.trim())
    .filter(Boolean);
}

function newBankId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'bank_' + Date.now();
}

const ManageBanks: React.FC = () => {
  const navigate = useNavigate();
  const [banks, setBanks] = useState<BankEmailParsingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(false);
  const [bankToDeleteId, setBankToDeleteId] = useState<string>('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newMatchStringsRaw, setNewMatchStringsRaw] = useState('');

  useEffect(() => {
    void ExpenseAPI.getEmailParseBankList().then((list) => {
      setBanks(list);
      setLoading(false);
    });
  }, []);

  const handleDeleteBank = (id: string) => {
    setBankToDeleteId(id);
    setDeleteConfirmDialog(true);
  };

  const confirmDeleteBank = () => {
    const next = banks.filter(b => b.id !== bankToDeleteId);
    void ExpenseAPI.updateEmailParseBankList(next).then((ok) => {
      setDeleteConfirmDialog(false);
      if (ok) {
        window.location.reload();
      } else {
        createTimedAlert({type: 'error', message: 'Could not delete bank. Try again.'});
      }
    });
  };

  const handleOpenAddDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseAddDialog = () => {
    setOpenDialog(false);
    setNewDisplayName('');
    setNewMatchStringsRaw('');
  };

  const handleAddBank = () => {
    const displayName = newDisplayName.trim();
    const matchStrings = parseMatchStrings(newMatchStringsRaw);
    if (!displayName || matchStrings.length === 0) {
      return;
    }
    const entry: BankEmailParsingEntry = {
      id: newBankId(),
      displayName,
      matchStrings,
    };
    void ExpenseAPI.updateEmailParseBankList([...banks, entry]).then((ok) => {
      handleCloseAddDialog();
      if (ok) {
        window.location.reload();
      } else {
        createTimedAlert({type: 'error', message: 'Could not save bank. Try again.'});
      }
    });
  };

  if (loading) {
    return null;
  }

  return (
    <Container className="manage-tags-container" maxWidth="sm">
      <Box className="config-header">
        <IconButton
          onClick={() => navigate('/profile')}
          className="back-button"
          aria-label="Back"
        >
          <BackIcon/>
        </IconButton>
        <Typography variant="h5" fontWeight="bold">
          Banks
        </Typography>
      </Box>
      <Paper elevation={3} className="manage-tags-paper">
        <span className="d-flex justify-content-center">
          Match phrases in bank emails (used by Gmail + Gemini parsing)
        </span>
        <List className="tag-list">
          {banks.map((bank) => (
            <ListItem
              key={bank.id}
              className="tag-item"
              secondaryAction={
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteBank(bank.id);
                  }}
                  sx={{color: 'error.main'}}
                >
                  <RemoveCircleOutline/>
                </IconButton>
              }
            >
              <ListItemText
                primary={bank.displayName}
                secondary={bank.matchStrings.join(', ')}
              />
            </ListItem>
          ))}
        </List>

        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon/>}
          onClick={handleOpenAddDialog}
          className="add-tag-button"
        >
          Add bank
        </Button>
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseAddDialog}>
        <DialogTitle>Add bank</DialogTitle>
        <DialogContent className="tag-dialog-content">
          <DialogContentText>
            Display name is shown in logs. Add phrases that appear in alert emails (case-insensitive), one per line or
            comma-separated.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Bank display name"
            type="text"
            fullWidth
            variant="outlined"
            value={newDisplayName}
            onChange={(e) => setNewDisplayName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Match phrases"
            placeholder={'e.g. hdfc\nhdfc bank'}
            type="text"
            fullWidth
            multiline
            minRows={4}
            variant="outlined"
            value={newMatchStringsRaw}
            onChange={(e) => setNewMatchStringsRaw(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog}>Cancel</Button>
          <Button
            onClick={handleAddBank}
            color="primary"
            disabled={!newDisplayName.trim() || parseMatchStrings(newMatchStringsRaw).length === 0}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteConfirmDialog}
        onClose={() => setDeleteConfirmDialog(false)}
      >
        <DialogTitle>Delete bank</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Remove this bank from email parsing configuration?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmDialog(false)}>Cancel</Button>
          <Button onClick={confirmDeleteBank} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ManageBanks;
