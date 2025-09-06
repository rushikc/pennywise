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
import {Alert, Box, Container, Paper, Snackbar, Typography} from '@mui/material';
import {
  AutoAwesome as AutoTagIcon,
  Brightness4 as ThemeIcon,
  LocalOffer as TagsIcon,
  Logout as LogoutIcon,
  Map as MapIcon,
  Refresh as ReloadIcon,
  Settings as ConfigIcon
} from '@mui/icons-material';
import {useNavigate} from 'react-router-dom';
import {motion} from 'framer-motion';
import './settings.scss';
import {useAuth} from '../../hooks/useAuth';
import ProfileAvatar from '../../components/ProfileAvatar';
import DashboardTile from '../../components/DashboardTile';
import {useSelector} from 'react-redux';
import {selectExpense, toggleDarkMode} from '../../store/expenseActions';
import {ExpenseAPI} from "../../api/ExpenseAPI";

/**
 * Settings page component with user profile and settings options
 */
const Settings: React.FC = () => {
  const navigate = useNavigate();
  const {appConfig} = useSelector(selectExpense);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  console.log("Profile loaded")
  // Use the custom hook for authentication
  const {userProfile, signOut, isLoading} = useAuth();

  // Handle sign out
  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      const result = await signOut();

      if (!result.success && result.error) {
        setSignOutError(result.error);
      } else {
        // navigate('/login');
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
      id: 'config',
      title: 'Configuration',
      subtitle: 'Configure app preferences',
      icon: <ConfigIcon/>,
      route: '/config',
      color: '#f48fb1'
    },
    {
      id: 'tags',
      title: 'Tags',
      subtitle: 'Manage your expense tags',
      icon: <TagsIcon/>,
      route: '/setting-tags',
      color: '#ce93d8'
    },
    {
      id: 'theme',
      title: `${appConfig.darkMode ? 'Light' : 'Dark'} Theme`,
      subtitle: `Switch to ${appConfig.darkMode ? 'light' : 'dark'} mode`,
      icon: <ThemeIcon/>,
      route: '/toggle-theme',
      color: '#9c27b0'
    },
    {
      id: 'reload',
      title: 'Reload Expense',
      subtitle: 'Reload your expense data',
      icon: <ReloadIcon/>,
      route: '/reload-expense',
      color: '#ffa726'
    },
    {
      id: 'manage-tag-maps',
      title: 'Manage Vendor Tags',
      subtitle: 'Configure your vendor tag mappings',
      icon: <MapIcon/>,
      route: '/setting-tag-maps',
      color: '#64b5f6'
    },
    {
      id: 'auto-tag',
      title: 'Auto-tag Expenses',
      subtitle: 'Automatically tag past expenses',
      icon: <AutoTagIcon/>,
      route: '/auto-tag-expenses',
      color: '#4db6ac'
    },
    {
      id: 'sign out',
      title: 'Sign Out',
      subtitle: 'Log out of your account',
      icon: <LogoutIcon/>,
      route: '/signout',
      color: '#f44336'
    }
  ];

  // Handle theme toggle
  const toggleTheme = async () => {
    try {
      const success = await ExpenseAPI.updateDarkMode(!appConfig.darkMode);
      if (success) {
        toggleDarkMode();
      } else {
        console.error('Failed to update dark mode setting');
      }
    } catch (error) {
      console.error('Error updating dark mode setting:', error);
    }
  };

  const handleTileClick = (route: string) => {
    if (route === '/reload-expense') {
      navigate('/reload-expense');
      return;
    }

    if (route === '/auto-tag-expenses') {
      navigate('/auto-tag-expenses');
      return;
    }

    if (route === '/signout') {
      void handleSignOut();
      return;
    }

    if (route === '/toggle-theme') {
      void toggleTheme();
      return;
    }

    navigate(route);
  };

  const containerVariants = {
    hidden: {opacity: 0},
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
        duration: 0.4
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
        initial={{opacity: 0, y: -20}}
        animate={{opacity: 1, y: 0}}
        transition={{duration: 0.5}}
        elevation={3}
        className="user-profile-paper"
        sx={{bgcolor: 'transparent'}}
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


      {/* Sign out progress and error handling */}
      <Snackbar
        open={isSigningOut}
        anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
        autoHideDuration={6000}
        onClose={() => setSignOutError(null)}
      >
        <Alert onClose={() => setSignOutError(null)} severity="info" sx={{width: '100%'}}>
          Signing out...
        </Alert>
      </Snackbar>
      <Snackbar
        open={Boolean(signOutError)}
        anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
        autoHideDuration={6000}
        onClose={() => setSignOutError(null)}
      >
        <Alert onClose={() => setSignOutError(null)} severity="error" sx={{width: '100%'}}>
          {signOutError}
        </Alert>
      </Snackbar>

      {/* Version display */}
      <Paper
        elevation={0}
        className="version-display"
      >
        <Typography
          variant="caption"
          className="version-text"
        >
          Pennywise v1.0.0
        </Typography>
      </Paper>
    </Container>
  );
};

export default Settings;
