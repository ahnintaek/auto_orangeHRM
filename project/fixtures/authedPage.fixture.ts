// fixtures/authedPage.fixture.ts
import { test as base, Page } from '@playwright/test';

class CleanupRegistry {
  private tasks: Array<{ name: string; run: () => Promise<void> }> = [];

  add(name: string, run: () => Promise<void>) {
    this.tasks.push({ name, run });
  }

  async runAll() {
    for (const task of this.tasks.reverse()) {
      try {
        await task.run();
      } catch (e) {
        // 정리 실패가 테스트 결과를 덮어쓰지 않도록 경고만 남김
        console.warn(`[cleanup 실패] ${task.name}:`, e);
      }
    }
  }
}

export const test = base.extend<{ authedPage: Page; cleanup: CleanupRegistry }>({
  authedPage: async ({ page }, use) => { /* 기존 구현 */ await use(page); },

  cleanup: async ({ authedPage }, use) => {
    const registry = new CleanupRegistry();
    await use(registry);
    await registry.runAll();
  },
});
export { expect } from '@playwright/test';