/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {FieldValue} from 'firebase-admin/firestore';
import {adminDb} from '../fixtures/seedEmulator';
import {E2E_NOW} from '../fixtures/constants';
import {addExtra, expect, openTagDialog, readExpense, rowFor, test} from './fixtures';

const OFFLINE_SAVE_MESSAGE = 'You\'re offline, the save needs a connection';

test.describe('tag dialog', () => {
  test('picks a primary, adds and removes extras, adds a note and persists after reload', async ({app: page, isDesktop, user}) => {
    const dialog = await openTagDialog(page, rowFor(page, 'book nook'));
    await expect(dialog.getByPlaceholder('Choose a primary tag first')).toBeDisabled();
    await dialog.getByLabel('Select tag shopping', {exact: true}).click();
    await addExtra(dialog, 'weekend');
    await addExtra(dialog, 'gift-wrap');
    await dialog.locator('.MuiAutocomplete-root .MuiChip-root', {hasText: 'weekend'})
      .locator('.MuiChip-deleteIcon').click();
    await dialog.getByRole('button', {name: 'Add note'}).click();
    await dialog.getByLabel('Note').fill('Birthday present for a friend');
    await dialog.getByTestId('tag-save').click();
    await expect(dialog).toBeHidden();

    const stored = await readExpense(user, 'anchor-books');
    expect(stored?.tags).toEqual(['shopping', 'gift-wrap']);
    expect(stored?.tag).toBe('shopping');
    expect(stored?.description).toBe('Birthday present for a friend');

    await page.reload();
    const row = rowFor(page, 'book nook');
    await expect(row).toContainText('shopping');
    // Phones collapse extras into a "+N" counter.
    await expect(row).toContainText(isDesktop ? 'gift-wrap' : '+1');
    await expect(row.getByLabel('Expense note').first()).toBeVisible();
  });

  test('untagging an expense with extras asks first', async ({app: page, user}) => {
    const row = rowFor(page, 'city cafe');
    const dialog = await openTagDialog(page, row);
    await dialog.getByLabel('Select tag untagged').click();

    page.once('dialog', (confirm) => void confirm.dismiss());
    await dialog.getByTestId('tag-save').click();
    await expect(dialog).toBeVisible();
    expect((await readExpense(user, 'anchor-cafe'))?.tags).toEqual(['food', 'office', 'weekend', 'split']);

    page.once('dialog', (confirm) => {
      expect(confirm.message()).toBe('Untagging drops extra tags. Continue?');
      void confirm.accept();
    });
    await dialog.getByTestId('tag-save').click();
    await expect(dialog).toBeHidden();
    const stored = await readExpense(user, 'anchor-cafe');
    expect(stored?.tags).toEqual([]);
    expect(stored?.tag ?? null).toBeNull();
    await expect(row).toContainText('untagged');
  });

  test('keeps an out-of-list primary when saving other edits', async ({app: page, user}) => {
    const row = rowFor(page, 'pet pals').filter({hasText: '640'});
    const dialog = await openTagDialog(page, row);
    const chip = dialog.getByLabel('Select tag pets (not in list)');
    await expect(chip).toHaveClass(/selected/);
    await addExtra(dialog, 'vet');
    await dialog.getByTestId('tag-save').click();
    await expect(dialog).toBeHidden();
    expect((await readExpense(user, 'anchor-pets-lower'))?.tags).toEqual(['pets', 'vet']);
  });

  test('a note-only edit keeps tags written concurrently elsewhere', async ({app: page, user}) => {
    const dialog = await openTagDialog(page, rowFor(page, 'city cafe'));
    await adminDb().doc(`users/${user.uid}/expense/anchor-cafe`).update({
      tags: FieldValue.arrayUnion('urgent'),
      modifiedDate: E2E_NOW,
    });
    await dialog.getByLabel('Note').fill('Team lunch, paid by card');
    await dialog.getByTestId('tag-save').click();
    await expect(dialog).toBeHidden();
    const stored = await readExpense(user, 'anchor-cafe');
    expect(stored?.tags).toEqual(['food', 'office', 'weekend', 'split', 'urgent']);
    expect(stored?.description).toBe('Team lunch, paid by card');
  });

  test('save is disabled while saving and a double click writes once', async ({app: page, user}) => {
    let commits = 0;
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route(/documents:commit/, async (route) => {
      commits += 1;
      await gate;
      await route.continue();
    });

    const dialog = await openTagDialog(page, rowFor(page, 'book nook'));
    await dialog.getByLabel('Select tag shopping', {exact: true}).click();
    const save = dialog.getByTestId('tag-save');
    await save.dblclick();
    await expect(save).toBeDisabled();
    await expect(save).toHaveText('Saving…');
    release();
    await expect(dialog).toBeHidden();
    expect(commits).toBe(1);
    expect((await readExpense(user, 'anchor-books'))?.tags).toEqual(['shopping']);
  });

  test('shows the offline alert and keeps the dialog open', async ({app: page, context, user}) => {
    const dialog = await openTagDialog(page, rowFor(page, 'book nook'));
    await dialog.getByLabel('Select tag shopping', {exact: true}).click();
    await context.setOffline(true);
    await dialog.getByTestId('tag-save').click();
    await expect(page.getByText(OFFLINE_SAVE_MESSAGE)).toBeVisible();
    await expect(dialog).toBeVisible();
    await context.setOffline(false);
    expect((await readExpense(user, 'anchor-books'))?.tags ?? []).toEqual([]);
  });
});

test('adds a manual expense with a primary and extra tags', async ({app: page, isDesktop, user}) => {
  await page.getByRole('button', {name: isDesktop ? 'Add expense' : 'add expense', exact: true}).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Cost').fill('275');
  await dialog.getByLabel('Select tag snacks', {exact: true}).click();
  await addExtra(dialog, 'office');
  await dialog.getByTestId('add-expense-save').click();
  await expect(dialog).toBeHidden();

  const snap = await adminDb().collection(`users/${user.uid}/expense`).where('cost', '==', 275).get();
  expect(snap.size).toBe(1);
  const stored = snap.docs[0].data();
  expect(stored.tags).toEqual(['snacks', 'office']);
  expect(String(stored.vendor).toLowerCase()).toContain('manual entry');
  await expect(rowFor(page, 'manual entry')).toContainText('snacks');
});
