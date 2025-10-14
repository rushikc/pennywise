/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import HomeIcon from '@mui/icons-material/Home';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import React, {useEffect} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {AccountBalanceWallet, AnalyticsOutlined} from '@mui/icons-material';

export default function BottomNav() {
  const [value, setValue] = React.useState('home');
  const navigate = useNavigate();
  const location = useLocation();

  // Update the state based on URL path when component mounts or URL changes
  useEffect(() => {
    const path = location.pathname;

    // Map URL paths to navigation values
    if (path.includes('stats')) {
      setValue('stats');
    } else if (path.includes('profile')) {
      setValue('profile');
    } else if (path.includes('budget')) {
      setValue('budget');
    } else {
      // Default to home for any other paths
      setValue('home');
    }
  }, [location]);

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    navigate(newValue);
    setValue(newValue);
  };

  return (
    <BottomNavigation value={value} onChange={handleChange}>
      <BottomNavigationAction
        value="home"
        icon={<HomeIcon/>}
      />
      <BottomNavigationAction
        value="stats"
        icon={<AnalyticsOutlined/>}
      />
      <BottomNavigationAction
        value="budget"
        icon={<AccountBalanceWallet/>}
      />
      <BottomNavigationAction
        value="profile"
        icon={<AccountCircleIcon/>}
      />
    </BottomNavigation>
  );
}
