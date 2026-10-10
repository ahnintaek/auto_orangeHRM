import { test as setup } from '@playwright/test';
import { LoginPage } from '../pages/loginPage';
import { ADMIN_AUTH_FILE } from '../utils/paths';

setup('관리자로 로그인하고 인증 상태를 저장한다', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.loginAsAdmin();
  await page.waitForURL('**/dashboard/**', { timeout: 15000 });

  await page.context().storageState({ path: ADMIN_AUTH_FILE });
});
