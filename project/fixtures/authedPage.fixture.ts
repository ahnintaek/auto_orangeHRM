import { test as base, Page } from "@playwright/test";

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
    await page.goto("/web/index.php/dashboard/index");
    await use(page);
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- 본문에서는 안 쓰지만, authedPage보다 먼저 정리되도록 의존성으로 선언
  cleanup: async ({ authedPage }, use) => {
    const registry = new CleanupRegistry();
    await use(registry);
    await registry.runAll();
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- request가 살아 있는 동안 정리가 실행되도록 의존성으로 선언
  apiCleanup: async ({ request }, use) => {
    const registry = new CleanupRegistry();
    await use(registry);
    await registry.runAll();
  },
});

export { expect } from "@playwright/test";
