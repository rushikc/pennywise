/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import React from 'react';
import {useAuth} from '../pages/login/AuthContext';
import {IS_DEMO_BUILD} from '../utility/buildMode';
import './DemoBanner.scss';

const DemoBanner: React.FC = () => {
  const {dataMode} = useAuth();

  if (dataMode !== 'demo') {
    return null;
  }

  if (__DEMO_BUILD__ || IS_DEMO_BUILD) {
    return (
      <div className="demo-banner" role="status">
        Demo: sample data only. Changes aren&apos;t saved.
        {' '}
        <a
          className="demo-banner__link"
          href="https://github.com/rushikc/pennywise"
          target="_blank"
          rel="noopener noreferrer"
        >
          View on GitHub
        </a>
      </div>
    );
  }

  return (
    <div className="demo-banner" role="status">
      You&apos;re viewing demo data.
    </div>
  );
};

export default DemoBanner;
