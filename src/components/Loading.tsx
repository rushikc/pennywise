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

import CircularProgress from '@mui/material/CircularProgress/CircularProgress';
import React from 'react';

export default function Loading() {

  return (
    <div className="d-flex-center pt-10">
      <CircularProgress style={{marginTop: '1rem'}}/>
    </div>
  );
}
