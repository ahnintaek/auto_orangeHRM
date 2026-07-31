import { test, expect } from '@playwright/test';
import 'dotenv/config';
import { LoginPage } from '../pages/loginPage';
import { SEED_JOB_TITLE } from '../testData/seedData';

test('Job Titles 목록 내 시드 데이터 조회 API 테스트', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.loginAsAdmin();

  const response = await page.context().request.get(
    '/web/index.php/api/v2/admin/job-titles?limit=50&offset=0&sortField=jt.jobTitleName&sortOrder=ASC'
  );

  expect(response.ok()).toBeTruthy();
  expect(response.status()).toBe(200);

  const body = await response.json();
  const jobTitleNames: string[] = body.data.map((item: { title: string }) => item.title);

  expect(jobTitleNames).toContain(SEED_JOB_TITLE);
});