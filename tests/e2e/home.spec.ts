/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {readFileSync} from 'node:fs';
import {expect, groupHomeBy, longPress, rowFor, searchHome, test} from './fixtures';
import {E2E_NOW} from '../fixtures/constants';

type SeedExpense = {
  vendor: string;
  cost: number;
  costType: 'debit' | 'credit';
  date: number;
};

const seedExpenses: SeedExpense[] = JSON.parse(
  readFileSync('tests/fixtures/seed/expenses.json', 'utf8'),
);

/** Calendar day in the browser timezone Playwright pins for every spec. */
const istDay = (ms: number): string => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(ms);

/** Same window as filterExpensesByDate: the start calendar day, then anything later. */
const inRange = (days: number): SeedExpense[] => {
  const startMs = E2E_NOW - days * 24 * 60 * 60 * 1000;
  const startDay = istDay(startMs);
  return seedExpenses.filter((row) => istDay(row.date) === startDay || row.date > startMs);
};

const inPinnedMonth = (): SeedExpense[] => {
  const month = istDay(E2E_NOW).slice(0, 7);
  return seedExpenses.filter((row) => istDay(row.date).startsWith(month));
};

const debitSpent = (rows: SeedExpense[]): number =>
  rows.filter((row) => row.costType === 'debit').reduce((sum, row) => sum + Number(row.cost), 0);

const rupees = (amount: number): string => `₹${Math.round(amount).toLocaleString('en-IN')}`;

/** Highest signed group total first, matching compareExpenseGroups. Ties keep newest-first insertion. */
const firstVendorAfterCostSort = (rows: SeedExpense[]): string => {
  const ordered = [...rows].sort((a, b) => b.date - a.date);
  const totals = new Map<string, number>();
  const order: string[] = [];
  ordered.forEach((row) => {
    const key = row.vendor.toLowerCase();
    if (!totals.has(key)) order.push(key);
    const delta = row.costType === 'debit' ? -Number(row.cost) : Number(row.cost);
    totals.set(key, (totals.get(key) ?? 0) + delta);
  });
  const winner = order.reduce((best, key) => ((totals.get(key) ?? 0) > (totals.get(best) ?? 0) ? key : best));
  return winner;
};

