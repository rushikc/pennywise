/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {expect, readExpense, test} from './fixtures';

test.describe('keyboard', () => {
  test('tags a row from the keyboard and escape leaves it unchanged', async ({app: page, isDesktop, user}) => {
    test.skip(!isDesktop, 'desktop only');
    const row = page.getByTestId('expense-row').first();
    await row.focus();
    await expect(row).toBeFocused();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByTestId('tag-save')).toBeVisible();

    const before = await readExpense(user, 'anchor-cafe');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(row).toBeFocused();
    expect((await readExpense(user, 'anchor-cafe'))?.tags).toEqual(before?.tags);

    await page.keyboard.press('Enter');
    await expect(dialog.getByTestId('tag-save')).toBeVisible();
    const travel = dialog.getByLabel('Select tag travel', {exact: true});
    await travel.focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await dialog.getByTestId('tag-save').focus();
    await page.keyboard.press('Enter');
    await expect(dialog).toBeHidden();
    const after = await readExpense(user, 'anchor-cafe');
    expect(after?.tag).toBe('travel');
  });
});
