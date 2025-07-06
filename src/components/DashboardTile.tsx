import React from 'react';
import { Avatar, Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';

export interface DashboardTileProps {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
  isLast?: boolean;
}

/**
 * A reusable dashboard tile component for settings options
 */
const DashboardTile: React.FC<DashboardTileProps> = ({
  title,
  subtitle,
  icon,
  color,
  onClick,
  isLast = false
}) => {
  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 70,
        damping: 14
      }
    }
  };

  return (
    <React.Fragment>
      <motion.div
        variants={itemVariants}
        className="dashboard-option-row"
        onClick={onClick}
      >
        <Avatar
          className="dashboard-option-icon"
          style={{ color }}
        >
          {icon}
        </Avatar>
        <Box className="dashboard-option-text">
          <Typography variant="body1" className="dashboard-option-title">
            {title}
          </Typography>
          <Typography variant="caption" className="dashboard-option-subtitle">
            {subtitle}
          </Typography>
        </Box>
      </motion.div>
      {!isLast && <div className="dashboard-option-divider" />}
    </React.Fragment>
  );
};

export default DashboardTile;
