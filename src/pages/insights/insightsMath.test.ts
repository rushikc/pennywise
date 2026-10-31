/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import dayjs from 'dayjs';
import {
  dailyFigure,
  distributionSlices,
  expensesInRange,
  InsightExpense,
  monthlyFigure,
  periodChange,
  sumCost,
  topVendors,
} from './insightsMath';

const now = dayjs('2026-10-11T15:00:00+05:30');

const expense = (
  date: string,
  cost: number,
  vendor = 'Shop',
): InsightExpense => ({
  date: dayjs(date).valueOf(),
  cost,
  vendor,
});

describe('insightsMath', () => {
  const inMonth = [
    expense('2026-10-01', 20000, 'A'),
    expense('2026-10-05', 78291, 'B'),
  ];

  it('sums spending in the selected range', () => {
    expect(sumCost(inMonth)).toBe(98291);
    expect(expensesInRange(inMonth, '30d', now)).toHaveLength(2);
  });

  it('divides a 30-day total by 30 for the daily average', () => {
    expect(dailyFigure(inMonth, '30d', 'average', now)).toBeCloseTo(98291 / 30, 5);
  });

  it('uses one month for a 1 Month filter, so monthly average equals spending', () => {
    expect(monthlyFigure(inMonth, '30d', 'average', now)).toBe(98291);
  });

  it('reports a negative percent against the previous window', () => {
    const rows = [
      expense('2026-10-02', 100, 'Now'),
      expense('2026-09-05', 400, 'Then'),
    ];
    const change = periodChange(rows, '30d', now);
    expect(change.label).toBe('Oct vs Sep');
    expect(change.percent).toBeCloseTo(-75, 5);
  });

  it('sorts vendors by spent and counts repeats', () => {
    const rows = topVendors([
      expense('2026-10-01', 10, 'Alpha'),
      expense('2026-10-02', 20, 'Alpha'),
      expense('2026-10-03', 50, 'Beta'),
    ]);
    expect(rows.map((row) => row.vendor)).toEqual(['Beta', 'Alpha']);
    expect(rows[1]).toMatchObject({count: 2, spent: 30});
  });

  it('groups tag slices case-insensitively and keeps unlisted primaries', () => {
    const slices = distributionSlices([
      {date: now.valueOf(), cost: 50, vendor: 'A', tags: ['Food']},
      {date: now.valueOf(), cost: 50, vendor: 'B', tags: ['food']},
      {date: now.valueOf(), cost: 40, vendor: 'C', tags: ['mystery']},
    ], 'tags', {tagList: ['food'], legacyTagList: []});
    expect(slices).toEqual([
      {name: 'food', value: 100},
      {name: 'mystery', value: 40, unlisted: true},
    ]);
  });

  it('returns zeros and no vendors for an empty list', () => {
    expect(sumCost([])).toBe(0);
    expect(dailyFigure([], '30d', 'average', now)).toBe(0);
    expect(monthlyFigure([], '30d', 'average', now)).toBe(0);
    expect(periodChange([], '30d', now)).toEqual({label: 'Oct vs Sep', percent: null});
    expect(topVendors([])).toEqual([]);
  });
});
