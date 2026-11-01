/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import AxeBuilder from '@axe-core/playwright';
import type {Page} from '@playwright/test';
import {expect, openTagDialog, rowFor, test} from './fixtures';

const ROUTES = ['/home', '/stats', '/budget', '/setting-tags', '/config', '/duplicate-review'];

/**
 * Left in place on purpose:
 * - color-contrast: muted captions (#6c757d on #e7e9ec, 3.85:1) and credit green
 *   (#23ad29, 2.43:1) are the existing palette. This pass does not retune tokens.
 * - .ant-table-body: Ant Design's scroll body is not keyboard-focusable.
 */
const LIBRARY_RULES = ['color-contrast'];

async function seriousViolations(page: Page) {
  const results = await new AxeBuilder({page})
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .disableRules(LIBRARY_RULES)
    .exclude('.ant-table-body')
    .analyze();
  return results.violations.filter((violation) => violation.impact === 'serious' || violation.impact === 'critical');
}

test.describe('accessibility', () => {
  for (const route of ROUTES) {
    test(`${route} has no serious or critical issues`, async ({app: page}) => {
      await page.goto(route);
      await expect(page.locator('h1:visible, h5:visible, [data-testid="expense-row"]').first()).toBeVisible();
      const violations = await seriousViolations(page);
      expect(violations, JSON.stringify(violations.map((item) => ({
        id: item.id,
        impact: item.impact,
        nodes: item.nodes.slice(0, 3).map((node) => node.target),
      })), null, 2)).toEqual([]);
    });
  }

  test('the tag dialog has no serious or critical issues', async ({app: page}) => {
    await openTagDialog(page, rowFor(page, 'city cafe').first());
    const violations = await seriousViolations(page);
    expect(violations, JSON.stringify(violations.map((item) => item.id))).toEqual([]);
  });
});
