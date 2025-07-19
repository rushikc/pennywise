import { Expense } from '../Types';
import dayjs from 'dayjs';
import {getDateMonth, sortByKeyDate} from "./utility";
import {ExpenseAPI} from "../api/ExpenseAPI";
import {setExpenseState, setTagList} from "../store/expenseActions";

// Define date range options
export type DateRange = '1d' | '7d' | '14d' | '30d' | '60d' | '90d' | '180d' | '366d' | '732d';

export type GroupByOption = 'days' | 'vendor' | 'cost' | 'tags';

export type SortByOption = 'cost' | 'count' | 'date' | null;


export const loadInitialAppData =  () => {

    void ExpenseAPI.processData();

    const vendorTagApi = ExpenseAPI.getVendorTagList();
    const expenseApi = ExpenseAPI.getExpenseList();
    const tagListApi = ExpenseAPI.getTagList();
    const bankConfigApi = ExpenseAPI.getBankConfig();

    Promise.all([vendorTagApi, expenseApi, tagListApi, bankConfigApi]).then((res) => {

        const vendorTagResult = res[0];
        const expenseResult = res[1];
        const tagList = res[2];
        const bankConfig = res[3];
        const expenseList = sortByKeyDate(expenseResult, 'date');

        console.log('Vendor Tag Result:', vendorTagResult);
        console.log('Expense List:', expenseList);
        setExpenseState(expenseList, vendorTagResult, bankConfig);
        setTagList(tagList);

    }).catch((res1) => alert(res1))
}


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
];

// Define group by options
export const groupByOptions: { id: GroupByOption, label: string }[] = [
  {id: 'days', label: 'Days'},
  {id: 'vendor', label: 'Vendor'},
  {id: 'cost', label: 'Cost'},
  {id: 'tags', label: 'Tags'},
];

// Define sort by options
export const sortByOptions: { id: SortByOption, label: string }[] = [
  {id: 'cost', label: 'Total Cost'},
  {id: 'count', label: 'Expenses Count'},
];

// Interface for grouped expenses
export interface GroupedExpenses {
  [groupKey: string]: {
    groupLabel: string;
    expenses: Expense[];
    totalAmount: number;
  }
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
    case '90d':
      startDate = now.subtract(90, 'day');
      break;
    case '180d':
      startDate = now.subtract(180, 'day');
      break;
    case '366d':
      startDate = now.subtract(366, 'day');
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
      (expense.tag && expense.tag.toLowerCase().includes(searchTermLower))
    );
  });
};

// Group expenses based on selected grouping option
export const groupExpenses = (
  expenses: Expense[],
  selectedGroupBy: GroupByOption
): GroupedExpenses => {
  if (expenses.length === 0) {
    return {};
  }

  const grouped: GroupedExpenses = {};

  expenses.forEach(expense => {
    let groupKey: string;
    let groupLabel: string;

    // Group by different criteria based on selectedGroupBy
    switch (selectedGroupBy) {
      case 'days':
        // Use date as key (without time part)
        groupKey = dayjs(new Date(expense.date)).format('YYYY-MM-DD');
        groupLabel = getDateMonth(expense.date);
        break;

      case 'vendor':
        // Use vendor name as key
        groupKey = expense.vendor.toLowerCase();
        groupLabel = expense.vendor;
        break;

      case 'cost':
        // Create cost ranges (0-100, 100-500, 500-1000, 1000+)
        const cost = Number(expense.cost);
        if (cost <= 100) {
          groupKey = 'range_0_100';
          groupLabel = '₹0 - ₹100';
        } else if (cost <= 500) {
          groupKey = 'range_100_500';
          groupLabel = '₹100 - ₹500';
        } else if (cost <= 1000) {
          groupKey = 'range_500_1000';
          groupLabel = '₹500 - ₹1000';
        } else {
          groupKey = 'range_1000_plus';
          groupLabel = '₹1000+';
        }
        break;

      case 'tags':
        // Use tag as key, or "untagged" for null tags
        groupKey = expense.tag ? expense.tag.toLowerCase() : 'untagged';
        groupLabel = expense.tag ? expense.tag : 'Untagged';
        break;

      default:
        groupKey = dayjs(new Date(expense.date)).format('YYYY-MM-DD');
        groupLabel = getDateMonth(expense.date);
    }

    if (!grouped[groupKey]) {
      grouped[groupKey] = {
        groupLabel,
        expenses: [],
        totalAmount: 0
      };
    }

    grouped[groupKey].expenses.push(expense);
    grouped[groupKey].totalAmount += expense.costType === 'debit' ? -Number(expense.cost) : Number(expense.cost);
  });

  return grouped;
};

// Sort grouped expenses
export const sortGroupedExpenses = (
  groupedExpenses: GroupedExpenses,
  selectedGroupBy: GroupByOption,
  selectedSortBy: SortByOption
): [string, GroupedExpenses[string]][] => {
  return Object.entries(groupedExpenses)
    .sort(([keyA, groupDataA], [keyB, groupDataB]) => {
      if (selectedGroupBy === 'days' &&
          (selectedSortBy === 'date' || selectedSortBy == null))
        return keyB.localeCompare(keyA);

      return selectedSortBy === "cost" ?
        groupDataB.totalAmount - groupDataA.totalAmount :
        groupDataB.expenses.length - groupDataA.expenses.length;
    });
};

// Initialize collapsed groups state
export const initializeCollapsedGroups = (
  groupedExpenses: GroupedExpenses,
  selectedGroupBy: GroupByOption
): { [groupKey: string]: boolean } => {
  const collapsedGroups: { [groupKey: string]: boolean } = {};

  Object.keys(groupedExpenses).forEach(key => {
    collapsedGroups[key] = selectedGroupBy !== 'days';
  });

  return collapsedGroups;
};
