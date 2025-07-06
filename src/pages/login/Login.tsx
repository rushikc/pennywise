import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Container, Typography, CircularProgress, Paper } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signInWithGoogle } = useAuth();
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
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, width: '100%', borderRadius: 2 }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            PennyWise Login
          </Typography>

          {error && (
            <Typography color="error" align="center" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}

          <Button
            fullWidth
            variant="contained"
            startIcon={<GoogleIcon />}
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
            {loading ? <CircularProgress size={24} /> : 'Sign in with Google'}
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;


