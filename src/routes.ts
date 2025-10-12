/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/


import {FC, lazy} from 'react';

const Home = lazy(() => import('./pages/home/Home'));
const Settings = lazy(() => import('./pages/setting/Settings'));
const Insights = lazy(() => import('./pages/insights/Insights'));
const Budget = lazy(() => import('./pages/budget/Budget'));
const Configuration = lazy(() => import('./pages/setting/setting-views/Configuration'));
const ManageTags = lazy(() => import('./pages/setting/setting-views/ManageTags'));
const ManageVendorTags = lazy(() => import('./pages/setting/setting-views/ManageVendorTags'));
const ReloadExpense = lazy(() => import('./pages/setting/setting-views/ReloadExpense'));
const AutoTagExpenses = lazy(() => import('./pages/setting/setting-views/AutoTagExpenses'));

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
    key: 'budget-route',
    title: 'Budget',
    path: '/budget',
    enabled: true,
    component: Budget,
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
