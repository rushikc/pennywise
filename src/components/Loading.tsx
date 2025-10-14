/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import CircularProgress from '@mui/material/CircularProgress/CircularProgress';
import React from 'react';

export default function Loading() {

  return (
    <div className="d-flex-center pt-10">
      <CircularProgress style={{marginTop: '1rem'}}/>
    </div>
  );
}
