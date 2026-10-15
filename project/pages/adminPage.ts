import { expect, Locator } from '@playwright/test';
import { BasePage } from './basePage';

interface ExpectedUser {
  role: string;
  status: string;
  employeeName: string;
}

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export class AdminPage extends BasePage {
  async goto() {
    await this.gotoModule('Admin');
  }

  async openAddUserForm() {
    await this.addBtn();
  }

  async selectUserRole(role: string) {
    await this.selectDropdown('User Role', role);
  }

  async selectStatus(status: string) {
    await this.selectDropdown('Status', status);
  }

  async searchEmployee(employeeName: string) {
    const input = this.page.getByRole('textbox', { name: 'Type for hints...' });
    await input.fill(employeeName);
    await expect(this.page.getByRole('option', { name: 'Searching....' })).toBeHidden({
      timeout: 10000,
    });

    const fullName = new RegExp(
      employeeName.trim().split(/\s+/).map(escapeRegExp).join('\\s+'),
      'i',
    );
    const option = this.page.getByRole('option').filter({ hasText: fullName });
    await expect(option).toBeVisible({ timeout: 10000 });
    await option.click();
  }

  async fillCredentials(username: string, password: string, confirmPassword = password) {
    await this.getFieldInput('Username').fill(username);
    await this.getFieldInput(/^Password$/).fill(password);
    await this.getFieldInput('Confirm Password').fill(confirmPassword);
  }

  override async save() {
    await super.save();
    await this.page.waitForURL('**/admin/viewSystemUsers**');
  }

  async submitForm() {
    await super.save();
  }

  fieldError(label: string): Locator {
    return this.getInputGroup(label).locator('.oxd-input-field-error-message');
  }

  userRow(username: string) {
    return this.page.locator('.oxd-table-card').filter({
      has: this.page.getByText(username, { exact: true }),
    });
  }

  async expectUserListed(username: string, expected: ExpectedUser) {
    const row = this.userRow(username);
    await expect(row).toHaveCount(1);
    await expect(row).toContainText(expected.role);
    await expect(row).toContainText(expected.status);
    await expect(row).toContainText(expected.employeeName);
  }

  async deleteUserByName(username: string) {
    await this.waitForPageLoad();
    const row = this.userRow(username);
    await expect(row).toHaveCount(1);

    await row.locator('.oxd-icon.bi-trash').click();
    await this.page.getByRole('button', { name: 'Yes, Delete' }).click();

    await expect(this.page.getByText('Successfully Deleted')).toBeVisible();
    await expect(row).toHaveCount(0);
  }

  async deleteUserIfExists(username: string) {
    await this.goto();
    const exists = await this.userRow(username)
      .first()
      .waitFor({ state: 'attached', timeout: 5000 })
      .then(
        () => true,
        () => false,
      );
    if (!exists) return;
    await this.deleteUserByName(username);
  }
}