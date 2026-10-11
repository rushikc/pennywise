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

const getNavValue = (pathname: string): string => {
  if (pathname.startsWith('/stats')) {
    return 'stats';
  }
  if (pathname.startsWith('/budget')) {
    return 'budget';
  }
  if (pathname.startsWith('/home')) {
    return 'home';
  }
  return 'profile';
};

export default function BottomNav() {
  const [value, setValue] = React.useState('home');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setValue(getNavValue(location.pathname));
  }, [location.pathname]);

  const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
    navigate(`/${newValue}`);
    setValue(newValue);
  };

  return (
    <BottomNavigation value={value} onChange={handleChange} showLabels>
      <BottomNavigationAction
        value="home"
        label="Home"
        icon={<HomeIcon/>}
      />
      <BottomNavigationAction
        value="stats"
        label="Stats"
        icon={<AnalyticsOutlined/>}
      />
      <BottomNavigationAction
        value="budget"
        label="Budget"
        icon={<AccountBalanceWallet/>}
      />
      <BottomNavigationAction
        value="profile"
        label="Profile"
        icon={<AccountCircleIcon/>}
      />
    </BottomNavigation>
  );
}
