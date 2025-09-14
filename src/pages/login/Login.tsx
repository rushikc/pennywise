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
      <Box sx={{mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <Paper elevation={3} sx={{p: 4, width: '100%', borderRadius: 2}}>
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
            <Typography color="error" align="center" sx={{mb: 2}}>
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
              mt: 3,
              mb: 2,
              py: 1.5,
              backgroundColor: '#4285F4',
              '&:hover': {
                backgroundColor: '#357ae8',
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
