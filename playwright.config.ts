import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const ENV_BASE_URLS: Record<string, string> = {
  local: 'http://localhost:8080',
};
const TEST_ENV = process.env.TEST_ENV ?? 'local';
const baseURL = ENV_BASE_URLS[TEST_ENV] ?? ENV_BASE_URLS.local;

const ADMIN_AUTH_FILE = 'playwright/.auth/admin.json';

export default defineConfig({
  globalSetup: require.resolve('./global-setup.ts'),
  testDir: './project/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['list'],
    ['html', {
      outputFolder: 'playwright-report',
      open: 'never'
    }],
    ['github']
  ],

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'ko-KR',
    actionTimeout: 15000,
    navigationTimeout: 15000,
  },

  timeout: 60_000,
  
  expect: {
    timeout: 30000,
  },

  projects: [
    {
      name: 'setup',
      testDir: './project/setup',
      testMatch: /.*\.setup\.ts/,
      use: {
        browserName: 'chromium',
        viewport: process.env.CI ? { width: 1920, height: 1080 } : null,
        launchOptions: {
          headless: !!process.env.CI,
          args: process.env.CI ? [] : ['--start-maximized'],
        },
      },
    },
    {
      name: 'chromium',
      testDir: './project/tests',
      use: {
        browserName: 'chromium',
        viewport: process.env.CI ? { width: 1920, height: 1080 } : null,
        launchOptions: {
          headless: !!process.env.CI, // CI에서는 true, 로컬에서는 false
          args: process.env.CI ? [] : ['--start-maximized'],
        },
        storageState: ADMIN_AUTH_FILE, 
      },
      dependencies: ['setup'],
    },

  ],

});
