import {Expense} from '../Types';
import dayjs from 'dayjs';
import {getDateMonth, sortByKeyDate} from '../utility/utility';
import {ExpenseAPI} from '../api/ExpenseAPI';
import {setExpenseState, setTagList} from '../store/expenseActions';

// Define date range options
export type DateRange = '1d' | '7d' | '14d' | '30d' | '60d' | '90d' | '180d' | '366d' | '732d' | '1800d';

export type GroupByOption = 'days' | 'vendor' | 'cost' | 'tags';
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

export type SortByOption = 'cost' | 'count' | 'date' | null;

export type CalculationOption = 'average' | 'median';


export const loadInitialAppData = () => {

    void ExpenseAPI.processData();

    const vendorTagApi = ExpenseAPI.getVendorTagList();
    const expenseApi = ExpenseAPI.getExpenseList();
    const tagListApi = ExpenseAPI.getTagList();
    const darkModeApi = ExpenseAPI.getDarkModeConfig();

    Promise.all([vendorTagApi, expenseApi, tagListApi, darkModeApi]).then((res) => {

        const vendorTagResult = res[0];
        const expenseResult = res[1];
        const tagList = res[2];
        const darkMode = res[3];
        const expenseList = sortByKeyDate(expenseResult, 'date');

        console.log('Vendor Tag Result:', vendorTagResult);
        console.log('Expense List:', expenseList);
        setExpenseState(expenseList, vendorTagResult, darkMode);
        setTagList(tagList);

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
