import { Page } from '@playwright/test';
import { expect, Locator } from '@playwright/test';

export class BasePage {
  constructor(protected readonly page: Page) {}

  protected async waitForPageLoad() {
    const loader = this.page.locator('.oxd-form-loader');
    await loader.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
    await loader.waitFor({ state: 'hidden', timeout: 10000 });
  }

  protected async fillAndVerify(input: Locator, value: string) {
    await input.fill(value);
    try {
      await expect(input).toHaveValue(value, { timeout: 1000 });
    } catch {
      await input.fill(value);
      await expect(input).toHaveValue(value, { timeout: 5000 });
    }
  }
  
  protected async fillFields(fields: [string | RegExp, string][]) {
    for (const [label, value] of fields) {
      await this.fillAndVerify(this.getFieldInput(label), value);
    }
  }

  protected getInputGroup(label: string | RegExp) {
    return this.page
      .locator('.oxd-input-group')
      .filter({
        has: this.page.getByText(label, { exact: true }),
      });
  }
  
  protected getFieldInput(label: string | RegExp) {
    return this.getInputGroup(label).locator('input');
  }
  
  protected getDateInput(label: string | RegExp) {
    return this.getInputGroup(label).locator('.oxd-date-input input');
  }
  
  protected async selectDropdown(label: string | RegExp, value: string) {
    const group = this.getInputGroup(label);
  
    await group.locator('.oxd-select-text').click();
    await this.page.getByRole('option', { name: value, exact: true }).click();
  }

  protected getForm() {
    return this.page.locator('form');
  }

  async save() {
    await this.getForm()
      .getByRole('button', { name: 'Save', exact: true })
      .click();
  }

  async getLoggedInUserName(): Promise<string> {
    return (await this.page.locator('.oxd-userdropdown-name').innerText()).trim();
  }

  async logout() {
    await this.page.locator('.oxd-userdropdown-name').click();
    await this.page.getByRole('menuitem', { name: 'Logout' }).click();
  }
}