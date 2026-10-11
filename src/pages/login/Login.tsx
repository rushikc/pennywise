/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import React, {useState} from 'react';
import {useAuth} from './AuthContext';
import {useNavigate} from 'react-router-dom';
import {Box, Button, CircularProgress, Container, Paper, Typography} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const {signInWithGoogle} = useAuth();
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      await signInWithGoogle();
      navigate('/home');
    } catch (err) {
      setError('Failed to sign in with Google. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{mt: 'var(--space-2xl)', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <Paper elevation={3} sx={{p: 'var(--space-2xl)', width: '100%', borderRadius: 'var(--radius-md)'}}>
          <Box
            component="img"
            src="/logo.png"
            alt="Pennywise logo"
            sx={{
              width: 160,
              height: 160,
              margin: '0 auto',
              display: 'block',
            }}
          />
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            Pennywise
          </Typography>

          {error && (
            <Typography color="error" align="center" sx={{mb: 'var(--space-lg)'}}>
              {error}
            </Typography>
          )}

          <Button
            fullWidth
            variant="contained"
            startIcon={<GoogleIcon/>}
            onClick={handleGoogleSignIn}
            disabled={loading}
            sx={{
              mt: 'var(--space-xl)',
              mb: 'var(--space-lg)',
              py: 'var(--space-md)',
              backgroundColor: 'var(--brand-google)',
              '&:hover': {
                backgroundColor: 'var(--brand-google-hover)',
              }
            }}
          >
            {loading ? <CircularProgress size={24}/> : 'Sign in with Google'}
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
