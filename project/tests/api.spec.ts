import { test, expect } from '@playwright/test';
import 'dotenv/config';
import { LoginPage } from '../pages/loginPage';
import { SEED_JOB_TITLE } from '../testData/seedData';

test('Job Titles 목록 내 시드 데이터 조회 API 테스트', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.loginAsAdmin();

  const result = await page.evaluate(async () => {
    const res = await fetch(
      '/web/index.php/api/v2/admin/job-titles?limit=50&offset=0&sortField=jt.jobTitleName&sortOrder=ASC',
      { headers: { 'Accept': 'application/json' } }
    );
    const body = await res.json();
    return { status: res.status, ok: res.ok, body };
  });

  if (!result.ok) {
    console.log('API 실패 - status:', result.status);
    console.log('API 실패 - body:', JSON.stringify(result.body));
  }

  expect(result.ok).toBeTruthy();
  expect(result.status).toBe(200);

  const jobTitleNames: string[] = result.body.data.map((item: { title: string }) => item.title);
  expect(jobTitleNames).toContain(SEED_JOB_TITLE);
});