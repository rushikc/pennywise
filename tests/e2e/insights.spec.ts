/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {readFile} from 'node:fs/promises';
import type {Page} from '@playwright/test';
import {expect, patchExpense, test} from './fixtures';

const spentFor = async (page: Page, name: string): Promise<number> => {
  const card = page.locator('.budget-card').filter({has: page.locator('.budget-name', {hasText: name})});
  const text = await card.locator('.spent-amount').innerText();
  return Number(text.replace(/[^\d.]/g, ''));
};

test.describe('budget', () => {
  test('counts an expense only under the budget of its primary tag', async ({app: page, user}) => {
    await page.goto('/budget');
    await expect(page.locator('.budget-card')).toHaveCount(3);
    const food = await spentFor(page, 'Food');
    const travel = await spentFor(page, 'Travel');

    // Primary snacks (Food), extra travel must not count toward Travel.
    await patchExpense(user, 'anchor-books', {tags: ['snacks', 'travel'], tag: 'snacks'});
    await page.reload();
    await expect(page.locator('.budget-card')).toHaveCount(3);
    await expect.poll(() => spentFor(page, 'Food')).toBe(food + 899);
    expect(await spentFor(page, 'Travel')).toBe(travel);
  });
});

test.describe('insights', () => {
  test('exports CSV with primary, extra tags and description columns', async ({app: page}) => {
    await page.goto('/stats');
    await expect(page.getByRole('button', {name: /Export CSV/})).toBeVisible();
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', {name: /Export CSV/}).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
    const csv = await readFile(await download.path(), 'utf8');
    const [header, ...rows] = csv.split(/\r?\n/);
    expect(header).toContain('Extra tags');
    expect(header).toContain('Description');
    const cafe = rows.find((row) => row.includes('Team lunch with the design crew'));
    expect(cafe).toBeDefined();
    expect(cafe).toContain('CITY CAFE');
    expect(cafe).toContain('office; weekend; split');
    expect(cafe).toMatch(/,food,/);
    const books = rows.find((row) => row.includes('BOOK NOOK') && row.includes('899'));
    expect(books).toContain('Untagged');
  });

  test('tag groups merge case variants and mark tags missing from the list', async ({app: page, isDesktop}) => {
    test.skip(isDesktop, 'The group chooser panel is the mobile layout.');
    await page.goto('/stats');
    await page.getByText('Group: Days').click();
    await page.locator('.section-title', {hasText: 'Group by'}).locator('..').getByText('Tags', {exact: true}).click();
    await expect(page.getByText('Group: Tags')).toBeVisible();
    await page.getByRole('button', {name: 'Choose groups'}).click();

    const chips = page.locator('[data-testid^="insights-chip-"]');
    await expect(chips.first()).toBeVisible();
    const pets = chips.filter({hasText: /^pets · not in list$/i});
    await expect(pets).toHaveCount(1);
    await expect(pets).toHaveClass(/selection-chip--unlisted/);
    await expect(chips.filter({hasText: /office/i})).toHaveCount(0);
    const food = page.getByTestId('insights-chip-food');
    await expect(food).toHaveText('food');
    await expect(food).not.toHaveClass(/selection-chip--unlisted/);

    const before = await pets.getAttribute('aria-pressed');
    await pets.click();
    await expect(pets).toHaveAttribute('aria-pressed', before === 'true' ? 'false' : 'true');
    await pets.click();
    await expect(pets).toHaveAttribute('aria-pressed', String(before));
  });
});
