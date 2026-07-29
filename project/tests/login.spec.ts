import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/loginPage';

interface LoginCase {
  description: string;
  username: string;
  password: string;
  expectedError: 'required' | 'invalid';
}

const loginCases: LoginCase[] = [
  { description: '아이디/비밀번호 모두 빈 값', username: '', password: '', expectedError: 'required' },
  { description: '아이디만 빈 값', username: '', password: 'admin123', expectedError: 'required' },
  { description: '비밀번호만 빈 값', username: 'Admin', password: '', expectedError: 'required' },
  { description: '잘못된 비밀번호', username: 'Admin', password: 'error123', expectedError: 'invalid' },
  { description: '존재하지 않는 아이디', username: 'no_Admin', password: 'admin123', expectedError: 'invalid' },
];

test.describe('로그인 실패 검증', () => {
  for (const c of loginCases) {
    test(`로그인 실패 - ${c.description}`, async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(c.username, c.password);

      if (c.expectedError === 'required') {
        // 클라이언트 사이드 검증: 페이지 이동 없이 즉시 노출
        const requiredErrors = await loginPage.getRequiredErrorLocator();
        await expect(requiredErrors.first()).toBeVisible({ timeout: 5000 });
      } else {
        // 서버 응답 기반 검증: 요청 후 alert 노출까지 자동 대기
        await expect(await loginPage.getInvalidCredentialsError()).toBeVisible({ timeout: 10000 });
        await expect(await loginPage.getInvalidCredentialsError()).toHaveText('Invalid credentials');
      }

      // 공통: 실패했으므로 로그인 화면에 그대로 남아있어야 함
      await expect(page).toHaveURL(/auth\/login/);
    });
  }
});