/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {E2E_NOW} from '../fixtures/constants';
import {adminDb} from '../fixtures/seedEmulator';
import {expect, readConfig, readExpense, rowFor, test, type E2EUser} from './fixtures';

const HOUR = 3600000;
const DAY = 24 * HOUR;

/** A fresh server doc whose modifiedDate is older than the app's last sync, so an incremental fetch skips it. */
async function insertLateExpense(user: E2EUser): Promise<void> {
  const id = 'late-arrival';
  await adminDb().doc(`users/${user.uid}/expense/${id}`).set({
    id, mailId: id, vendor: 'LATE ARRIVAL', cost: 77, costType: 'debit', type: 'credit',
    date: E2E_NOW - HOUR, modifiedDate: E2E_NOW - 30 * DAY, user: 'e2e', operation: 'add', tags: ['food'], tag: 'food',
  });
}

test.describe('manage tags', () => {
  test('deleting retires a tag, duplicates are ignored case-insensitively and re-adding restores it', async ({app: page, user}) => {
    await page.goto('/setting-tags');
    const chips = page.locator('.manage-tags-chip');
    await expect(chips).toHaveCount(10);
    await expect(page.getByRole('button', {name: 'Retired tags (2)'})).toBeVisible();

    await chips.filter({hasText: /^snacks$/}).locator('.MuiChip-deleteIcon').click();
    await page.getByRole('dialog').getByRole('button', {name: 'Delete'}).click();
    await expect(chips).toHaveCount(9);
    await expect(page.getByRole('button', {name: 'Retired tags (3)'})).toBeVisible();
    await expect.poll(async () => (await readConfig(user, 'tags'))?.legacyTagList).toContain('snacks');
    expect((await readConfig(user, 'tags'))?.tagList).not.toContain('snacks');

    const addTag = async (name: string) => {
      await page.getByRole('button', {name: 'Add New Tag'}).click();
      await page.getByLabel('Tag Name').fill(name);
      await page.getByRole('dialog').getByRole('button', {name: 'Add'}).click();
      await expect(page.getByRole('dialog')).toHaveCount(0);
    };

    await addTag('FOOD');
    await expect(chips).toHaveCount(9);

    await addTag('Snacks');
    await expect(chips).toHaveCount(10);
    await expect(page.getByRole('button', {name: 'Retired tags (2)'})).toBeVisible();
    await expect.poll(async () => (await readConfig(user, 'tags'))?.tagList).toContain('Snacks');
    const config = await readConfig(user, 'tags');
    expect((config?.legacyTagList as string[]).map((tag) => tag.toLowerCase())).not.toContain('snacks');
  });

  test('restores a retired tag from the list', async ({app: page, user}) => {
    await page.goto('/setting-tags');
    await page.getByRole('button', {name: 'Retired tags (2)'}).click();
    await page.getByRole('button', {name: 'Restore tag amenities'}).click();
    await expect(page.locator('.manage-tags-chip', {hasText: /^amenities$/})).toBeVisible();
    await expect.poll(async () => (await readConfig(user, 'tags'))?.tagList).toContain('amenities');
    expect((await readConfig(user, 'tags'))?.legacyTagList).toEqual(['Movies']);
  });
});

test.describe('auto-tag', () => {
  test('matches vendor tags case- and space-insensitively and keeps tagged rows', async ({app: page, user}) => {
    await page.goto('/auto-tag-expenses');
    await page.getByRole('button', {name: 'Auto-tag All Expenses'}).click();
    await expect(page.getByText(/Auto-tagging successful! \d+ expenses were updated\./)).toBeVisible();
    const fuel = await readExpense(user, 'anchor-fuel');
    expect(fuel?.tags).toEqual(['petrol']);
    expect(fuel?.tag).toBe('petrol');
    // No mapping for this vendor, so it stays untagged.
    expect((await readExpense(user, 'anchor-stream'))?.tags).toEqual([]);
    // Already tagged rows are never overwritten.
    expect((await readExpense(user, 'anchor-pets-upper'))?.tags).toEqual(['Pets']);
  });
});

test.describe('reload data', () => {
  test('reload all fetches docs an incremental sync skips', async ({app: page, user}) => {
    await insertLateExpense(user);
    await page.reload();
    await expect(page.locator('.expense-row').first()).toBeVisible();
    await expect(rowFor(page, 'late arrival')).toHaveCount(0);

    await page.goto('/reload-expense');
    await page.getByRole('button', {name: 'Reload All Expenses'}).click();
    await expect(page.getByText('All expenses reloaded successfully.')).toBeVisible();
    await page.goto('/home');
    await expect(rowFor(page, 'late arrival')).toHaveCount(1);
  });

  test('a stale cache schema version forces a full refetch', async ({app: page, user}) => {
    await insertLateExpense(user);
    await page.evaluate(async (uid) => {
      await new Promise<void>((resolve, reject) => {
        const open = indexedDB.open(`Finance-${uid}`);
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const tx = db.transaction('config', 'readwrite');
          tx.objectStore('config').put({key: 'expenseSchemaVersion', value: 'legacy'});
          tx.oncomplete = () => { db.close(); resolve(); };
          tx.onerror = () => reject(tx.error);
        };
      });
    }, user.uid);
    await page.reload();
    await expect(rowFor(page, 'late arrival')).toHaveCount(1);
  });

  test('clear cache reports success and the app reloads from the server', async ({app: page}) => {
    await page.goto('/reload-expense');
    await page.getByRole('button', {name: 'Clear Cache'}).click();
    await expect(page.getByText('Cache deleted successfully.')).toBeVisible();
    await page.goto('/home');
    await expect(rowFor(page, 'city cafe').first()).toBeVisible();
  });
});
