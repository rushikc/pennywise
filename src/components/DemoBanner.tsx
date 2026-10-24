/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import React from 'react';
import {useAuth} from '../pages/login/AuthContext';
import './DemoBanner.scss';

const DemoBanner: React.FC = () => {
  const {dataMode} = useAuth();

  if (dataMode !== 'demo') {
    return null;
  }

  return (
    <div className="demo-banner" role="status">
      You&apos;re viewing demo data.
    </div>
  );
};

export default DemoBanner;
