/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {defineConfig, devices} from '@playwright/test';
import {
  E2E_API_BASE,
  E2E_APP_PORT,
  E2E_AUTH_HOST,
  E2E_BASE_URL,
  E2E_FIRESTORE_HOST,
  E2E_PROJECT_ID,
  E2E_WORKER_USERS,
} from './tests/fixtures/constants';

// Workers and the seed script only ever talk to the local emulators.
process.env.FIRESTORE_EMULATOR_HOST = E2E_FIRESTORE_HOST;
process.env.FIREBASE_AUTH_EMULATOR_HOST = E2E_AUTH_HOST;
process.env.GCLOUD_PROJECT = E2E_PROJECT_ID;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: Math.min(E2E_WORKER_USERS, 4),
  timeout: 45_000,
  expect: {timeout: 10_000},
  reporter: [['list'], ['html', {open: 'never'}]],
  globalSetup: './tests/fixtures/globalSetup.ts',
  use: {
    baseURL: E2E_BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    timezoneId: 'Asia/Kolkata',
    locale: 'en-IN',
  },
  projects: [
    {
      name: 'desktop',
      grepInvert: /@visual|@perf/,
      use: {...devices['Desktop Chrome'], viewport: {width: 1280, height: 800}},
    },
    {
      name: 'mobile',
      grepInvert: /@visual|@perf/,
      testIgnore: ['**/api.spec.ts'],
      use: {...devices['Pixel 7']},
    },
    {
      // Opt-in. Baselines are OS-specific and CI does not run this project.
      name: 'visual',
      grep: /@visual/,
      workers: 1,
      use: {...devices['Desktop Chrome'], animations: 'disabled', trace: 'off'},
    },
  ],
  webServer: [
    {
      command: 'node tests/fixtures/writeApiEmulatorEnv.mjs && npm run build --prefix functions && node tests/fixtures/startE2eEmulators.mjs',
      url: `${E2E_API_BASE}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      stdout: 'ignore',
    },
    {
      command: `npx vite build --mode e2e && npx vite preview --mode e2e --host 127.0.0.1 --port ${E2E_APP_PORT}`,
      url: E2E_BASE_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ],
});
