/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import React, {useEffect} from 'react';
import {createPortal} from 'react-dom';
import {useLocation, useNavigate} from 'react-router-dom';
import {getNavValue, navItems} from './navItems';
import './BottomNav.scss';

export default function BottomNav() {
  const [value, setValue] = React.useState('home');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setValue(getNavValue(location.pathname));
  }, [location.pathname]);

  const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
    const item = navItems.find((navItem) => navItem.value === newValue);
    if (!item) return;
    navigate(item.path);
    setValue(newValue);
  };

  return createPortal(
    <BottomNavigation
      className="bottom-nav"
      value={value}
      onChange={handleChange}
      showLabels
    >
      {navItems.map((item) => (
        <BottomNavigationAction
          key={item.value}
          value={item.value}
          label={item.label}
          icon={item.icon()}
        />
      ))}
    </BottomNavigation>,
    document.body,
  );
}
