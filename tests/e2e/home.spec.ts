/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {expect, groupHomeBy, rowFor, searchHome, test} from './fixtures';

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
    await expect(page.locator('.expense-row')).toHaveCount(1);
    await expect(rowFor(page, 'city cafe')).toBeVisible();

    await searchHome(page, isDesktop, 'weekend');
    await expect(rowFor(page, 'city cafe')).toBeVisible();
    await expect(rowFor(page, 'book nook')).toHaveCount(0);

    await searchHome(page, isDesktop, 'downtown');
    await expect(rowFor(page, 'metro rail')).toBeVisible();
    await expect(page.locator('.expense-row')).toHaveCount(1);
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
