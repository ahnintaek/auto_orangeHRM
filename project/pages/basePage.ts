import { Page } from '@playwright/test';
import { expect, Locator } from '@playwright/test';
import { getInputGroup, selectDropdown, waitForFormReady  } from '../utils/formHelpers';

export class BasePage {
  constructor(protected readonly page: Page) {}

  protected async waitForPageLoad() {
    await waitForFormReady(this.page);
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
    return getInputGroup(this.page, label);
  }

  protected getFieldInput(label: string | RegExp) {
    return this.getInputGroup(label).locator('input');
  }

  protected getFieldTextArea(label: string | RegExp) {
    return this.getInputGroup(label).locator('textarea');
  }

  protected getDateInput(label: string | RegExp) {
    return this.getInputGroup(label).locator('.oxd-date-input input');
  }

  protected async selectDropdown(label: string | RegExp, value: string) {
    await selectDropdown(this.page, label, value);
  }

  protected getForm() {
    return this.page.locator('form');
  }

  protected async gotoModule(moduleName: string) {
    await this.page.getByRole('link', { name: moduleName }).click();
    await this.waitForPageLoad();
  }

  protected async addBtn() {
    await this.page.getByRole('button', { name: 'Add' }).click();
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