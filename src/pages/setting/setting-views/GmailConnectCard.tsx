/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import React, {useCallback, useEffect, useState} from 'react';
import {Box, Button, Paper, Typography} from '@mui/material';
import {useAuth} from '../../login/AuthContext';
import {
  connectGmail,
  disconnectGmail,
  loadGisScript,
  readGmailStatus,
  requestGmailCode,
  GmailStatusDoc,
} from '../../../api/gmailConnect';
import '../gmailConnect.scss';

const idleStatus: GmailStatusDoc = {status: 'unknown', email: null, lastError: null};

const GmailConnectCard: React.FC = () => {
  const {currentUser, dataMode} = useAuth();
  const [status, setStatus] = useState<GmailStatusDoc>(idleStatus);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!currentUser?.uid) {
      return;
    }
    const next = await readGmailStatus(currentUser.uid);
    setStatus(next);
  }, [currentUser?.uid]);

  useEffect(() => {
    if (dataMode !== 'live' || !currentUser?.uid) {
      return;
    }
    void refresh();
  }, [currentUser?.uid, dataMode, refresh]);

  if (dataMode !== 'live' || !currentUser) {
    return null;
  }

  const handleConnect = async () => {
    setBusy(true);
    try {
      await loadGisScript();
      const code = await requestGmailCode();
      await connectGmail(code);
      await refresh();
    } catch (error) {
      console.error('Gmail connect failed');
      setStatus((prev) => ({
        ...prev,
        lastError: error instanceof Error ? error.message : 'connect_failed',
      }));
    } finally {
      setBusy(false);
    }
  };

  const handleDisconnect = async () => {
    setBusy(true);
    try {
      await disconnectGmail();
      await refresh();
    } catch (error) {
      console.error('Gmail disconnect failed');
    } finally {
      setBusy(false);
    }
  };

  const connected = status.status === 'connected';
  const disconnected = status.status === 'disconnected';

  return (
    <Paper elevation={0} className="gmail-connect-card">
      <Box className="gmail-connect-copy">
        <Typography className="gmail-connect-title">
          {connected ? 'Gmail connected' : disconnected ? 'Reconnect Gmail' : 'Connect Gmail'}
        </Typography>
        <Typography className="gmail-connect-body">
          {connected
            ? (status.email || 'Read-only inbox access is on.')
            : 'Use Gmail read-only access to import bank emails.'}
        </Typography>
        {status.lastError ? (
          <Typography className="gmail-connect-error">{status.lastError}</Typography>
        ) : null}
      </Box>
      <Button
        variant="contained"
        className="gmail-connect-button"
        disabled={busy}
        onClick={() => {
          void (connected ? handleDisconnect() : handleConnect());
        }}
      >
        {connected ? 'Disconnect' : disconnected ? 'Reconnect' : 'Connect'}
      </Button>
    </Paper>
  );
};

export default GmailConnectCard;
