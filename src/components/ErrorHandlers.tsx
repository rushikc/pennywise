import { Modal, Box, Typography } from '@mui/material';
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

interface ErrorModalProps {
  open: boolean;
  onClose: () => void;
  message: string;
}

// Modal component to display error messages
const ErrorModal: React.FC<ErrorModalProps> = ({ open, onClose, message }) => {
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
          sx={{ color: '#ff5252' }} // Red accent for title
        >
          Access Denied
        </Typography>
        <Typography
          id="error-modal-description"
          sx={{ mt: 2, mb: 3, color: '#e0e0e0' }}
        >
          {message}
        </Typography>
        {/* No buttons - modal will automatically close after timeout */}
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
      // Auto-close after showing the message
      setTimeout(() => {
        root.unmount();
        modalRoot?.removeChild(modalContainer);
      }, 5000); // Close after 5 seconds
    };

    // Render the modal
    root.render(
      <ErrorModal
        open={true}
        onClose={handleClose}
        message={message}
      />
    );

    // Start the auto-close timer
    handleClose();
  }
};
