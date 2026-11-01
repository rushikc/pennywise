/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {expect, test} from './fixtures';

test.describe('config', () => {
  test('dark mode updates the document theme and survives reload', async ({app: page}) => {
    await page.goto('/profile');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.getByText('Dark Theme', {exact: true}).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByText('Light Theme', {exact: true})).toBeVisible();
  });

  test('adds and deletes a bank', async ({app: page}) => {
    await page.goto('/setting-banks');
    await expect(page.getByText('Sample Bank A')).toBeVisible();
    await page.getByRole('button', {name: 'Add bank'}).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Bank display name').fill('E2E Bank');
    await dialog.getByLabel('Match phrases').fill('E2EBANK');
    await dialog.getByRole('button', {name: 'Add'}).click();
    await expect(page.getByText('E2E Bank')).toBeVisible();

    const row = page.getByRole('listitem').filter({hasText: 'E2E Bank'});
    await row.getByRole('button', {name: 'delete'}).click();
    await page.getByRole('dialog').getByRole('button', {name: 'Delete'}).click();
    await expect(page.getByText('E2E Bank')).toHaveCount(0);
    await expect(page.getByText('Sample Bank A')).toBeVisible();
  });

  test('the HDFC UPI switch survives reload', async ({app: page}) => {
    await page.goto('/config');
    const toggle = page.getByLabel('Enable HDFC UPI');
    await expect(toggle).not.toBeChecked();
    await toggle.click();
    await expect(toggle).toBeChecked();
    await page.reload();
    await expect(page.getByLabel('Enable HDFC UPI')).toBeChecked();
  });
});
