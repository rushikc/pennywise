import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Avatar,
  Paper,
  TextField,
  Button,
  Divider,
  useTheme,
  IconButton,
  Snackbar,
  Alert
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  ArrowBack as BackIcon,
  CloudUpload as UploadIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  // Mock user data - replace with your actual user data from auth/state
  const [user, setUser] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    photoUrl: '/profile-avatar.jpg',
    phone: '+1 (555) 123-4567',
    occupation: 'Software Engineer',
    location: 'San Francisco, CA'
  });

  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ ...user });
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditToggle = () => {
    if (editing) {
      // Save changes
      setUser(formData);
      setNotification({
        open: true,
        message: 'Profile updated successfully!',
        severity: 'success'
      });
    }
    setEditing(!editing);
  };

  const handlePhotoUpload = () => {
    // Implement photo upload functionality
    // This would typically involve opening a file dialog and uploading to storage
    setNotification({
      open: true,
      message: 'Photo upload feature will be implemented soon',
      severity: 'info'
    });
  };

  const handleNotificationClose = () => {
    setNotification(prev => ({ ...prev, open: false }));
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
          Profile
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
          mb: 3,
          borderRadius: 2,
          background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, rgba(66,66,66,0.8) 100%)`,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mb: 3,
            position: 'relative'
          }}
        >
          <Avatar
            src={user.photoUrl}
            sx={{
              width: 120,
              height: 120,
              mb: 2,
              border: `3px solid ${theme.palette.primary.main}`
            }}
          />

          {editing && (
            <IconButton
              color="primary"
              sx={{
                position: 'absolute',
                right: '50%',
                bottom: '30%',
                transform: 'translateX(60px)',
                bgcolor: 'rgba(0,0,0,0.7)',
                '&:hover': {
                  bgcolor: 'rgba(0,0,0,0.9)',
                }
              }}
              onClick={handlePhotoUpload}
            >
              <UploadIcon />
            </IconButton>
          )}
        </Box>

        <Box sx={{ mb: 3 }}>
          <TextField
            label="Full Name"
            variant="outlined"
            fullWidth
            margin="normal"
            name="name"
            value={editing ? formData.name : user.name}
            onChange={handleInputChange}
            disabled={!editing}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: editing ? theme.palette.primary.main : 'rgba(255,255,255,0.23)',
                },
              }
            }}
          />
          <TextField
            label="Email"
            variant="outlined"
            fullWidth
            margin="normal"
            type="email"
            name="email"
            value={editing ? formData.email : user.email}
            onChange={handleInputChange}
            disabled={!editing}
          />
          <TextField
            label="Phone"
            variant="outlined"
            fullWidth
            margin="normal"
            name="phone"
            value={editing ? formData.phone : user.phone}
            onChange={handleInputChange}
            disabled={!editing}
          />
          <TextField
            label="Occupation"
            variant="outlined"
            fullWidth
            margin="normal"
            name="occupation"
            value={editing ? formData.occupation : user.occupation}
            onChange={handleInputChange}
            disabled={!editing}
          />
          <TextField
            label="Location"
            variant="outlined"
            fullWidth
            margin="normal"
            name="location"
            value={editing ? formData.location : user.location}
            onChange={handleInputChange}
            disabled={!editing}
          />
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color={editing ? "success" : "primary"}
            startIcon={editing ? <SaveIcon /> : <EditIcon />}
            onClick={handleEditToggle}
            sx={{
              px: 3,
              py: 1,
              borderRadius: 2,
              textTransform: 'none'
            }}
          >
            {editing ? 'Save Profile' : 'Edit Profile'}
          </Button>
        </Box>
      </Paper>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleNotificationClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleNotificationClose}
          severity={notification.severity as 'success' | 'info' | 'warning' | 'error'}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Profile;
