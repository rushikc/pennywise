/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import useMediaQuery from '@mui/material/useMediaQuery';
import {useTheme} from '@mui/material/styles';
import React, {useEffect} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {getNavValue, navItems} from './navItems';

export default function BottomNav() {
  const [value, setValue] = React.useState('home');
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    setValue(getNavValue(location.pathname));
  }, [location.pathname]);

  const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
    const item = navItems.find((navItem) => navItem.value === newValue);
    if (!item) return;
    navigate(item.path);
    setValue(newValue);
  };

  return (
    <BottomNavigation
      value={value}
      onChange={handleChange}
      showLabels={!isPhone}
      sx={isPhone ? {'& .MuiBottomNavigationAction-label': {display: 'none'}} : undefined}
    >
      {navItems.map((item) => (
        <BottomNavigationAction
          key={item.value}
          value={item.value}
          label={item.label}
          showLabel={!isPhone}
          icon={item.icon()}
        />
      ))}
    </BottomNavigation>
  );
}
