/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {readFileSync} from 'node:fs';
import {E2E_NOW} from '../fixtures/constants';
import {expect, test} from './fixtures';

type SeedExpense = {cost: number; costType: string; date: number; tags?: string[]; tag?: string | null};

const seedExpenses: SeedExpense[] = JSON.parse(readFileSync('tests/fixtures/seed/expenses.json', 'utf8'));
const FOOD_TAGS = new Set(['food', 'groceries', 'snacks']);

const istMonth = (ms: number): string => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: '2-digit',
}).format(ms);

const primary = (row: SeedExpense): string => {
  const fromList = Array.isArray(row.tags) && row.tags.length > 0 ? row.tags[0] : row.tag;
  return typeof fromList === 'string' ? fromList.toLowerCase() : '';
};

const foodSpent = seedExpenses
  .filter((row) => row.costType === 'debit')
  .filter((row) => istMonth(row.date) === istMonth(E2E_NOW))
  .filter((row) => FOOD_TAGS.has(primary(row)))
  .reduce((sum, row) => sum + Number(row.cost), 0);

const rupees = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
}).format(Math.round(foodSpent));

const budgetCard = (page: import('@playwright/test').Page, name: string) =>
  page.getByTestId('budget-card').filter({hasText: name});

test.describe('budgets', () => {
  test('shows the seed primary-tag total for the pinned month', async ({app: page}) => {
    await page.goto('/budget');
    await expect(budgetCard(page, 'Food').getByTestId('spent-amount')).toHaveText(`Spent: ${rupees}`);
  });

  test('creates, edits, and deletes a budget', async ({app: page}) => {
    await page.goto('/budget');
    await page.getByRole('button', {name: 'add'}).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Budget Name').fill('Pets care');
    await dialog.getByLabel('Amount').fill('100');
    await dialog.getByRole('button', {name: 'pets', exact: true}).click();
    await dialog.getByRole('button', {name: 'Create'}).click();
    await expect(budgetCard(page, 'Pets care')).toBeVisible();

    await budgetCard(page, 'Pets care').click();
    await dialog.getByLabel('Amount').fill('200');
    await dialog.getByRole('button', {name: 'Save'}).click();
    await expect(budgetCard(page, 'Pets care')).toContainText('₹200');

    await budgetCard(page, 'Pets care').click();
    await dialog.getByRole('button', {name: 'Delete'}).click();
    await expect(budgetCard(page, 'Pets care')).toHaveCount(0);
  });
});
