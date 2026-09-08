import { test as setup } from '@playwright/test';
import 'dotenv/config';
import { LoginPage } from '../pages/loginPage';

const ADMIN_AUTH_FILE = 'playwright/.auth/admin.json';

/**
 * 인증 셋업 테스트 (setup 프로젝트 전용).
 *
 * 예전에는 admin/pim/jobsetting/api/buzz 스펙 6개가 각자 loginPage.loginAsAdmin()으로
 * 매번 UI 로그인을 반복했다. 로그인 자체는 이미 login.spec.ts에서 충분히 검증하고 있으므로,
 * 나머지 스펙에서는 "이미 로그인된 상태"만 필요하다.
 *
 * 이 테스트는 딱 한 번만 실행되어 로그인 후의 브라우저 상태(쿠키/로컬스토리지)를
 * playwright/.auth/admin.json 에 저장하고, playwright.config.ts의 chromium 프로젝트가
 * 이 파일을 storageState로 재사용한다. 결과적으로:
 *  - 로그인 UI 조작 횟수: (스펙 개수)회 -> 1회로 감소 -> 전체 실행 시간 단축
 *  - 스펙 파일에서 "무엇을 로그인했는지"가 아니라 "로그인된 상태에서 무엇을 검증하는지"만 남음
 */
setup('관리자로 로그인하고 인증 상태를 저장한다', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.loginAsAdmin();
  await page.waitForURL('**/dashboard/**', { timeout: 15000 });

  await page.context().storageState({ path: ADMIN_AUTH_FILE });
});
