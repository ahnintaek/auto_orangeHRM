import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const ENV = process.env.TEST_ENV

export default defineConfig({
  globalSetup: require.resolve('./global-setup.ts'),
  testDir: './project/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', {
      outputFolder: 'playwright-report',
      open: 'never'
    }],
    ['github']
  ],

  use: {
    baseURL: 'http://localhost:8080',
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
      name: 'chromium',
      use: {
        browserName: 'chromium',
        viewport: process.env.CI ? { width: 1920, height: 1080 } : null,
        launchOptions: {
          headless: !!process.env.CI,              // CI에서는 true, 로컬에서는 false
          args: process.env.CI ? [] : ['--start-maximized'],
        },
      },
    },

  ],

});
