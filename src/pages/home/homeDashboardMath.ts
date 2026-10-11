/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {BudgetProgress, Expense} from '../../Types';
import {DateRange} from '../dataValidations';
import {formatVendorName} from '../../utility/utility';

export interface VendorTotal {
  label: string;
  amount: number;
}

export interface TagShare {
  label: string;
  percent: number;
}

export interface DashboardSummary {
  spent: number;
  received: number;
  topVendors: VendorTotal[];
  tags: TagShare[];
}

export const displayVendorName = (vendor: string): string => {
  const formatted = formatVendorName(vendor);
  if (Array.isArray(formatted) && formatted[0]) {
    return formatted[0];
  }
  return vendor || 'Unknown';
};

export const currentMonthExpenses = (expenses: Expense[], now = new Date()): Expense[] => {
  return expenses.filter((expense) => {
    const date = new Date(expense.date);
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  });
};

export const summarizeMonth = (expenses: Expense[]): DashboardSummary => {
  const debits = expenses.filter((expense) => expense.costType === 'debit');
  const credits = expenses.filter((expense) => expense.costType === 'credit');
  const spent = debits.reduce((sum, expense) => sum + Number(expense.cost), 0);
  const received = credits.reduce((sum, expense) => sum + Number(expense.cost), 0);

  const vendors = new Map<string, VendorTotal>();
  debits.forEach((expense) => {
    const label = displayVendorName(expense.vendor);
    const key = label.toLowerCase();
    const current = vendors.get(key);
    vendors.set(key, {label, amount: (current?.amount || 0) + Number(expense.cost)});
  });

  const topVendors = Array.from(vendors.values())
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const tagTotals = new Map<string, number>();
  debits.forEach((expense) => {
    const label = expense.tag?.trim() ? expense.tag : 'Untagged';
    tagTotals.set(label, (tagTotals.get(label) || 0) + Number(expense.cost));
  });

  const tags = Array.from(tagTotals.entries())
    .map(([label, amount]) => ({
      label,
      percent: spent > 0 ? Math.round((amount / spent) * 100) : 0,
    }))
    .sort((a, b) => b.percent - a.percent);

  return {spent, received, topVendors, tags};
};

const RANGE_DAYS: Record<DateRange, number> = {
  '1d': 1,
  '7d': 7,
  '14d': 14,
  '30d': 30,
  '60d': 60,
  '90d': 90,
  '180d': 180,
  '366d': 366,
  '732d': 732,
  '1800d': 1800,
};

export interface RangeStats {
  spent: number;
  received: number;
  net: number;
  count: number;
  avgPerDay: number;
}

export const daysForRange = (range: DateRange): number => RANGE_DAYS[range] ?? 1;

export const rangeStats = (expenses: Expense[], days: number): RangeStats => {
  const summary = summarizeMonth(expenses);
  const safeDays = days > 0 ? days : 1;
  return {
    spent: summary.spent,
    received: summary.received,
    net: summary.received - summary.spent,
    count: expenses.length,
    avgPerDay: summary.spent / safeDays,
  };
};

export const budgetAlerts = (progress: BudgetProgress[]): BudgetProgress[] => {
  return progress.filter((item) => item.percentage >= 80);
};
