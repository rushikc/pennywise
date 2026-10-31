/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {deleteExpenseDoc, expect, longPress, readExpense, rowFor, test} from './fixtures';

test.describe('merge', () => {
  test('defaults to the first-selected expense tag and keeps it as survivor', async ({app: page, user}) => {
    await longPress(page, rowFor(page, 'city cafe'));
    await rowFor(page, 'spice kitchen').locator('.vendor-name').click();
    await expect(page.getByText('2 expenses selected')).toBeVisible();
    await page.getByRole('button', {name: 'Merge'}).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByLabel('Select tag food', {exact: true})).toHaveClass(/selected/);
    await dialog.getByTestId('merge-save').click();
    await expect(page.getByText('Please select a vendor first')).toBeVisible();

    await dialog.getByLabel('Select vendor CITY CAFE').click();
    await dialog.getByTestId('merge-save').click();
    await expect(dialog).toBeHidden();

    const survivor = await readExpense(user, 'anchor-cafe');
    expect(survivor?.cost).toBe(1170);
    expect(survivor?.tag).toBe('food');
    expect((await readExpense(user, 'anchor-spice'))?.operation).toBe('delete');
    await expect(rowFor(page, 'spice kitchen')).toHaveCount(0);
  });

  test('picking Untagged clears the merged tags', async ({app: page, user}) => {
    await longPress(page, rowFor(page, 'city cafe'));
    await rowFor(page, 'metro rail').locator('.vendor-name').click();
    await page.getByRole('button', {name: 'Merge'}).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Select tag untagged').click();
    await dialog.getByLabel('Select vendor CITY CAFE').click();
    await expect(dialog.getByText('Untagged drops the extra tags.')).toBeVisible();
    page.once('dialog', (confirm) => void confirm.accept());
    await dialog.getByTestId('merge-save').click();
    await expect(dialog).toBeHidden();

    const survivor = await readExpense(user, 'anchor-cafe');
    expect(survivor?.tags).toEqual([]);
    expect(survivor?.tag ?? null).toBeNull();
    await expect(rowFor(page, 'city cafe')).toContainText('untagged');
  });
});

test.describe('delete', () => {
  test('bulk deletes the selected expenses', async ({app: page, user}) => {
    await longPress(page, rowFor(page, 'pixel stream'));
    await rowFor(page, 'quick fuel').locator('.vendor-name').click();
    await page.getByRole('button', {name: 'Delete'}).click();
    await expect(rowFor(page, 'pixel stream')).toHaveCount(0);
    await expect(rowFor(page, 'quick fuel')).toHaveCount(0);
    await expect.poll(async () => (await readExpense(user, 'anchor-stream'))?.operation).toBe('delete');
    await expect.poll(async () => (await readExpense(user, 'anchor-fuel'))?.operation).toBe('delete');
  });

  test('reports a partial bulk delete failure', async ({app: page, user}) => {
    await longPress(page, rowFor(page, 'gift gallery'));
    await rowFor(page, 'spice kitchen').locator('.vendor-name').click();
    // Someone else removes one of the two before we delete.
    await deleteExpenseDoc(user, 'anchor-gift');
    await page.getByRole('button', {name: 'Delete'}).click();
    await expect(page.getByText(/Deleted 1 of 2/)).toBeVisible();
    expect((await readExpense(user, 'anchor-spice'))?.operation).toBe('delete');
  });
});

test.describe('duplicate review', () => {
  test('confirming hides the duplicate from home', async ({app: page, user}) => {
    await expect(rowFor(page, 'sky mobile')).toHaveCount(2);
    await page.goto('/duplicate-review');
    const pair = page.getByTestId('dupe-pair-dupe-sky-drop');
    await pair.getByRole('button', {name: 'Confirm duplicate'}).click();
    await expect(pair).toHaveCount(0);
    expect((await readExpense(user, 'dupe-sky-drop'))?.dupeStatus).toBe('confirmed');
    await expect(page.getByTestId('dupe-pair-dupe-grocer-drop')).toBeVisible();

    await page.getByRole('button', {name: 'Home'}).click();
    await expect(rowFor(page, 'sky mobile')).toHaveCount(1);
  });

  test('rejecting keeps both expenses', async ({app: page, user}) => {
    await page.goto('/duplicate-review');
    const pair = page.getByTestId('dupe-pair-dupe-sky-drop');
    await pair.getByRole('button', {name: 'Not a duplicate'}).click();
    await expect(pair).toHaveCount(0);
    expect((await readExpense(user, 'dupe-sky-drop'))?.dupeStatus).toBe('rejected');
    await page.getByRole('button', {name: 'Home'}).click();
    await expect(rowFor(page, 'sky mobile')).toHaveCount(2);
  });
});
