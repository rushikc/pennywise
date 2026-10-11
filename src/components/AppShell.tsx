/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import React from 'react';
import {useLocation} from 'react-router-dom';
import {useIsDesktop} from '../hooks/useIsDesktop';
import SideNav from './SideNav';
import DesktopDashboard from '../pages/home/home-views/DesktopDashboard';

const AppShell: React.FC<{children: React.ReactNode}> = ({children}) => {
  const isDesktop = useIsDesktop();
  const {pathname} = useLocation();
  const showDashboard = isDesktop && pathname === '/home';

  if (!isDesktop) {
    return <>{children}</>;
  }

  return (
    <div className={`app-shell${showDashboard ? ' app-shell--with-dashboard' : ''}`}>
      <SideNav/>
      <main className="app-shell-main">{children}</main>
      {showDashboard && <DesktopDashboard/>}
    </div>
  );
};

export default AppShell;
