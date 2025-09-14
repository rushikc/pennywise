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

// pages
import Home from './pages/home/Home';
import Settings from './pages/setting/Settings';
import Insights from './pages/insights/Insights';
import Configuration from './pages/setting/setting-views/Configuration';
import ManageTags from './pages/setting/setting-views/ManageTags';
import ManageVendorTags from './pages/setting/setting-views/ManageVendorTags';
import ReloadExpense from './pages/setting/setting-views/ReloadExpense';
import AutoTagExpenses from './pages/setting/setting-views/AutoTagExpenses';

// other
import {FC} from 'react';

// interface
interface Route {
  key: string,
  title: string,
  path: string,
  enabled: boolean,
  component: FC<Record<string, never>>,
  isProtected: boolean,
}

export const routes: Array<Route> = [
  {
    key: 'home-route',
    title: 'Home',
    path: '/home',
    enabled: true,
    component: Home,
    isProtected: true,
  },
  {
    key: 'profile-route',
    title: 'Profile',
    path: '/profile',
    enabled: true,
    component: Settings,
    isProtected: true,
  },
  {
    key: 'stats-route',
    title: 'Stats',
    path: '/stats',
    enabled: true,
    component: Insights,
    isProtected: true,
  },
  {
    key: 'config-route',
    title: 'Config',
    path: '/config',
    enabled: true,
    component: Configuration,
    isProtected: true,
  },
  {
    key: 'setting-tags-route',
    title: 'Setting Tags',
    path: '/setting-tags',
    enabled: true,
    component: ManageTags,
    isProtected: true,
  },
  {
    key: 'setting-tag-maps-route',
    title: 'Setting Tag Maps',
    path: '/setting-tag-maps',
    enabled: true,
    component: ManageVendorTags,
    isProtected: true,
  },
  {
    key: 'reload-expense-route',
    title: 'Reload Expense',
    path: '/reload-expense',
    enabled: true,
    component: ReloadExpense,
    isProtected: true,
  },
  {
    key: 'auto-tag-expenses-route',
    title: 'Auto Tag Expenses',
    path: '/auto-tag-expenses',
    enabled: true,
    component: AutoTagExpenses,
    isProtected: true,
  }
];
