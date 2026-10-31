import {Expense} from '../Types';
import dayjs from 'dayjs';
import {getDateMonth, sortByKey} from '../utility/utility';
import {ExpenseAPI} from '../api/ExpenseAPI';
import {setBudgetList, setExpenseState, setTagConfig} from '../store/expenseActions';
import {displayTag, groupKey, primaryTag, readTags, tagListStatus} from '../domain/tags';

// Define date range options
export type DateRange = '1d' | '7d' | '14d' | '30d' | '60d' | '90d' | '180d' | '366d' | '732d' | '1800d';

export type GroupByOption = 'days' | 'vendor' | 'cost' | 'tags';
/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

export type SortByOption = 'cost' | 'count' | 'date' | null;

export type CalculationOption = 'average' | 'median';


export const loadInitialAppData = () => {
  void ExpenseAPI.processData();

  const vendorTagApi = ExpenseAPI.getVendorTagList();
  const expenseApi = ExpenseAPI.getExpenseList();
  const budgetApi = ExpenseAPI.getBudgetList();
  const tagListApi = ExpenseAPI.getTagConfig();
  const darkModeApi = ExpenseAPI.getDarkModeConfig();

  Promise.all([vendorTagApi, expenseApi, budgetApi, tagListApi, darkModeApi]).then((res) => {

    const vendorTagResult = res[0];
    const expenseResult = res[1];
    const budgetResult = res[2];
    const tagConfig = res[3];
    const darkMode = res[4];
    const expenseList = sortByKey(expenseResult, 'date');

    setExpenseState(expenseList, vendorTagResult, darkMode);
    setBudgetList(budgetResult);
    setTagConfig(tagConfig);

  }).catch((res1) => alert(res1));
};


// Define filter options
export const filterOptions: { id: DateRange, label: string }[] = [
  {id: '1d', label: '1 Day'},
  {id: '7d', label: '7 Days'},
  {id: '14d', label: '2 Weeks'},
  {id: '30d', label: '1 Month'},
  {id: '60d', label: '2 Month'},
  {id: '90d', label: '3 Month'},
  {id: '180d', label: '6 Month'},
  {id: '366d', label: '1 year'},
  {id: '732d', label: '2 year'},
  {id: '1800d', label: 'All Time'}
];

// Define group by options
export const groupByOptions: { id: GroupByOption, label: string }[] = [
  {id: 'days', label: 'Days'},
  {id: 'vendor', label: 'Vendor'},
  {id: 'tags', label: 'Tags'},
  {id: 'cost', label: 'Cost'},
];

// Define sort by options
export const sortByOptions: { id: SortByOption, label: string }[] = [
  {id: 'cost', label: 'Total Cost'},
  {id: 'count', label: 'Expenses Count'},
];

// Define sort by options
export const calculationOptions: { id: CalculationOption, label: string }[] = [
  {id: 'average', label: 'Average'},
  {id: 'median', label: 'Median'},
];

// Interface for grouped expenses
export interface GroupedExpenses {
  [groupKey: string]: {
    groupLabel: string;
    expenses: Expense[];
    totalAmount: number;
    unlisted?: boolean;
  };
}

// Filter expenses based on date range
export const filterExpensesByDate = (
  expenses: Expense[],
  selectedRange: DateRange
): Expense[] => {
  if (expenses.length === 0) {
    return [];
  }

  const now = dayjs();
  let startDate: dayjs.Dayjs;

  switch (selectedRange) {
  case '1d':
    startDate = now.subtract(1, 'day');
    break;
  case '7d':
    startDate = now.subtract(7, 'day');
    break;
  case '14d':
    startDate = now.subtract(14, 'day');
    break;
  case '30d':
    startDate = now.subtract(30, 'day');
    break;
  case '60d':
    startDate = now.subtract(60, 'day');
    break;
  case '90d':
    startDate = now.subtract(90, 'day');
    break;
  case '180d':
    startDate = now.subtract(180, 'day');
    break;
  case '366d':
    startDate = now.subtract(366, 'day');
    break;
  case '732d':
    startDate = now.subtract(732, 'day');
    break;
  case '1800d':
    startDate = now.subtract(1800, 'day');
    break;
  default:
    startDate = now.subtract(7, 'day');
  }

  return expenses.filter(expense => {
    const expenseDate = dayjs(new Date(expense.date));
    return expenseDate.isAfter(startDate) || expenseDate.isSame(startDate, 'day');
  });
};

// Filter expenses based on search term
export const searchExpenses = (
  expenses: Expense[],
  searchTerm: string
): Expense[] => {
  if (searchTerm.trim() === '') {
    return expenses;
  }

  const searchTermLower = searchTerm.toLowerCase();
  return expenses.filter(expense => {
    return (
      expense.vendor.toLowerCase().includes(searchTermLower) ||
      expense.cost.toString().includes(searchTermLower) ||
      readTags(expense).some((tag) => tag.toLowerCase().includes(searchTermLower)) ||
      (expense.description && expense.description.toLowerCase().includes(searchTermLower))
    );
  });
};

// Group expenses based on selected grouping option
export const groupExpenses = (
  expenses: Expense[],
  selectedGroupBy: GroupByOption,
  lists: {tagList?: string[]; legacyTagList?: string[]} = {},
): GroupedExpenses => {
  if (expenses.length === 0) {
    return {};
  }

  const grouped: GroupedExpenses = {};

  expenses.forEach(expense => {
    let key: string;
    let groupLabel: string;
    let unlisted = false;

    switch (selectedGroupBy) {
    case 'days':
      key = dayjs(new Date(expense.date)).format('YYYY-MM-DD');
      groupLabel = getDateMonth(expense.date);
      break;

    case 'vendor':
      key = expense.vendor.toLowerCase();
      groupLabel = expense.vendor;
      break;

    case 'cost': {
      const cost = Number(expense.cost);
      if (cost <= 100) {
        key = 'range_0_100';
        groupLabel = '₹0 - ₹100';
      } else if (cost <= 500) {
        key = 'range_100_500';
        groupLabel = '₹100 - ₹500';
      } else if (cost <= 1000) {
        key = 'range_500_1000';
        groupLabel = '₹500 - ₹1000';
      } else {
        key = 'range_1000_plus';
        groupLabel = '₹1000+';
      }
      break;
    }

    case 'tags': {
      const primary = primaryTag(expense);
      key = groupKey(primary) || 'untagged';
      groupLabel = primary
        ? (displayTag(primary, lists.tagList, lists.legacyTagList) || primary)
        : 'Untagged';
      unlisted = tagListStatus(primary, lists.tagList, lists.legacyTagList) === 'unlisted';
      break;
    }

    default:
      key = dayjs(new Date(expense.date)).format('YYYY-MM-DD');
      groupLabel = getDateMonth(expense.date);
    }

    if (!grouped[key]) {
      grouped[key] = {
        groupLabel,
        expenses: [],
        totalAmount: 0,
        ...(unlisted ? {unlisted: true} : {}),
      };
    }

    grouped[key].expenses.push(expense);
    grouped[key].totalAmount += expense.costType === 'debit' ? -Number(expense.cost) : Number(expense.cost);
  });

  return grouped;
};
