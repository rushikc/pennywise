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

import React from 'react';
import {Avatar, Box, Typography} from '@mui/material';


import {motion} from 'framer-motion';

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
    hidden: {y: 10, opacity: 0},
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring' as const,
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
          style={{color}}
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
      {!isLast && <div className="dashboard-option-divider"/>}
    </React.Fragment>
  );
};

export default DashboardTile;
