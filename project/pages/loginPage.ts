import { Page } from '@playwright/test';

export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/web/index.php/auth/login');
  }

  async login(username: string, password: string) {
    await this.page.getByRole('textbox', { name: 'Username' }).fill(username);
    await this.page.getByRole('textbox', { name: 'Password' }).fill(password);
    await this.page.getByRole('button', { name: 'Login' }).click();
  }

  async loginAsAdmin() {
    await this.goto();
    await this.login(process.env.ADMIN_ID!, process.env.ADMIN_PW!);
  }

  async getRequiredErrorCount(): Promise<number> {
    return this.page.getByText('Required', { exact: true }).count();
  }

  async getInvalidCredentialsError() {
    return this.page.locator('.oxd-alert-content-text');
  }

}