/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {expect, test as base, type Locator, type Page} from '@playwright/test';
import {E2E_NOW, E2E_PASSWORD, userForWorker} from '../fixtures/constants';
import {adminDb, seedUserData} from '../fixtures/seedEmulator';

export type E2EUser = {uid: string; email: string};

type Fixtures = {
  /** This worker's emulator user, reseeded with the fixture data before every test. */
  user: E2EUser;
  /** A page signed in as `user`, on /home, with the clock pinned to E2E_NOW. */
  app: Page;
  isDesktop: boolean;
};

export const test = base.extend<Fixtures>({
  // eslint-disable-next-line no-empty-pattern
  user: async ({}, use, testInfo) => {
    const user = userForWorker(testInfo.parallelIndex);
    await seedUserData(user.uid);
    await use(user);
  },
  // eslint-disable-next-line no-empty-pattern
  isDesktop: async ({}, use, testInfo) => {
    await use(testInfo.project.name === 'desktop');
  },
  app: async ({page, user}, use) => {
    await signIn(page, user);
    await use(page);
  },
});

export {expect};

export async function signIn(page: Page, user: E2EUser): Promise<void> {
  await page.clock.install({time: E2E_NOW});
  await page.goto('/login');
  await page.waitForFunction(() => Boolean(window.__pennywiseE2E));
  await page.evaluate(
    ([email, password]) => (window.__pennywiseE2E as NonNullable<Window['__pennywiseE2E']>).signIn(email, password),
    [user.email, E2E_PASSWORD],
  );
  await page.goto('/home');
  await expect(page.locator('.expense-row').first()).toBeVisible();
}

/** Reads an expense straight from the emulator (admin, bypasses rules). */
export async function readExpense(user: E2EUser, id: string): Promise<Record<string, unknown> | undefined> {
  const snap = await adminDb().doc(`users/${user.uid}/expense/${id}`).get();
  return snap.exists ? snap.data() : undefined;
}

/** Locates a home list row by vendor (and optionally cost text). */
export const rowFor = (page: Page, vendor: string) =>
  page.locator('.expense-row').filter({has: page.locator('.vendor-name', {hasText: vendor})});

/** Admin write to one expense, stamped so the app's incremental fetch picks it up. */
export async function patchExpense(user: E2EUser, id: string, data: Record<string, unknown>): Promise<void> {
  await adminDb().doc(`users/${user.uid}/expense/${id}`).set({...data, modifiedDate: E2E_NOW}, {merge: true});
}

export async function deleteExpenseDoc(user: E2EUser, id: string): Promise<void> {
  await adminDb().doc(`users/${user.uid}/expense/${id}`).delete();
}

export async function readConfig(user: E2EUser, key: string): Promise<Record<string, unknown> | undefined> {
  const snap = await adminDb().doc(`users/${user.uid}/config/${key}`).get();
  return snap.exists ? snap.data() : undefined;
}

/** Opens the tag dialog for a row and returns the dialog locator. */
export async function openTagDialog(page: Page, row: Locator): Promise<Locator> {
  await row.locator('.vendor-name').click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByTestId('tag-save')).toBeVisible();
  return dialog;
}

/** Adds a free-text extra tag in the tag editor. */
export async function addExtra(dialog: Locator, value: string): Promise<void> {
  const input = dialog.getByPlaceholder('Add extra tags');
  await input.fill(value);
  await input.press('Enter');
  await expect(dialog.locator('.MuiAutocomplete-root .MuiChip-root', {hasText: value})).toBeVisible();
}

/** Long-presses a row (500ms hold) using the fake clock instead of a sleep. */
export async function longPress(page: Page, row: Locator): Promise<void> {
  await row.scrollIntoViewIfNeeded();
  const box = await row.locator('.vendor-name').boundingBox();
  if (!box) throw new Error('row is not visible');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.clock.runFor(700);
  await page.mouse.up();
  await expect(page.getByText(/\d+ expenses? selected/)).toBeVisible();
}

/** Switches the home list grouping on either layout. */
export async function groupHomeBy(page: Page, isDesktop: boolean, label: 'Days' | 'Vendor' | 'Tags' | 'Cost'): Promise<void> {
  if (isDesktop) {
    await page.locator('.ant-select').nth(1).click();
    await page.locator('.ant-select-item-option', {hasText: label}).click();
  } else {
    await page.getByRole('button', {name: 'Filter'}).click();
    const panel = page.locator('.home-options-panel');
    await panel.locator('.panel-section', {hasText: 'Group by'}).getByText(label, {exact: true}).click();
    await page.keyboard.press('Escape');
  }
}

/** Types into the home search box on either layout. */
export async function searchHome(page: Page, isDesktop: boolean, term: string): Promise<void> {
  if (isDesktop) {
    await page.getByPlaceholder('Search', {exact: true}).fill(term);
  } else {
    const input = page.getByPlaceholder('Search expenses...');
    if (!(await input.isVisible())) {
      await page.getByRole('button', {name: 'Search', exact: true}).click();
    }
    await input.fill(term);
  }
}

declare global {
  interface Window {
    __pennywiseE2E?: {signIn: (email: string, password: string) => Promise<string>};
  }
}
