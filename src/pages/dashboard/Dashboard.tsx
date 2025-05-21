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
    <Container maxWidth="sm" sx={{
      pb: 10, // Add padding at bottom to accommodate the bottom nav bar
      pt: 2,
      height: '100vh',
      bgcolor: theme.palette.background.default
    }}>
      {/* User Profile Section */}
      <Paper
        component={motion.div}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        elevation={3}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 2,
          background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.primary.main} 90%)`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar
            src={user.photoUrl}
            sx={{
              width: 64,
              height: 64,
              border: `2px solid ${theme.palette.common.white}`
            }}
          />
          <Box sx={{ ml: 2 }}>
            <Typography variant="h5" fontWeight="bold" color="white">
              {user.name}
            </Typography>
            <Typography variant="body2" color="rgba(255,255,255,0.8)">
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
        sx={{ mb: 2, ml: 1 }}
      >
        Dashboard
      </Typography>

      <Divider sx={{ mb: 3 }} />

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
                  sx={{
                    height: 160,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, rgba(66,66,66,0.8) 100%)`,
                    position: 'relative',
                    overflow: 'hidden',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: '30%',
                      height: '30%',
                      backgroundColor: tile.color,
                      opacity: 0.2,
                      borderRadius: '0 0 0 100%'
                    }
                  }}
                >
                  <CardActionArea
                    onClick={() => handleTileClick(tile.route)}
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      p: 2
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        mb: 2
                      }}
                    >
                      <Avatar
                        sx={{
                          bgcolor: 'rgba(255,255,255,0.1)',
                          color: tile.color,
                          width: 56,
                          height: 56,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'scale(1.1)',
                            bgcolor: 'rgba(255,255,255,0.2)'
                          }
                        }}
                      >
                        {tile.icon}
                      </Avatar>
                    </Box>
                    <CardContent
                      sx={{
                        p: 0,
                        '&:last-child': { pb: 0 },
                        textAlign: 'center'
                      }}
                    >
                      <Typography
                        variant="h6"
                        component="div"
                        sx={{
                          fontWeight: 'medium',
                          color: tile.color
                        }}
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
