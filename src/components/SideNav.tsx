/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import React from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {getNavValue, navItems} from './navItems';
import './SideNav.scss';

const SideNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const value = getNavValue(location.pathname);

  return (
    <nav className="side-nav" aria-label="Primary">
      <div className="side-nav-brand">Pennywise</div>
      {navItems.map((item) => (
        <button
          key={item.value}
          type="button"
          className={`side-nav-item${value === item.value ? ' active' : ''}`}
          onClick={() => navigate(item.path)}
        >
          {item.icon()}
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default SideNav;
