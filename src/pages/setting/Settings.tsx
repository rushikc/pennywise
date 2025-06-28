import React, { useState } from 'react';
import {Avatar, Box, Container, Paper, Typography} from '@mui/material';
import {
  BarChart as StatsIcon,
  LocalOffer as TagsIcon,
  Person as ProfileIcon,
  Settings as ConfigIcon,
  Refresh as ReloadIcon
} from '@mui/icons-material';
import {useNavigate} from 'react-router-dom';
import {motion} from 'framer-motion';
import './settings.scss';
import ReloadExpense from './setting-views/ReloadExpense';

interface DashboardTile {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  route: string;
  color: string;
}

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [reloadExpenseModalOpen, setReloadExpenseModalOpen] = useState(false);

  const user = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    photoUrl: '/profile-avatar.jpg'
  };

  const dashboardTiles: DashboardTile[] = [
    {
      id: 'profile',
      title: 'Profile',
      subtitle: 'Manage your account settings',
      icon: <ProfileIcon/>,
      route: '/profile',
      color: '#90caf9'
    },
    {
      id: 'stats',
      title: 'Statistics',
      subtitle: 'View your financial analytics',
      icon: <StatsIcon/>,
      route: '/stats',
      color: '#81c784'
    },
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
      subtitle: 'Manage your expense categories',
      icon: <TagsIcon/>,
      route: '/setting-tags',
      color: '#ce93d8'
    },
    {
      id: 'reload',
      title: 'Reload Expense',
      subtitle: 'Reload your expense data',
      icon: <ReloadIcon/>,
      route: '/reload',
      color: '#ffa726'
    }
  ];

  const handleTileClick = (route: string) => {
    // Special case for reload expense
    if (route === '/reload') {
      setReloadExpenseModalOpen(true);
      return;
    }
    navigate(route);
  };

  const containerVariants = {
    hidden: {opacity: 0},
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: {y: 20, opacity: 0},
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 120,
        damping: 12
      }
    }
  };

  return (
    <Container maxWidth="sm" className="dashboard-main-container">
      <Paper
        component={motion.div}
        initial={{opacity: 0, y: -20}}
        animate={{opacity: 1, y: 0}}
        transition={{duration: 0.5}}
        elevation={3}
        className="user-profile-paper"
      >
        <Box className="user-profile-box">
          <Avatar
            src={user.photoUrl}
            className="user-avatar"
          />
          <Box className="user-info-box">
            <Typography variant="h5">
              {user.name}
            </Typography>
            <Typography variant="body2" className="user-email">
              {user.email}
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Typography
        variant="h6"
        component={motion.div}
        initial={{opacity: 0}}
        animate={{opacity: 1}}
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
          <React.Fragment key={tile.id}>
            <motion.div
              variants={itemVariants}
              className="dashboard-option-row"
              onClick={() => handleTileClick(tile.route)}
            >
              <Avatar
                className="dashboard-option-icon"
                style={{color: tile.color}}
              >
                {tile.icon}
              </Avatar>
              <Box className="dashboard-option-text">
                <Typography variant="body1" className="dashboard-option-title">
                  {tile.title}
                </Typography>
                <Typography variant="caption" className="dashboard-option-subtitle">
                  {tile.subtitle}
                </Typography>
              </Box>
            </motion.div>
            {index < dashboardTiles.length - 1 && <div className="dashboard-option-divider"/>}
          </React.Fragment>
        ))}
      </motion.div>

      <ReloadExpense
        open={reloadExpenseModalOpen}
        onClose={() => setReloadExpenseModalOpen(false)}
      />
    </Container>
  );
};

export default Settings;
