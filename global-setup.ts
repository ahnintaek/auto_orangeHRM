import { chromium, BrowserContext, Page } from '@playwright/test';
import { env } from './project/utils/env';
import { selectDropdown, waitForFormReady, goToNextInstallerStep } from './project/utils/formHelpers';
import { LoginPage } from './project/pages/loginPage';
import { SEED_JOB_TITLE, SEED_JOB_CATEGORY } from './project/testData/seedData';
import {
  createJobCategory,
  createJobTitle,
  listJobCategories,
  listJobTitles,
} from './project/api/jobApi';

// 1) 컨테이너가 완전히 응답할 때까지 재시도
async function waitForContainer(page: Page) {
  for (let i = 0; i < 20; i++) {
    try {
      await page.goto(env.baseURL, { timeout: 5000 });
      return;
    } catch {
      await page.waitForTimeout(3000);
    }
  }
  throw new Error('OrangeHRM 컨테이너가 시간 내에 응답하지 않았습니다');
}

// 2) 설치 마법사: 아직 설치되지 않은 환경에서만 실행한다. (단계 내용은 기존과 동일)
async function runInstaller(page: Page) {
  console.log('[global-setup] 설치 마법사 시작');

  // 3) Welcome 화면
  await page.getByRole('button', { name: 'Next' }).click();

  // 4) 라이선스 동의
  await page.getByText('I accept the terms in the').click();
  await goToNextInstallerStep(page);

  // 5) Database Configuration
  await page.getByText('Existing Empty Database').click();
  await page.getByRole('textbox').first().fill('db');                    // Host
  await page.getByRole('textbox').nth(2).fill('orangehrm');               // DB Name
  await page.getByRole('textbox').nth(3).fill('orangehrm');               // DB Username
  await page.locator('input[type="password"]').fill('orangehrm');        // DB Password
  await goToNextInstallerStep(page);

  // 6) 데이터 암호화 확인 화면
  await goToNextInstallerStep(page);

  // 7) Organization 정보
  await page.getByRole('textbox').fill('orangehrm');   // Organization Name (라벨 중복 없어서 그대로 둬도 무방, 여유되면 getFieldInput으로 교체 가능)
  await selectDropdown(page, 'Country', 'Korea, Republic of');
  await selectDropdown(page, 'Language', 'English (United States)');
  await selectDropdown(page, 'Timezone', 'Asia/Seoul');
  await goToNextInstallerStep(page);
  await waitForFormReady(page);

  // 8) 관리자 계정 생성 - 민감 정보는 env로 분리
  await page.getByPlaceholder('First Name').fill(env.adminFirstName || 'ahn');
  await page.getByPlaceholder('Last Name').fill(env.adminLastName || 'intaek');
  await page.getByRole('textbox').nth(2).fill(env.adminEmail);
  await page.getByRole('textbox').nth(4).fill(env.adminId);
  await page.getByRole('textbox').nth(5).fill(env.adminPw);
  await page.locator('input[type="password"]').nth(1).fill(env.adminPw);
  await goToNextInstallerStep(page);

  // 9) 설치 실행 - 여기서 실제 DB 마이그레이션이 진행되므로 넉넉한 타임아웃 필요
  console.log('[global-setup] DB 마이그레이션 시작 - 시간이 걸릴 수 있습니다');
  await page.getByRole('button', { name: 'Install' }).click();
  await page.getByRole('button', { name: 'Next' }).waitFor({ timeout: 300_000 }); // 최대 5분 대기
  await goToNextInstallerStep(page);

  // 10) 설치 완료
  await page.getByRole('button', { name: 'Launch OrangeHRM' }).click();
  await page.waitForURL('**/auth/login', { timeout: 30_000 });

  console.log('[global-setup] 설치 완료');
}

// 3) 시드 데이터: 설치 여부와 상관없이 매 실행마다 "없으면 만든다".
async function ensureSeedData(page: Page, context: BrowserContext) {
  await new LoginPage(page).loginAsAdmin();
  await page.waitForURL('**/dashboard/**', { timeout: 30_000 });

  const request = context.request; // 브라우저와 같은 로그인 쿠키를 사용한다

  const jobTitles = await listJobTitles(request);
  if (jobTitles.some((job) => job.title === SEED_JOB_TITLE)) {
    console.log('[global-setup] Job Title 시드 데이터 이미 존재 - 건너뜀');
  } else {
    console.log('[global-setup] Job Title 시드 데이터 생성');
    await createJobTitle(request, {
      title: SEED_JOB_TITLE,
      description: `Job Title Description for ${SEED_JOB_TITLE}`,
      note: `Job Title Note for ${SEED_JOB_TITLE}`,
    });
  }

  const jobCategories = await listJobCategories(request);
  if (jobCategories.some((category) => category.name === SEED_JOB_CATEGORY)) {
    console.log('[global-setup] Job Category 시드 데이터 이미 존재 - 건너뜀');
  } else {
    console.log('[global-setup] Job Category 시드 데이터 생성');
    await createJobCategory(request, SEED_JOB_CATEGORY);
  }
}

async function globalSetup() {
  const browser = await chromium.launch({
    headless: env.isCI,
    slowMo: env.isCI ? 0 : 300,
  });

  try {
    const context = await browser.newContext({ baseURL: env.baseURL });
    const page = await context.newPage();

    try {
      await waitForContainer(page);

      if (page.url().includes('/auth/login')) {
        console.log('[global-setup] 이미 설치된 상태 - 설치 단계 건너뜀');
      } else {
        await runInstaller(page);
      }

      await ensureSeedData(page, context);
    } catch (e) {
      await page.screenshot({ path: 'test-results/global-setup-failure.png', fullPage: true }).catch(() => {});
      throw e;
    }
  } finally {
    await browser.close();
  }
}

export default globalSetup;