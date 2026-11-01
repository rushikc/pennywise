/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {devices, type Page} from '@playwright/test';
import {expect, test} from './fixtures';

// Baselines are OS-specific (generated on macOS). CI does not run the visual project.

const SCREENS = [
  {name: 'home', path: '/home', ready: '[data-testid="expense-row"]'},
  {name: 'insights', path: '/stats', ready: 'h1'},
  {name: 'budget', path: '/budget', ready: 'h5'},
  {name: 'settings', path: '/profile', ready: 'text=Connect Gmail'},
] as const;

const WIDTHS = [799, 800];
const PIXEL_7 = devices['Pixel 7'].viewport ?? {width: 412, height: 915};

async function settle(page: Page) {
  await page.waitForFunction(() => {
    const bars = [...document.querySelectorAll('.progress-bar-wrapper')];
    const barsDone = bars.every((el) => {
      const transform = getComputedStyle(el).transform;
      return transform === 'none' || transform === 'matrix(1, 0, 0, 1, 0, 0)';
    });
    const motions = [...document.querySelectorAll('.user-profile-paper, .gmail-connect-card, .budget-list')];
    const motionsDone = motions.every((el) => Number.parseFloat(getComputedStyle(el).opacity) > 0.99);
    return barsDone && motionsDone;
  });
}

function shot(page: Page) {
  return {
    maxDiffPixelRatio: 0.01,
    animations: 'disabled' as const,
    mask: [
      page.locator('.expense-avatar'),
      page.locator('.user-avatar'),
      page.locator('.user-email'),
      page.locator('.version-display'),
    ],
  };
}

test.describe('visual @visual', () => {
  for (const screen of SCREENS) {
    for (const width of WIDTHS) {
      test(`${screen.name} at ${width} @visual`, async ({app: page}) => {
        await page.setViewportSize({width, height: 800});
        await page.goto(screen.path);
        await expect(page.locator(screen.ready).first()).toBeVisible();
        if (screen.name === 'budget') await expect(page.getByText('Bills', {exact: true})).toBeVisible();
        await expect(page.getByText('You\'re viewing demo data.')).toHaveCount(0);
        await settle(page);
        await expect(page).toHaveScreenshot(`${screen.name}-${width}.png`, shot(page));
      });
    }

    test(`${screen.name} on pixel 7 @visual`, async ({app: page}) => {
      await page.setViewportSize(PIXEL_7);
      await page.goto(screen.path);
      await expect(page.locator(screen.ready).first()).toBeVisible();
      if (screen.name === 'budget') await expect(page.getByText('Bills', {exact: true})).toBeVisible();
      await expect(page.getByText('You\'re viewing demo data.')).toHaveCount(0);
      await settle(page);
      await expect(page).toHaveScreenshot(`${screen.name}-pixel7.png`, shot(page));
    });
  }
});
