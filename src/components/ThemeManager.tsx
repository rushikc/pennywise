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


import {useEffect} from 'react';
import {useSelector} from 'react-redux';
import {selectExpense} from '../store/expenseActions';

/**
 * ThemeManager component that applies the current theme to the document
 * based on the darkMode setting in the Redux store
 */
const ThemeManager = () => {
  const {appConfig} = useSelector(selectExpense);

  useEffect(() => {
    // Apply theme to the document element
    if (appConfig.darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [appConfig.darkMode]);

  return null; // This component doesn't render anything
};

export default ThemeManager;
