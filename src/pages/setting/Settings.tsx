import React, { useState } from 'react';
import {
  Alert,
  Box,
  Container,
  Paper,
  Snackbar,
  Typography
} from '@mui/material';
import {
  BarChart as StatsIcon,
  LocalOffer as TagsIcon,
  Logout as LogoutIcon,
  Person as ProfileIcon,
  Refresh as ReloadIcon,
  Settings as ConfigIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './settings.scss';
import ReloadExpense from './setting-views/ReloadExpense';
import { useAuth } from '../../hooks/useAuth';
import ProfileAvatar from '../../components/ProfileAvatar';
import DashboardTile from '../../components/DashboardTile';

/**
 * Settings page component with user profile and settings options
 */
const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [reloadExpenseModalOpen, setReloadExpenseModalOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  // Use the custom hook for authentication
  const { userProfile, signOut, isLoading } = useAuth();

  // Handle sign out
  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      const result = await signOut();

      if (!result.success && result.error) {
        setSignOutError(result.error);
      } else {
        navigate('/login');
      }
    } catch (error) {
      setSignOutError('Failed to sign out. Please try again.');
      console.error('Error signing out:', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  // Define dashboard tiles configuration
  const dashboardTiles = [
    {
      id: 'profile',
      title: 'Profile',
      subtitle: 'Manage your account settings',
      icon: <ProfileIcon />,
      route: '/profile',
      color: '#90caf9'
    },
    {
      id: 'stats',
      title: 'Statistics',
      subtitle: 'View your financial analytics',
      icon: <StatsIcon />,
      route: '/stats',
      color: '#81c784'
    },
    {
      id: 'config',
      title: 'Configuration',
      subtitle: 'Configure app preferences',
      icon: <ConfigIcon />,
      route: '/config',
      color: '#f48fb1'
    },
    {
      id: 'tags',
      title: 'Tags',
      subtitle: 'Manage your expense categories',
      icon: <TagsIcon />,
      route: '/setting-tags',
      color: '#ce93d8'
    },
    {
      id: 'reload',
      title: 'Reload Expense',
      subtitle: 'Reload your expense data',
      icon: <ReloadIcon />,
      route: '/reload',
      color: '#ffa726'
    },
    {
      id: 'sign out',
      title: 'Sign Out',
      subtitle: 'Log out of your account',
      icon: <LogoutIcon />,
      route: '/signout',
      color: '#f44336'
    }
  ];

  const handleTileClick = (route: string) => {
    if (route === '/reload') {
      setReloadExpenseModalOpen(true);
      return;
    }

    if (route === '/signout') {
      void handleSignOut();
      return;
    }

    navigate(route);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  // Show nothing during initial loading to prevent flash of content
  if (isLoading) return null;

  return (
    <Container maxWidth="sm" className="dashboard-main-container">
      {/* User Profile Card */}
      <Paper
        component={motion.div}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        elevation={3}
        className="user-profile-paper"
      >
        <Box className="user-profile-box">
          <ProfileAvatar
            photoUrl={userProfile.photoUrl}
            name={userProfile.name}
            className="user-avatar"
          />
          <Box className="user-info-box">
            <Typography variant="h5">
              {userProfile.name}
            </Typography>
            <Typography variant="body2" className="user-email">
              {userProfile.email}
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Typography
        variant="h6"
        component={motion.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="dashboard-title-text"
      >
        Settings
      </Typography>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="dashboard-options-container"
      >
        {dashboardTiles.map((tile, index) => (
          <DashboardTile
            key={tile.id}
            id={tile.id}
            title={tile.title}
            subtitle={tile.subtitle}
            icon={tile.icon}
            color={tile.color}
            onClick={() => handleTileClick(tile.route)}
            isLast={index === dashboardTiles.length - 1}
          />
        ))}
      </motion.div>

      <ReloadExpense
        open={reloadExpenseModalOpen}
        onClose={() => setReloadExpenseModalOpen(false)}
      />

      {/* Sign out progress and error handling */}
      <Snackbar
        open={isSigningOut}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        autoHideDuration={6000}
        onClose={() => setSignOutError(null)}
      >
        <Alert onClose={() => setSignOutError(null)} severity="info" sx={{ width: '100%' }}>
          Signing out...
        </Alert>
      </Snackbar>
      <Snackbar
        open={Boolean(signOutError)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        autoHideDuration={6000}
        onClose={() => setSignOutError(null)}
      >
        <Alert onClose={() => setSignOutError(null)} severity="error" sx={{ width: '100%' }}>
          {signOutError}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Settings;
