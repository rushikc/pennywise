/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import dayjs, {Dayjs} from 'dayjs';
import type {CalculationOption, DateRange, GroupByOption} from '../dataValidations';
import {displayTag, groupKey, primaryTag, tagListStatus} from '../../domain/tags';

export interface InsightExpense {
  cost: number;
  date: number;
  vendor: string;
  tag?: string | null;
  tags?: string[];
  description?: string;
}

export interface VendorRow {
  vendor: string;
  count: number;
  spent: number;
}

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

export const sumCost = (expenses: Pick<InsightExpense, 'cost'>[]): number => {
  return expenses.reduce((sum, expense) => sum + Number(expense.cost), 0);
};

export const formatInr = (amount: number): string => {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
};

const rangeLengthDays = (range: DateRange): number => RANGE_DAYS[range] ?? 7;

export const rangeDayCount = (
  range: DateRange,
  expenses: Pick<InsightExpense, 'date'>[],
  now: Dayjs = dayjs(),
): number => {
  if (range !== '1800d') {
    return rangeLengthDays(range);
  }
  if (expenses.length === 0) {
    return 1;
  }
  const earliest = dayjs(Math.min(...expenses.map((expense) => expense.date)));
  return Math.max(1, now.startOf('day').diff(earliest.startOf('day'), 'day') + 1);
};

export const rangeMonthCount = (
  range: DateRange,
  expenses: Pick<InsightExpense, 'date'>[],
  now: Dayjs = dayjs(),
): number => {
  if (range === '1800d') {
    if (expenses.length === 0) {
      return 1;
    }
    const earliest = dayjs(Math.min(...expenses.map((expense) => expense.date)));
    const months = (now.year() - earliest.year()) * 12 + (now.month() - earliest.month()) + 1;
    return Math.max(1, months);
  }
  return Math.max(1, Math.round(rangeLengthDays(range) / 30));
};

export const expensesInRange = <T extends Pick<InsightExpense, 'date'>>(
  expenses: T[],
  range: DateRange,
  now: Dayjs = dayjs(),
): T[] => {
  const start = now.subtract(rangeLengthDays(range), 'day');
  return expenses.filter((expense) => {
    const date = dayjs(expense.date);
    return date.isAfter(start) || date.isSame(start, 'day');
  });
};

const median = (values: number[]): number => {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const totalsBy = (expenses: InsightExpense[], keyOf: (expense: InsightExpense) => string): number[] => {
  const buckets = new Map<string, number>();
  expenses.forEach((expense) => {
    const key = keyOf(expense);
    buckets.set(key, (buckets.get(key) || 0) + Number(expense.cost));
  });
  return Array.from(buckets.values());
};

export const dailyFigure = (
  expenses: InsightExpense[],
  range: DateRange,
  calculation: CalculationOption,
  now: Dayjs = dayjs(),
): number => {
  if (expenses.length === 0) {
    return 0;
  }
  if (calculation === 'median') {
    return median(totalsBy(expenses, (expense) => dayjs(expense.date).format('YYYY-MM-DD')));
  }
  return sumCost(expenses) / rangeDayCount(range, expenses, now);
};

export const monthlyFigure = (
  expenses: InsightExpense[],
  range: DateRange,
  calculation: CalculationOption,
  now: Dayjs = dayjs(),
): number => {
  if (expenses.length === 0) {
    return 0;
  }
  if (calculation === 'median') {
    return median(totalsBy(expenses, (expense) => dayjs(expense.date).format('YYYY-MM')));
  }
  return sumCost(expenses) / rangeMonthCount(range, expenses, now);
};

export const periodChange = (
  expenses: InsightExpense[],
  range: DateRange,
  now: Dayjs = dayjs(),
): {label: string; percent: number | null} => {
  const days = range === '1800d' ? rangeDayCount(range, expenses, now) : rangeLengthDays(range);
  const currentStart = now.subtract(days, 'day');
  const previousStart = now.subtract(days * 2, 'day');
  const inCurrent = (date: number) => {
    const value = dayjs(date);
    return value.isAfter(currentStart) || value.isSame(currentStart, 'day');
  };
  const current = sumCost(expenses.filter((expense) => inCurrent(expense.date)));
  const previous = sumCost(expenses.filter((expense) => {
    const value = dayjs(expense.date);
    const afterPrevious = value.isAfter(previousStart) || value.isSame(previousStart, 'day');
    return afterPrevious && !inCurrent(expense.date);
  }));
  const currentMonth = now.format('MMM');
  const previousMonth = currentStart.format('MMM');
  return {
    label: currentMonth === previousMonth ? 'vs prior' : `${currentMonth} vs ${previousMonth}`,
    percent: previous === 0 ? null : ((current - previous) / previous) * 100,
  };
};

export const topVendors = (expenses: InsightExpense[]): VendorRow[] => {
  const rows = new Map<string, VendorRow>();
  expenses.forEach((expense) => {
    const vendor = expense.vendor?.trim() || 'Unknown';
    const current = rows.get(vendor) || {vendor, count: 0, spent: 0};
    current.count += 1;
    current.spent += Number(expense.cost);
    rows.set(vendor, current);
  });
  return Array.from(rows.values()).sort((a, b) => b.spent - a.spent);
};

const costRange = (cost: number): string => {
  if (cost <= 100) return '₹0-₹100';
  if (cost <= 500) return '₹100-₹500';
  if (cost <= 1000) return '₹500-₹1000';
  return '₹1000+';
};

export const distributionSlices = (
  expenses: InsightExpense[],
  groupBy: GroupByOption,
  lists: {tagList?: string[]; legacyTagList?: string[]} = {},
): {name: string; value: number; unlisted?: boolean}[] => {
  const groups = new Map<string, {name: string; value: number; unlisted?: boolean}>();
  expenses.forEach((expense) => {
    let key = '';
    let name = '';
    let unlisted = false;
    if (groupBy === 'vendor') {
      key = (expense.vendor || 'Unknown').toLowerCase();
      name = expense.vendor || 'Unknown';
    } else if (groupBy === 'tags') {
      const primary = primaryTag(expense);
      key = groupKey(primary) || 'untagged';
      name = primary
        ? (displayTag(primary, lists.tagList, lists.legacyTagList) || primary)
        : 'Untagged';
      unlisted = tagListStatus(primary, lists.tagList, lists.legacyTagList) === 'unlisted';
    } else if (groupBy === 'cost') {
      name = costRange(Number(expense.cost));
      key = name;
    } else {
      name = dayjs(expense.date).format('D MMM');
      key = name;
    }
    const current = groups.get(key);
    groups.set(key, {
      name: current?.name || name,
      value: (current?.value || 0) + Number(expense.cost),
      ...(unlisted || current?.unlisted ? {unlisted: true} : {}),
    });
  });
  return Array.from(groups.values()).sort((a, b) => b.value - a.value);
};

export const dailyTrend = (expenses: InsightExpense[]): {date: string; total: number}[] => {
  const days = new Map<string, {label: string; total: number; ts: number}>();
  expenses.forEach((expense) => {
    const date = dayjs(expense.date);
    const key = date.format('YYYY-MM-DD');
    const current = days.get(key) || {label: date.format('D MMM'), total: 0, ts: date.startOf('day').valueOf()};
    current.total += Number(expense.cost);
    days.set(key, current);
  });
  return Array.from(days.values())
    .sort((a, b) => a.ts - b.ts)
    .map(({label, total}) => ({date: label, total}));
};
