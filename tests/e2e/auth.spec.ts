/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import type {Page} from '@playwright/test';
import {E2E_NOW, E2E_PASSWORD, POPUP_USER_EMAIL} from '../fixtures/constants';
import {adminAuth} from '../fixtures/seedEmulator';
import {expect, rowFor, signIn, test} from './fixtures';

const demoBanner = (page: Page) => page.getByRole('status').filter({hasText: 'You\'re viewing demo data.'});

test.describe('auth', () => {
  test('signed-out visitors see demo data, never the live seed', async ({page}) => {
    await page.clock.install({time: E2E_NOW});
    await page.goto('/home');
    await expect(demoBanner(page)).toBeVisible();
    await expect(page.locator('.expense-row').first()).toBeVisible();
    await expect(rowFor(page, 'city cafe').filter({hasText: 'Team lunch'})).toHaveCount(0);
  });

  test('an allowlisted emulator user gets live data and no banner', async ({app: page}) => {
    await expect(rowFor(page, 'city cafe').first()).toBeVisible();
    await expect(rowFor(page, 'pet pals')).toHaveCount(2);
    await expect(demoBanner(page)).toHaveCount(0);
  });

  test('a signed-in user who is not allowlisted falls back to demo mode', async ({page}, testInfo) => {
    const stranger = {uid: `e2e-stranger-${testInfo.parallelIndex}`, email: `stranger${testInfo.parallelIndex}@example.com`};
    const auth = adminAuth();
    await auth.deleteUser(stranger.uid).catch(() => undefined);
    await auth.createUser({...stranger, password: E2E_PASSWORD, emailVerified: true});
    await signIn(page, stranger);
    await expect(demoBanner(page)).toBeVisible();
  });

  test('Google sign-in through the emulator popup lands on home', async ({page, isDesktop}) => {
    test.skip(!isDesktop, 'One popup run is enough; the flow is layout independent.');
    test.skip(Boolean(process.env.E2E_SKIP_POPUP), 'The emulator sign-in widget loads its scripts from unpkg.com.');
    // Start from an empty account picker so the widget always shows the add-account form.
    await adminAuth().getUserByEmail(POPUP_USER_EMAIL).then((existing) => adminAuth().deleteUser(existing.uid), () => undefined);
    // No fake clock here: Firebase polls the popup with timers, and a pinned clock stalls the handoff.
    await page.goto('/login');
    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      page.getByRole('button', {name: 'Sign in with Google'}).click(),
    ]);
    // The widget wires its buttons after its scripts load; clicking earlier is a no-op.
    await popup.waitForLoadState('load');
    const email = popup.locator('#email-input');
    await expect(async () => {
      await popup.getByText('Add new account').click();
      await expect(email).toBeVisible({timeout: 1000});
    }).toPass();
    // The emulator widget has no accessible labels, so use its stable element ids.
    await email.fill(POPUP_USER_EMAIL);
    await popup.locator('#sign-in').click();
    await expect(page).toHaveURL(/\/home$/);
    // Allowlisted but with no data yet: live mode, no demo banner.
    await expect(demoBanner(page)).toHaveCount(0);
  });
});
