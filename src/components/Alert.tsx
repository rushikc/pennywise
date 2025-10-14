/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import React from 'react';
import {useSelector} from 'react-redux';
import {Alert as MuiAlert, Box, IconButton, Stack} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import {RootState} from '../store/store';
import {Alert as AlertType} from '../Types';
import './Alert.scss';
import {removeAlert} from '../store/alertActions';

/**
 * Generic Alert component that displays alerts from the expense store
 * Supports stacking multiple alerts and auto-removal after timeout
 */
const AlertComponent: React.FC = () => {

  const alerts = useSelector((state: RootState) => state.expense.alerts);

  // Don't render anything if no alerts
  if (alerts.length === 0) {
    return null;
  }

  const getAlertIcon = (type: AlertType['type']) => {
    switch (type) {
    case 'success':
      return <CheckCircleIcon/>;
    case 'error':
      return <ErrorIcon/>;
    case 'warning':
      return <WarningIcon/>;
    case 'info':
      return <InfoIcon/>;
    default:
      return <InfoIcon/>;
    }
  };

  const getAlertSeverity = (type: AlertType['type']) => {
    return type;
  };

  const handleCloseAlert = (alertId: string) => {
    removeAlert(alertId);
  };

  return (
    <Box className="alert-container">
      <Stack spacing={1} className="alert-stack">
        {alerts.map((alert, index) => (
          <MuiAlert
            key={alert.id}
            severity={getAlertSeverity(alert.type)}
            icon={getAlertIcon(alert.type)}
            className={`alert-item alert-${alert.type}`}
            style={{
              zIndex: 1000 + index,
              transform: `translateY(${index * 8}px)`,
            }}
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => handleCloseAlert(alert.id)}
              >
                <CloseIcon fontSize="inherit"/>
              </IconButton>
            }
          >
            {alert.message}
          </MuiAlert>
        ))}
      </Stack>
    </Box>
  );
};

export default AlertComponent;
