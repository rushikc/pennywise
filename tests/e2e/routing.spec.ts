/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {E2E_NOW} from '../fixtures/constants';
import {expect, test} from './fixtures';

const demoBanner = (page: import('@playwright/test').Page) =>
  page.getByRole('status').filter({hasText: 'You\'re viewing demo data.'});

test.describe('routing', () => {
  test('signed-out budget shows demo budgets, not the live seed', async ({page}) => {
    await page.clock.install({time: E2E_NOW});
    await page.goto('/budget');
    await expect(demoBanner(page)).toBeVisible();
    await expect(page.getByText('Sports & Fitness')).toBeVisible();
    await expect(page.getByText('Bills', {exact: true})).toHaveCount(0);
  });

  test('an unknown route does not show seed vendors', async ({page}) => {
    await page.clock.install({time: E2E_NOW});
    await page.goto('/not-a-route');
    await expect(page.getByText('city cafe')).toHaveCount(0);
    await expect(page.getByText('Team lunch with the design crew')).toHaveCount(0);
  });

  test('profile renders the signed-in email and sign-out returns to demo data', async ({app: page, user}) => {
    await page.goto('/profile');
    await expect(page.getByText(user.email)).toBeVisible();
    await page.getByText('Sign Out', {exact: true}).click();
    await expect(demoBanner(page)).toBeVisible();
    await expect(page.getByText('Team lunch with the design crew')).toHaveCount(0);
  });
});
