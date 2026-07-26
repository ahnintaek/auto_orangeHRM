import { Page, expect } from '@playwright/test';
import { BasePage } from './basePage';

export class AdminPage extends BasePage {

  async goto() {
    await this.page.getByRole('link', { name: 'Admin' }).click();
  }

  async openAddUserForm() {
    await this.page.getByRole('button', { name: 'Add' }).click();
  }

  async selectUserRole(role: string) {
    await this.page.getByText('-- Select --').first().click();
    await this.page.getByRole('option', { name: role }).click();
  }

  async searchEmployee(employeeName: string) {
    const input = this.page.getByRole('textbox', { name: 'Type for hints...' });
    await input.fill(employeeName);
    await expect(this.page.getByRole('option', { name: 'Searching....' })).toBeHidden({ timeout: 10000 });

    const lastName = employeeName.split(' ').pop()!;
    const option = this.page.getByRole('option').filter({ hasText: lastName });
    await expect(option).toBeVisible({ timeout: 10000 });
    await option.click();
  }

  async selectStatus(status: string) {
    await this.page.getByText('-- Select --').click();
    await this.page.getByRole('option', { name: status }).click();
  }

  async fillCredentials(username: string, password: string) {
    await this.getFieldInput('Username').fill(username);
    await this.getFieldInput(/^Password$/).fill(password);
    await this.getFieldInput('Confirm Password').fill(password);
  }

  override async save() {
    await super.save();
    await this.page.waitForURL('**/admin/viewSystemUsers**');
  }

  async assertUserListVisible() {
    await expect(this.page.getByRole('heading', { name: 'System Users' })).toBeVisible();
  }

  async deleteEmployee() {
    await this.page.locator('.oxd-icon.bi-check').first().click();
    await this.page.getByRole('button', { name: 'Delete Selected' }).click();
    await this.page.getByRole('button', { name: 'Yes, Delete' }).click();
  }
}