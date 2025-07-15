import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectExpense } from '../store/expenseActions';

/**
 * ThemeManager component that applies the current theme to the document
 * based on the darkMode setting in the Redux store
 */
const ThemeManager = () => {
  const { bankConfig } = useSelector(selectExpense);

  useEffect(() => {
    // Apply theme to the document element
    if (bankConfig.darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [bankConfig.darkMode]);

  return null; // This component doesn't render anything
};

export default ThemeManager;
