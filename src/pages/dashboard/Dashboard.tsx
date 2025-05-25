import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  useTheme,
  Paper,
  CardActionArea,
  Container,
  Divider
} from '@mui/material';
import {
  Person as ProfileIcon,
  BarChart as StatsIcon,
  Settings as ConfigIcon,
  LocalOffer as TagsIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './dashboard.scss';

// If you don't have framer-motion, you'll need to install it:
// npm install framer-motion

interface DashboardTile {
  id: string;
  title: string;
  icon: React.ReactNode;
  route: string;
  color: string;
}

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  // Mock user data - replace with your actual user data from auth/state
  const user = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    photoUrl: '/profile-avatar.jpg' // This uses the image in your public folder
  };

  const dashboardTiles: DashboardTile[] = [
    {
      id: 'profile',
      title: 'Profile',
      icon: <ProfileIcon fontSize="large" />,
      route: '/profile',
      color: theme.palette.primary.main
    },
    {
      id: 'stats',
      title: 'Statistics',
      icon: <StatsIcon fontSize="large" />,
      route: '/stats',
      color: theme.palette.secondary.main
    },
    {
      id: 'config',
      title: 'Configuration',
      icon: <ConfigIcon fontSize="large" />,
      route: '/config',
      color: theme.palette.error.main
    },
    {
      id: 'tags',
      title: 'Tags',
      icon: <TagsIcon fontSize="large" />,
      route: '/tag',
      color: theme.palette.success.main
    }
  ];

  const handleTileClick = (route: string) => {
    navigate(route);
  };

  // Animation variants for framer-motion
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100
      }
    }
  };

  return (
    <Container maxWidth="sm" className="dashboard-main-container">
      {/* User Profile Section */}
      <Paper
        component={motion.div}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        elevation={3}
        className="user-profile-paper"
        style={{
          background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.primary.main} 90%)`
        }}
      >
        <Box className="user-profile-box">
          <Avatar
            src={user.photoUrl}
            className="user-avatar user-avatar-border"
          />
          <Box className="user-info-box">
            <Typography variant="h5" fontWeight="bold" color="white">
              {user.name}
            </Typography>
            <Typography variant="body2" className="user-email">
              {user.email}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Dashboard Tiles */}
      <Typography
        variant="h6"
        component={motion.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="dashboard-title-text"
      >
        Dashboard
      </Typography>

      <Divider className="dashboard-divider" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Grid container spacing={2}>
          {dashboardTiles.map((tile) => (
            <Grid item xs={6} key={tile.id}>
              <motion.div variants={itemVariants}>
                <Card
                  elevation={4}
                  className="dashboard-tile-card"
                  style={{
                    background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, rgba(66,66,66,0.8) 100%)`
                  }}
                >
                  <CardActionArea
                    onClick={() => handleTileClick(tile.route)}
                    className="dashboard-tile-action-area"
                  >
                    <Box className="dashboard-tile-icon-box">
                      <Avatar
                        className="dashboard-tile-avatar"
                        style={{ color: tile.color }}
                      >
                        {tile.icon}
                      </Avatar>
                    </Box>
                    <CardContent className="dashboard-tile-content">
                      <Typography
                        variant="h6"
                        component="div"
                        className="dashboard-tile-title"
                        style={{ color: tile.color }}
                      >
                        {tile.title}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </motion.div>
    </Container>
  );
};

export default Dashboard;
