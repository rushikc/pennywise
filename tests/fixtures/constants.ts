/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

/** Shared by playwright.config.ts, the seed script and the specs. Synthetic values only. */
export const E2E_PROJECT_ID = 'demo-pennywise';
export const E2E_FIRESTORE_HOST = '127.0.0.1:8080';
export const E2E_AUTH_HOST = '127.0.0.1:9099';
export const E2E_APP_PORT = 3100;
export const E2E_BASE_URL = `http://127.0.0.1:${E2E_APP_PORT}`;
export const E2E_PASSWORD = 'e2e-password-123';

/** Fixed "now" for the browser clock and for every seeded date: 15 Jun 2026, 12:00 IST. */
export const E2E_NOW = Date.UTC(2026, 5, 15, 6, 30, 0);

/** Pool of emulator users, one per Playwright worker, all allowlisted. */
export const E2E_WORKER_USERS = 8;
export const userForWorker = (index: number): {uid: string; email: string} => ({
  uid: `e2e-user-${index}`,
  email: index === 0 ? 'test@example.com' : `test+w${index}@example.com`,
});

/** Allowlisted, never seeded with data; used by the real Google button flow. */
export const POPUP_USER_EMAIL = 'popup@example.com';
