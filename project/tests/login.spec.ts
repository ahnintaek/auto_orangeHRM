import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/loginPage';

interface LoginCase {
  description: string;
  username: string;
  password: string;
}

// 필수값 누락: 클라이언트 사이드 검증이라 페이지 이동 없이 즉시 "Required"가 표시된다.
const requiredErrorCases: LoginCase[] = [
  { description: '아이디/비밀번호 모두 빈 값', username: '', password: '' },
  { description: '아이디만 빈 값', username: '', password: 'admin123' },
  { description: '비밀번호만 빈 값', username: 'Admin', password: '' },
];

// 잘못된 자격증명: 서버 응답을 받은 뒤 "Invalid credentials" 경고가 표시된다.
const invalidCredentialCases: LoginCase[] = [
  { description: '잘못된 비밀번호', username: 'Admin', password: 'error123' },
  { description: '존재하지 않는 아이디', username: 'no_Admin', password: 'admin123' },
];

test.use({ storageState: { cookies: [], origins: [] } });

// 케이스마다 기대 결과의 형태가 달라서 if/else로 나누지 않고, 종류별로 테스트를 따로 만든다.
test.describe('로그인 실패 검증', () => {
  test.describe('필수값 누락', () => {
    for (const c of requiredErrorCases) {
      test(`로그인 실패 - ${c.description}`, async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.login(c.username, c.password);

        await expect(loginPage.requiredErrors.first()).toBeVisible({ timeout: 5000 });
        await expect(page).toHaveURL(/auth\/login/); // 실패했으므로 로그인 화면에 그대로 남아 있어야 함
      });
    }
  });

  test.describe('잘못된 자격증명', () => {
    for (const c of invalidCredentialCases) {
      test(`로그인 실패 - ${c.description}`, async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.login(c.username, c.password);

        await expect(loginPage.invalidCredentialsError).toBeVisible({ timeout: 10000 });
        await expect(loginPage.invalidCredentialsError).toHaveText('Invalid credentials');
        await expect(page).toHaveURL(/auth\/login/);
      });
    }
  });
});

test.describe('로그인 성공 및 로그아웃', () => {
  test('올바른 자격증명으로 로그인하고, 로그아웃하면 로그인 화면으로 돌아간다', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.loginAsAdmin();
    await page.waitForURL('**/dashboard/**');

    await page.locator('.oxd-userdropdown-name').click();
    await page.getByRole('menuitem', { name: 'Logout' }).click();

    await expect(page).toHaveURL(/auth\/login/);
  });
});