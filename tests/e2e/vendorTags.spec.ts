/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {E2E_NOW} from '../fixtures/constants';
import {adminDb} from '../fixtures/seedEmulator';
import {expect, openTagDialog, readExpense, rowFor, test} from './fixtures';

test.describe('vendor tags', () => {
  test('edits and deletes a mapping', async ({app: page}) => {
    await page.goto('/setting-tag-maps');
    await page.getByRole('listitem').filter({hasText: 'city cafe'}).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', {name: 'travel', exact: true}).click();
    await dialog.getByRole('button', {name: 'Save'}).click();
    await expect(page.getByRole('listitem').filter({hasText: 'city cafe'})).toContainText('Tag: travel');

    await page.getByRole('listitem').filter({hasText: 'quick fuel'}).getByRole('button', {name: 'delete'}).click();
    await expect(page.getByText('Vendor tag deleted successfully')).toBeVisible();
    await expect(page.getByRole('listitem').filter({hasText: 'quick fuel'})).toHaveCount(0);
  });

  test('a saved rule is what auto-tag applies', async ({app: page, user}) => {
    await adminDb().doc(`users/${user.uid}/expense/extra-stream`).set({
      id: 'extra-stream',
      mailId: 'extra-stream',
      vendor: 'PIXEL STREAM',
      cost: 42,
      costType: 'debit',
      type: 'credit',
      date: E2E_NOW - 86_400_000,
      modifiedDate: E2E_NOW - 86_400_000,
      user: 'e2e',
      operation: 'add',
      tags: [],
      tag: null,
    });
    await page.reload();

    const dialog = await openTagDialog(page, rowFor(page, 'pixel stream').filter({hasText: 'untagged'}).first());
    await dialog.getByLabel('Auto tag future transactions').click();
    await dialog.getByLabel('Select tag shopping', {exact: true}).click();
    await dialog.getByTestId('tag-save').click();
    await expect(dialog).toBeHidden();

    await page.goto('/setting-tag-maps');
    await expect(page.getByRole('listitem').filter({hasText: 'pixel stream'})).toContainText('Tag: shopping');

    await page.goto('/auto-tag-expenses');
    await page.getByRole('button', {name: 'Auto-tag All Expenses'}).click();
    await expect(page.getByText(/Auto-tagging successful!/)).toBeVisible();
    const extra = await readExpense(user, 'extra-stream');
    expect(extra?.tags).toEqual(['shopping']);
    expect(extra?.tag).toBe('shopping');
  });
});
