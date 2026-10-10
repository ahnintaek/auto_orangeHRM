import { defineConfig } from '@playwright/test';
import { env } from './project/utils/env';
import { ADMIN_AUTH_FILE } from './project/utils/paths';

export default defineConfig({
  globalSetup: require.resolve('./global-setup.ts'),
  testDir: './project/tests',
  fullyParallel: true,
  forbidOnly: env.isCI,
  retries: env.isCI ? 2 : 0,
  workers: env.isCI ? 2 : undefined,
  reporter: [
    ['list'],
    ['html', {
      outputFolder: 'playwright-report',
      open: 'never'
    }],
    ['github']
  ],

  use: {
    baseURL : env.baseURL,
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
        viewport: env.isCI ? { width: 1920, height: 1080 } : null,
        launchOptions: {
          headless: env.isCI,
          args: env.isCI ? [] : ['--start-maximized'],
        },
      },
    },
    {
      name: 'chromium',
      testDir: './project/tests',
      use: {
        browserName: 'chromium',
        viewport: env.isCI ? { width: 1920, height: 1080 } : null,
        launchOptions: {
          headless: env.isCI, // CI에서는 true, 로컬에서는 false
          args: env.isCI ? [] : ['--start-maximized'],
        },
        storageState: ADMIN_AUTH_FILE, 
      },
      dependencies: ['setup'],
    },

  ],

});
