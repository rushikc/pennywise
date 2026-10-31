/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {expect, test} from '@playwright/test';
import {
  E2E_API_BASE,
  E2E_API_OWNER,
  E2E_API_TOKEN,
} from '../fixtures/constants';
import {seedUserData} from '../fixtures/seedEmulator';
import {openTagDialog, readExpense, rowFor, signIn} from './fixtures';

test.describe.configure({mode: 'serial'});

test.describe('pennywise api', () => {
  test.beforeEach(async ({page}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'API spec is desktop-only');
    test.skip(process.env.E2E_SKIP_API === '1', 'E2E_SKIP_API');
    await seedUserData(E2E_API_OWNER.uid);
    await signIn(page, E2E_API_OWNER);
  });

  test('health is public and expenses require a token', async ({request}) => {
    const health = await request.get(`${E2E_API_BASE}/health`);
    expect(health.status()).toBe(200);
    expect(await health.json()).toEqual({ok: true});

    const missing = await request.get(`${E2E_API_BASE}/expenses`);
    expect(missing.status()).toBe(401);

    const wrong = await request.get(`${E2E_API_BASE}/expenses`, {
      headers: {Authorization: 'Bearer not-the-e2e-api-token-0123456789abcdef'},
    });
    expect(wrong.status()).toBe(401);
  });

  test('lists seeded untagged anchors without mailId', async ({request}) => {
    const res = await request.get(`${E2E_API_BASE}/expenses?untagged=true&limit=200`, {
      headers: {Authorization: `Bearer ${E2E_API_TOKEN}`},
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    const ids = body.items.map((item: {id: string}) => item.id);
    expect(ids).toEqual(expect.arrayContaining(['anchor-books', 'anchor-fuel', 'anchor-stream']));
    for (const item of body.items) {
      expect(item.tags).toEqual([]);
      expect(item.mailId).toBeUndefined();
    }
  });

  test('patches an untagged row that reload all then shows in the list', async ({page, request}) => {
    const res = await request.patch(`${E2E_API_BASE}/expense/anchor-books`, {
      headers: {Authorization: `Bearer ${E2E_API_TOKEN}`},
      data: {tags: ['food', 'api extra'], description: 'API dinner note'},
    });
    expect(res.status()).toBe(200);

    await page.goto('/reload-expense');
    await page.getByRole('button', {name: 'Reload All Expenses'}).click();
    await expect(page.getByText('All expenses reloaded successfully.')).toBeVisible();
    await page.goto('/home');

    const row = rowFor(page, 'book nook');
    await expect(row).toContainText('food');
    await expect(row.locator('.expense-extra-chip', {hasText: 'api extra'})).toBeVisible();
    await expect(row.getByLabel('Expense note').first()).toBeVisible();
  });

  test('app note save keeps extras written by the api', async ({page, request}) => {
    const patched = await request.patch(`${E2E_API_BASE}/expense/anchor-cafe`, {
      headers: {Authorization: `Bearer ${E2E_API_TOKEN}`},
      data: {tags: ['food', 'api kept']},
    });
    expect(patched.status()).toBe(200);

    const dialog = await openTagDialog(page, rowFor(page, 'city cafe'));
    await dialog.getByLabel('Note').fill('Note only from the app');
    await dialog.getByTestId('tag-save').click();
    await expect(dialog).toBeHidden();

    const stored = await readExpense(E2E_API_OWNER, 'anchor-cafe');
    expect(stored?.description).toBe('Note only from the app');
    expect(stored?.tags).toEqual(expect.arrayContaining(['food', 'api kept']));
  });

  test('rejects a primary change and leaves the row unchanged', async ({page, request}) => {
    const res = await request.patch(`${E2E_API_BASE}/expense/anchor-cafe`, {
      headers: {Authorization: `Bearer ${E2E_API_TOKEN}`},
      data: {tags: ['rent']},
    });
    expect(res.status()).toBe(409);
    await expect(rowFor(page, 'city cafe')).toContainText('food');
  });
});
