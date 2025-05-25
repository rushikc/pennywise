import React from 'react';
import {Avatar, Box, Card, CardActionArea, Container, Grid, Paper, Typography, useTheme} from '@mui/material';
import {
  BarChart as StatsIcon,
  LocalOffer as TagsIcon,
  Person as ProfileIcon,
  Settings as ConfigIcon
} from '@mui/icons-material';
import {useNavigate} from 'react-router-dom';
import {motion} from 'framer-motion';
import './dashboard.scss';

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

  const user = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    photoUrl: '/profile-avatar.jpg'
  };

  const dashboardTiles: DashboardTile[] = [
    {
      id: 'profile',
      title: 'Profile',
      icon: <ProfileIcon />,
      route: '/profile',
      color: '#90caf9'
    },
    {
      id: 'stats',
      title: 'Statistics',
      icon: <StatsIcon />,
      route: '/stats',
      color: '#81c784'
    },
    {
      id: 'config',
      title: 'Configuration',
      icon: <ConfigIcon />,
      route: '/config',
      color: '#f48fb1'
    },
    {
      id: 'tags',
      title: 'Tags',
      icon: <TagsIcon />,
      route: '/tag',
      color: '#ce93d8'
    }
  ];

  const handleTileClick = (route: string) => {
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
      <Paper
        component={motion.div}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="dashboard-title-text"
      >
        Dashboard
      </Typography>

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
                >
                  <CardActionArea
                    onClick={() => handleTileClick(tile.route)}
                    className="dashboard-tile-action-area"
                  >
                    <Avatar
                      className="dashboard-tile-avatar"
                      style={{ color: tile.color }}
                    >
                      {tile.icon}
                    </Avatar>
                    <Typography
                      variant="h6"
                      component="div"
                      className="dashboard-tile-title"
                      style={{ color: tile.color }}
                    >
                      {tile.title}
                    </Typography>
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
