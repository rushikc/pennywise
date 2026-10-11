/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import React from 'react';
import HomeIcon from '@mui/icons-material/Home';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import {AccountBalanceWallet, AnalyticsOutlined} from '@mui/icons-material';

export interface NavItem {
  value: string;
  label: string;
  path: string;
  icon: () => React.ReactElement;
}

export const navItems: NavItem[] = [
  {value: 'home', label: 'Home', path: '/home', icon: () => <HomeIcon/>},
  {value: 'stats', label: 'Stats', path: '/stats', icon: () => <AnalyticsOutlined/>},
  {value: 'budget', label: 'Budget', path: '/budget', icon: () => <AccountBalanceWallet/>},
  {value: 'profile', label: 'Profile', path: '/profile', icon: () => <AccountCircleIcon/>},
];

/** Settings subpages stay on Profile. */
export const getNavValue = (pathname: string): string => {
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