test.describe('home list', () => {
  test('shows the primary chip, subtle extras and the description marker', async ({app: page, isDesktop}) => {
    const cafe = rowFor(page, 'city cafe');
    await expect(cafe).toContainText('food');
    if (isDesktop) {
      await expect(cafe.locator('.expense-extra-chip')).toHaveCount(2);
      await expect(cafe.locator('.expense-extra-more')).toHaveText('+1');
      await cafe.locator('.expense-note-icon').hover();
      await expect(page.getByRole('tooltip')).toContainText('Team lunch with the design crew');
    } else {
      await expect(cafe).toContainText('+3');
      await cafe.getByRole('button', {name: 'Expense note'}).click();
      await expect(cafe.locator('.expense-note-text')).toContainText('Team lunch with the design crew');
    }
  });

  test('shows untagged rows and marks out-of-list primaries', async ({app: page}) => {
    await expect(rowFor(page, 'book nook')).toContainText('untagged');
    await expect(rowFor(page, 'gift gallery').locator('.expense-unlisted-chip')).toHaveAttribute(
      'aria-label', 'gifts (not in tag list)');
  });

  test('groups by primary tag and folds out-of-list tags case-insensitively', async ({app: page, isDesktop}) => {
    await groupHomeBy(page, isDesktop, 'Tags');
    const petsGroup = page.locator('.group-box').filter({
      has: page.getByLabel(/^pets \(not in tag list\)$/i),
    });
    await expect(petsGroup).toHaveCount(1);
    await expect(petsGroup.locator('.expense-count')).toHaveText('2 expenses');
    // Extras never create their own group.
    await expect(page.locator('.group-label', {hasText: /^office/})).toHaveCount(0);
    // A listed tag carries no marker.
    const foodGroup = page.locator('.group-box').filter({has: page.locator('.group-label', {hasText: /^food$/})});
    await expect(foodGroup.getByLabel(/not in tag list/)).toHaveCount(0);
  });

  test('search matches extra tags and descriptions, case-insensitively', async ({app: page, isDesktop}) => {
    await searchHome(page, isDesktop, 'DESIGN crew');
    await expect(page.getByTestId('expense-row')).toHaveCount(1);
    await expect(rowFor(page, 'city cafe')).toBeVisible();

    await searchHome(page, isDesktop, 'weekend');
    await expect(rowFor(page, 'city cafe')).toBeVisible();
    await expect(rowFor(page, 'book nook')).toHaveCount(0);

    await searchHome(page, isDesktop, 'downtown');
    await expect(rowFor(page, 'metro rail')).toBeVisible();
    await expect(page.getByTestId('expense-row')).toHaveCount(1);
  });

  test('the totals header matches the seed for the selected range', async ({app: page, isDesktop}) => {
    const monthSpent = rupees(debitSpent(inPinnedMonth()));
    const weekSpent = rupees(debitSpent(inRange(7)));
    const daySpent = rupees(debitSpent(inRange(1)));
    expect(weekSpent).not.toBe(daySpent);

    if (isDesktop) {
      await expect(page.locator('.dash-amount').first()).toHaveText(monthSpent);
      await page.getByTestId('home-range').click();
      await page.locator('.ant-select-item-option', {hasText: '1 Day'}).click();
      await expect(page.getByTestId('expense-row')).toHaveCount(inRange(1).length);
      await expect(page.locator('.dash-amount').first()).toHaveText(monthSpent);
      return;
    }

    const summary = page.getByRole('region', {name: 'Spending summary'});
    await expect(summary.locator('.phone-stats-amount')).toHaveText(weekSpent);
    await page.getByRole('button', {name: 'Filter'}).click();
    await page.locator('.home-options-panel').getByText('1 Day', {exact: true}).click();
    await page.keyboard.press('Escape');
    await expect(summary.locator('.phone-stats-amount')).toHaveText(daySpent);
    await expect(summary).toContainText(`${inRange(1).length} expenses`);
  });

  test('sort by total cost puts the highest signed vendor group first', async ({app: page, isDesktop}) => {
    const winner = firstVendorAfterCostSort(inRange(7));
    await groupHomeBy(page, isDesktop, 'Vendor');
    if (isDesktop) {
      await page.getByTestId('home-sort').click();
      await page.locator('.ant-select-item-option', {hasText: 'Total Cost'}).click();
    } else {
      await page.getByRole('button', {name: 'Filter'}).click();
      await page.locator('.home-options-panel').getByText('Total Cost', {exact: true}).click();
      await page.keyboard.press('Escape');
    }
    // Vendor groups start collapsed, so the order shows on the group header.
    await expect(page.locator('.group-label').first()).toHaveText(winner);
  });

  test('a long press selects the row', async ({app: page, isDesktop}) => {
    test.skip(isDesktop, 'mobile only');
    await longPress(page, page.getByTestId('expense-row').first());
  });
});

test.describe('layout', () => {
  test('desktop has no floating add button', async ({app: page, isDesktop}) => {
    test.skip(!isDesktop, 'desktop only');
    await expect(page.getByRole('button', {name: 'Add expense', exact: true})).toBeVisible();
    await expect(page.locator('.phone-fab')).toHaveCount(0);
  });

  test('mobile has the add FAB and evenly sized filter and search buttons', async ({app: page, isDesktop}) => {
    test.skip(isDesktop, 'mobile only');
    await expect(page.getByRole('button', {name: 'add expense', exact: true})).toBeVisible();
    const filter = await page.getByRole('button', {name: 'Filter'}).boundingBox();
    const search = await page.getByRole('button', {name: 'Search'}).boundingBox();
    const viewport = page.viewportSize();
    if (!filter || !search || !viewport) throw new Error('filter, search or viewport is missing');
    expect(Math.abs(filter.height - search.height)).toBeLessThanOrEqual(1);
    expect(filter.height).toBeGreaterThanOrEqual(16);
    expect(filter.x + filter.width).toBeLessThanOrEqual(viewport.width);
    expect(search.x + search.width).toBeLessThanOrEqual(viewport.width);
  });
});
