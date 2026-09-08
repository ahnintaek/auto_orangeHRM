import { test as base } from '@playwright/test';

export const test = base.extend<{
  authedPage: import('@playwright/test').Page;
}>({
  authedPage: async ({ page }, use) => {
    await page.goto('/web/index.php/dashboard/index');
    await use(page);
  },
});

export { expect } from '@playwright/test';