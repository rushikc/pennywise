import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectExpense } from '../store/expenseActions';

/**
 * ThemeManager component that applies the current theme to the document
 * based on the darkMode setting in the Redux store
 */
const ThemeManager = () => {
  const { appConfig } = useSelector(selectExpense);

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
