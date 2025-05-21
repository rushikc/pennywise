import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Divider,
  IconButton,
  useTheme,
  Grid,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Snackbar,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  ArrowBack as BackIcon,
  AccountBalance as BankIcon,
  Work as JobIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Define interfaces for bank account and job configuration
interface BankAccount {
  id: string;
  name: string;
  accountNumber: string;
  bankName: string;
  isActive: boolean;
}

interface JobConfig {
  id: string;
  name: string;
  schedule: string;
  lastRun: string;
  isActive: boolean;
}

const Configuration: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  // Mock data for bank accounts and job configurations
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([
    {
      id: 'bank1',
      name: 'Primary Checking',
      accountNumber: '****4567',
      bankName: 'Chase Bank',
      isActive: true
    },
    {
      id: 'bank2',
      name: 'Savings Account',
      accountNumber: '****7890',
      bankName: 'Bank of America',
      isActive: true
    }
  ]);

  const [jobConfigs, setJobConfigs] = useState<JobConfig[]>([
    {
      id: 'job1',
      name: 'Daily Expense Sync',
      schedule: 'Daily at 9:00 AM',
      lastRun: '2023-05-20 09:00:00',
      isActive: true
    },
    {
      id: 'job2',
      name: 'Monthly Report Generation',
      schedule: 'Monthly on 1st at 12:00 AM',
      lastRun: '2023-05-01 00:00:00',
      isActive: true
    }
  ]);

  // State for dialogs
  const [bankDialogOpen, setBankDialogOpen] = useState(false);
  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  const [currentBank, setCurrentBank] = useState<BankAccount | null>(null);
  const [currentJob, setCurrentJob] = useState<JobConfig | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Notification state
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Handle bank toggle
  const handleBankToggle = (id: string) => {
    setBankAccounts(
      bankAccounts.map(account =>
        account.id === id ? { ...account, isActive: !account.isActive } : account
      )
    );
    setNotification({
      open: true,
      message: 'Bank account status updated',
      severity: 'success'
    });
  };

  // Handle job toggle
  const handleJobToggle = (id: string) => {
    setJobConfigs(
      jobConfigs.map(job =>
        job.id === id ? { ...job, isActive: !job.isActive } : job
      )
    );
    setNotification({
      open: true,
      message: 'Job configuration status updated',
      severity: 'success'
    });
  };

  // Open bank dialog
  const handleOpenBankDialog = (bank?: BankAccount) => {
    if (bank) {
      setCurrentBank(bank);
      setIsEditing(true);
    } else {
      setCurrentBank({
        id: `bank${bankAccounts.length + 1}`,
        name: '',
        accountNumber: '',
        bankName: '',
        isActive: true
      });
      setIsEditing(false);
    }
    setBankDialogOpen(true);
  };

  // Open job dialog
  const handleOpenJobDialog = (job?: JobConfig) => {
    if (job) {
      setCurrentJob(job);
      setIsEditing(true);
    } else {
      setCurrentJob({
        id: `job${jobConfigs.length + 1}`,
        name: '',
        schedule: '',
        lastRun: new Date().toISOString(),
        isActive: true
      });
      setIsEditing(false);
    }
    setJobDialogOpen(true);
  };

  // Save bank
  const handleSaveBank = () => {
    if (currentBank) {
      if (isEditing) {
        setBankAccounts(
          bankAccounts.map(account =>
            account.id === currentBank.id ? currentBank : account
          )
        );
        setNotification({
          open: true,
          message: 'Bank account updated successfully',
          severity: 'success'
        });
      } else {
        setBankAccounts([...bankAccounts, currentBank]);
        setNotification({
          open: true,
          message: 'Bank account added successfully',
          severity: 'success'
        });
      }
      setBankDialogOpen(false);
    }
  };

  // Save job
  const handleSaveJob = () => {
    if (currentJob) {
      if (isEditing) {
        setJobConfigs(
          jobConfigs.map(job =>
            job.id === currentJob.id ? currentJob : job
          )
        );
        setNotification({
          open: true,
          message: 'Job configuration updated successfully',
          severity: 'success'
        });
      } else {
        setJobConfigs([...jobConfigs, currentJob]);
        setNotification({
          open: true,
          message: 'Job configuration added successfully',
          severity: 'success'
        });
      }
      setJobDialogOpen(false);
    }
  };

  // Delete bank
  const handleDeleteBank = (id: string) => {
    setBankAccounts(bankAccounts.filter(account => account.id !== id));
    setNotification({
      open: true,
      message: 'Bank account removed',
      severity: 'success'
    });
  };

  // Delete job
  const handleDeleteJob = (id: string) => {
    setJobConfigs(jobConfigs.filter(job => job.id !== id));
    setNotification({
      open: true,
      message: 'Job configuration removed',
      severity: 'success'
    });
  };

  // Update bank field
  const handleBankFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentBank) {
      setCurrentBank({
        ...currentBank,
        [e.target.name]: e.target.value
      });
    }
  };

  // Update job field
  const handleJobFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentJob) {
      setCurrentJob({
        ...currentJob,
        [e.target.name]: e.target.value
      });
    }
  };

  // Close notification
  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false
    });
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

      {/* Bank Accounts Section */}
      <Paper
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        elevation={3}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 2,
          background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, rgba(66,66,66,0.8) 100%)`,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <BankIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
            <Typography variant="h6">Bank Accounts</Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenBankDialog()}
            sx={{ borderRadius: 2 }}
          >
            Add Account
          </Button>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <List sx={{ width: '100%' }}>
          {bankAccounts.map((account) => (
            <ListItem
              key={account.id}
              sx={{
                bgcolor: theme.palette.action.hover,
                borderRadius: 1,
                mb: 1,
                transition: 'background-color 0.3s',
                '&:hover': {
                  bgcolor: theme.palette.action.selected,
                }
              }}
            >
              <ListItemIcon>
                <BankIcon color={account.isActive ? "primary" : "disabled"} />
              </ListItemIcon>
              <ListItemText
                primary={account.name}
                secondary={
                  <React.Fragment>
                    <Typography component="span" variant="body2" color="text.primary">
                      {account.bankName}
                    </Typography>
                    {` — ${account.accountNumber}`}
                  </React.Fragment>
                }
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  aria-label="edit"
                  onClick={() => handleOpenBankDialog(account)}
                  sx={{ mr: 1 }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => handleDeleteBank(account.id)}
                  sx={{ mr: 1 }}
                >
                  <DeleteIcon fontSize="small" color="error" />
                </IconButton>
                <FormControlLabel
                  control={
                    <Switch
                      checked={account.isActive}
                      onChange={() => handleBankToggle(account.id)}
                      color="primary"
                      size="small"
                    />
                  }
                  label=""
                />
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Job Configurations Section */}
      <Paper
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        elevation={3}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 2,
          background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, rgba(66,66,66,0.8) 100%)`,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <JobIcon sx={{ mr: 1, color: theme.palette.secondary.main }} />
            <Typography variant="h6">Job Configurations</Typography>
          </Box>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenJobDialog()}
            sx={{ borderRadius: 2 }}
          >
            Add Job
          </Button>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <List sx={{ width: '100%' }}>
          {jobConfigs.map((job) => (
            <ListItem
              key={job.id}
              sx={{
                bgcolor: theme.palette.action.hover,
                borderRadius: 1,
                mb: 1,
                transition: 'background-color 0.3s',
                '&:hover': {
                  bgcolor: theme.palette.action.selected,
                }
              }}
            >
              <ListItemIcon>
                <JobIcon color={job.isActive ? "secondary" : "disabled"} />
              </ListItemIcon>
              <ListItemText
                primary={job.name}
                secondary={
                  <React.Fragment>
                    <Typography component="span" variant="body2" color="text.primary">
                      {job.schedule}
                    </Typography>
                    {` — Last run: ${new Date(job.lastRun).toLocaleString()}`}
                  </React.Fragment>
                }
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  aria-label="edit"
                  onClick={() => handleOpenJobDialog(job)}
                  sx={{ mr: 1 }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => handleDeleteJob(job.id)}
                  sx={{ mr: 1 }}
                >
                  <DeleteIcon fontSize="small" color="error" />
                </IconButton>
                <FormControlLabel
                  control={
                    <Switch
                      checked={job.isActive}
                      onChange={() => handleJobToggle(job.id)}
                      color="secondary"
                      size="small"
                    />
                  }
                  label=""
                />
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Bank Account Dialog */}
      <Dialog open={bankDialogOpen} onClose={() => setBankDialogOpen(false)}>
        <DialogTitle>
          {isEditing ? 'Edit Bank Account' : 'Add Bank Account'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Account Name"
            type="text"
            fullWidth
            variant="outlined"
            value={currentBank?.name || ''}
            onChange={handleBankFieldChange}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            margin="dense"
            name="bankName"
            label="Bank Name"
            type="text"
            fullWidth
            variant="outlined"
            value={currentBank?.bankName || ''}
            onChange={handleBankFieldChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="accountNumber"
            label="Account Number"
            type="text"
            fullWidth
            variant="outlined"
            value={currentBank?.accountNumber || ''}
            onChange={handleBankFieldChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBankDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleSaveBank} color="primary" variant="contained" startIcon={<SaveIcon />}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Job Configuration Dialog */}
      <Dialog open={jobDialogOpen} onClose={() => setJobDialogOpen(false)}>
        <DialogTitle>
          {isEditing ? 'Edit Job Configuration' : 'Add Job Configuration'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Job Name"
            type="text"
            fullWidth
            variant="outlined"
            value={currentJob?.name || ''}
            onChange={handleJobFieldChange}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            margin="dense"
            name="schedule"
            label="Schedule (e.g., Daily at 9:00 AM)"
            type="text"
            fullWidth
            variant="outlined"
            value={currentJob?.schedule || ''}
            onChange={handleJobFieldChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setJobDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleSaveJob} color="primary" variant="contained" startIcon={<SaveIcon />}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity as 'success' | 'info' | 'warning' | 'error'}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Configuration;
