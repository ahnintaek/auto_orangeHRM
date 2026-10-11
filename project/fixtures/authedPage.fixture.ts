
import { test as base, Page } from '@playwright/test';

class CleanupRegistry {
  private tasks: Array<{
    name: string;
    run: () => Promise<void>;
  }> = [];

  add(name: string, run: () => Promise<void>) {
    this.tasks.push({ name, run });
  }

  async runAll() {
    for (const task of this.tasks.reverse()) {
      try {
        await task.run();
      } catch (e) {
        console.warn(`[cleanup 실패] ${task.name}:`, e);
      }
    }
  }
}

export const test = base.extend<{
  authedPage: Page;
  cleanup: CleanupRegistry;
  apiCleanup: CleanupRegistry;
  
}>({
  authedPage: async ({ page }, use) => {
    await page.goto('/web/index.php/dashboard/index');
    await use(page);
  },

  cleanup: async ({ authedPage }, use) => {
    const registry = new CleanupRegistry();
    await use(registry);
    await registry.runAll();
  },

  apiCleanup: async ({ request }, use) => {
    const registry = new CleanupRegistry();
    await use(registry);
    await registry.runAll();
  },
});

export { expect } from '@playwright/test';