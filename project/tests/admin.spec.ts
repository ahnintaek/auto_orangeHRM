import { test, expect } from '@playwright/test';
import 'dotenv/config';
import { LoginPage } from '../pages/loginPage';
import { AdminPage } from '../pages/adminPage';

test('관리자가 신규 시스템 유저를 등록하고 목록에서 확인한다', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const adminPage = new AdminPage(page);
  const userName = `Holland_${Date.now()}`;   // 실행마다 유니크하게 → 재실행 실패 방지

  await loginPage.loginAsAdmin();
  const employeeName = await adminPage.getLoggedInUserName();

  await adminPage.goto();
  await adminPage.openAddUserForm();
  await adminPage.selectUserRole('Admin');
  await adminPage.searchEmployee(employeeName);
  await adminPage.selectStatus('Enabled');
  await adminPage.fillCredentials(userName, process.env.ADMIN_PW!);
  await adminPage.save();

  await adminPage.assertUserListVisible();
  await expect(page.getByText(userName)).toBeVisible();
  await adminPage.deleteEmployee();
  await adminPage.logout();
});