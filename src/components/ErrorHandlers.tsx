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

import {Box, Button, Modal, Typography} from '@mui/material';
import React from 'react';
import {createRoot} from 'react-dom/client';
import {auth} from '../firebase/firebaseConfig';

interface ErrorModalProps {
  open: boolean;
  onClose: () => void;
  message: string;
}

// Modal component to display error messages
const ErrorModal: React.FC<ErrorModalProps> = ({open, onClose, message}) => {
  const handleSignOut = async () => {
    try {
      await auth.signOut();
      window.location.href = '/login';
      onClose();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="error-modal-title"
      aria-describedby="error-modal-description"
    >
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 320,
        bgcolor: '#121212', // Dark background
        color: '#ffffff', // White text
        borderRadius: 2,
        boxShadow: '0px 0px 20px rgba(0,0,0,0.5)',
        p: 4,
        outline: 'none',
        textAlign: 'center',
      }}>
        <Typography
          id="error-modal-title"
          variant="h6"
          component="h2"
          gutterBottom
          sx={{color: '#ff5252'}} // Red accent for title
        >
          Access Denied
        </Typography>
        <Typography
          id="error-modal-description"
          sx={{mt: 2, mb: 3, color: '#e0e0e0'}}
        >
          {message}
        </Typography>

        {/* Sign Out Button */}
        <Button
          variant="contained"
          color="error"
          fullWidth
          onClick={handleSignOut}
          sx={{
            mt: 2,
            bgcolor: '#ff5252',
            '&:hover': {
              bgcolor: '#ff1744',
            }
          }}
        >
          Sign In Again
        </Button>
      </Box>
    </Modal>
  );
};

// Root div for modal portal
let modalRoot: HTMLElement | null = null;

// Error handling utility
export const ErrorHandlers = {
  // Handle API errors, especially 4XX series
  handleApiError: (error: any) => {
    console.error('API Error:', error);

    // Check if it's a Firebase/API error with status code
    const status = error?.code || error?.response?.status;
    const isAuthError =
      status === 401 ||
      status === 403 ||
      status?.includes('permission-denied') ||
      status?.includes('unauthenticated') ||
      status?.includes('auth/');

    if (isAuthError || (typeof status === 'number' && status >= 400 && status < 500)) {
      ErrorHandlers.showAccessDeniedModal();
    }

    return error;
  },

  // Display access denied modal
  showAccessDeniedModal: (customMessage?: string) => {
    if (!modalRoot) {
      modalRoot = document.createElement('div');
      modalRoot.id = 'error-modal-root';
      document.body.appendChild(modalRoot);
    }

    const message = customMessage || 'You don\'t have access to this application or your session has expired.';

    const modalContainer = document.createElement('div');
    modalRoot.appendChild(modalContainer);

    // Create a root using createRoot
    const root = createRoot(modalContainer);

    const handleClose = () => {
      // Auto-close after showing the messageeconds
    };

    // Render the modal
    root.render(
      <ErrorModal
        open={true}
        onClose={handleClose}
        message={message}
      />
    );

  }
};
