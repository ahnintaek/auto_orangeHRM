import { Page } from '@playwright/test';

export function getInputGroup(page: Page, label: string | RegExp) {
  return page.locator('.oxd-input-group').filter({
    has: page.getByText(label, { exact: true }),
  });
}

export async function selectDropdown(page: Page, label: string | RegExp, value: string) {
  const group = getInputGroup(page, label);
  await group.locator('.oxd-select-text').click();
  await page.getByRole('option', { name: value, exact: true }).click();
}

export async function waitForFormReady(page: Page) {
    const loader = page.locator('.oxd-form-loader');
    await loader.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
    await loader.waitFor({ state: 'hidden', timeout: 10000 });
  }