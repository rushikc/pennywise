/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {E2E_NOW} from '../fixtures/constants';
import {adminDb} from '../fixtures/seedEmulator';
import {expect, test, type E2EUser} from './fixtures';

const DAY = 24 * 3600000;
const IMPORTED_BUDGET_ID = 'imported-late-budget';
const IMPORTED_VENDOR_ID = 'imported-late-vendor';
const IMPORTED_BUDGET_NAME = 'Late Import Budget';
const IMPORTED_VENDOR_LABEL = 'late import vendor';

const budgetCard = (page: import('@playwright/test').Page, name: string) =>
  page.getByTestId('budget-card').filter({hasText: name});

const writeImported = async (user: E2EUser): Promise<void> => {
  const age = E2E_NOW - 400 * DAY;
  await adminDb().doc(`users/${user.uid}/budget/${IMPORTED_BUDGET_ID}`).set({
    id: IMPORTED_BUDGET_ID,
    name: IMPORTED_BUDGET_NAME,
    amount: 50,
    tagList: ['food'],
    modifiedDate: age,
    operation: 'update',
  });
  await adminDb().doc(`users/${user.uid}/vendorTag/${IMPORTED_VENDOR_ID}`).set({
    id: IMPORTED_VENDOR_ID,
    vendor: 'LATE IMPORT VENDOR',
    tag: 'food',
    date: age,
  });
};

const deleteImported = async (user: E2EUser): Promise<void> => {
  await adminDb().doc(`users/${user.uid}/budget/${IMPORTED_BUDGET_ID}`).delete();
  await adminDb().doc(`users/${user.uid}/vendorTag/${IMPORTED_VENDOR_ID}`).delete();
};

test.describe('imported budgets and vendor tags', () => {
  test('incremental sync skips back-dated docs; reload all pulls them into the screen', async ({app: page, user}) => {
    try {
      await writeImported(user);
      await page.reload();
      await expect(page.getByTestId('expense-row').first()).toBeVisible();

      await page.getByRole('button', {name: 'Budget'}).click();
      await expect(budgetCard(page, 'Food')).toBeVisible();
      await expect(budgetCard(page, IMPORTED_BUDGET_NAME)).toHaveCount(0);

      await page.goto('/setting-tag-maps');
      await expect(page.getByRole('listitem').filter({hasText: 'city cafe'})).toBeVisible();
      await expect(page.getByRole('listitem').filter({hasText: IMPORTED_VENDOR_LABEL})).toHaveCount(0);

      await page.goto('/reload-expense');
      await page.getByRole('button', {name: 'Reload all data'}).click();
      await expect(page.getByText('All data reloaded successfully.')).toBeVisible();
      await page.getByRole('button', {name: 'Budget'}).click();
      await expect(budgetCard(page, IMPORTED_BUDGET_NAME)).toBeVisible();

      await page.goto('/setting-tag-maps');
      await expect(page.getByRole('listitem').filter({hasText: IMPORTED_VENDOR_LABEL})).toBeVisible();
    } finally {
      await deleteImported(user);
    }
  });

  test('a stale syncResetVersion refetches back-dated docs on the next load', async ({app: page, user}) => {
    try {
      await writeImported(user);
      await page.evaluate(async (uid) => {
        await new Promise<void>((resolve, reject) => {
          const open = indexedDB.open(`Finance-${uid}`);
          open.onerror = () => reject(open.error);
          open.onsuccess = () => {
            const db = open.result;
            const tx = db.transaction('config', 'readwrite');
            tx.objectStore('config').put({key: 'syncResetVersion', value: 'legacy'});
            tx.oncomplete = () => { db.close(); resolve(); };
            tx.onerror = () => reject(tx.error);
          };
        });
      }, user.uid);
      await page.reload();
      await expect(page.getByTestId('expense-row').first()).toBeVisible();
      await page.getByRole('button', {name: 'Budget'}).click();
      await expect(budgetCard(page, IMPORTED_BUDGET_NAME)).toBeVisible();
      await page.goto('/setting-tag-maps');
      await expect(page.getByRole('listitem').filter({hasText: IMPORTED_VENDOR_LABEL})).toBeVisible();
    } finally {
      await deleteImported(user);
    }
  });
});
