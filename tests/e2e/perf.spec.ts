/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {devices, type Page, type TestInfo} from '@playwright/test';
import {userForWorker} from '../fixtures/constants';
import {seedUserData} from '../fixtures/seedEmulator';
import {expect, signIn, test} from './fixtures';

// Home keeps every expense in the active range in the DOM. There is no row windowing.
// Numbers are logged and attached. Thresholds apply only when PERF_STRICT=1.

const perf = test.extend({
  // eslint-disable-next-line no-empty-pattern
  user: async ({}, use, testInfo) => {
    const user = userForWorker(testInfo.parallelIndex);
    await seedUserData(user.uid, {dataset: 'large'});
    await use(user);
  },
});

const viewports = [
  {name: 'desktop', size: {width: 1280, height: 800}},
  {name: 'mobile', size: devices['Pixel 7'].viewport ?? {width: 412, height: 915}},
];

async function timed(run: () => Promise<void>): Promise<number> {
  const started = Date.now();
  await run();
  return Date.now() - started;
}

async function installLongTasks(page: Page): Promise<void> {
  await page.evaluate(() => {
    const target = window as Window & {__longTasks?: number[]};
    target.__longTasks = [];
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) target.__longTasks?.push(entry.duration);
    });
    observer.observe({type: 'longtask', buffered: true});
  });
}

perf.describe('perf @perf', () => {
  for (const viewport of viewports) {
    perf(`home ${viewport.name} @perf`, async ({page, user}, testInfo: TestInfo) => {
      await page.setViewportSize(viewport.size);
      const navMs = await timed(() => signIn(page, user, 60_000));

      const beforeRows = await page.getByTestId('expense-row').count();
      const searchMs = await timed(async () => {
        if (viewport.name === 'desktop') {
          await page.getByLabel('Search expenses').fill('perf needle');
        } else {
          await page.getByRole('button', {name: 'Search', exact: true}).click();
          await page.getByPlaceholder('Search expenses...').fill('perf needle');
        }
        await expect(page.getByTestId('vendor-name').filter({hasText: 'perf needle'})).toHaveCount(5, {timeout: 30_000});
      });
      expect(await page.getByTestId('expense-row').count()).toBeLessThan(beforeRows);

      if (viewport.name === 'desktop') await page.getByLabel('Search expenses').fill('');
      else {
        await page.getByPlaceholder('Search expenses...').fill('');
        await page.locator('.phone-search-scrim').click();
      }
      await expect.poll(() => page.getByTestId('expense-row').count(), {timeout: 30_000}).toBeGreaterThan(5);

      const beforeTotal = viewport.name === 'mobile'
        ? await page.locator('.phone-stats-amount').first().innerText()
        : String(await page.getByTestId('expense-row').count());
      const filterMs = await timed(async () => {
        if (viewport.name === 'desktop') {
          await page.getByTestId('home-range').click();
          await page.locator('.ant-select-item-option', {hasText: '1 Day'}).click();
        } else {
          await page.getByRole('button', {name: 'Filter', exact: true}).click();
          await page.locator('.home-options-panel').getByText('1 Day', {exact: true}).click();
        }
        await expect.poll(async () => (
          viewport.name === 'mobile'
            ? page.locator('.phone-stats-amount').first().innerText()
            : String(await page.getByTestId('expense-row').count())
        ), {timeout: 30_000}).not.toBe(beforeTotal);
      });

      await installLongTasks(page);
      await page.mouse.wheel(0, 2400);
      await page.evaluate(() => window.scrollBy(0, 2400));
      const longTasks = await page.evaluate(() => (window as Window & {__longTasks?: number[]}).__longTasks ?? []);
      const numbers = {
        viewport: viewport.name,
        navMs,
        searchMs,
        filterMs,
        longTasks,
        longestTask: longTasks.reduce((max, value) => Math.max(max, value), 0),
        rowsBeforeSearch: beforeRows,
      };
      console.log(JSON.stringify(numbers));
      await testInfo.attach('perf.json', {
        body: JSON.stringify(numbers, null, 2),
        contentType: 'application/json',
      });
      if (process.env.PERF_STRICT === '1') {
        expect(navMs).toBeLessThan(20_000);
        expect(searchMs).toBeLessThan(8_000);
        expect(filterMs).toBeLessThan(8_000);
        expect(numbers.longestTask).toBeLessThan(1_000);
      }
    });
  }
});
