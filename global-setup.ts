import { chromium } from '@playwright/test';
import 'dotenv/config';
import { selectDropdown, waitForFormReady, goToNextInstallerStep } from './project/utils/formHelpers';
import { JobSettingsPage } from './project/pages/jobSettingsPage';
import { LoginPage } from './project/pages/loginPage';
import { SEED_JOB_TITLE, SEED_JOB_CATEGORY } from './project/testData/seedData';


async function globalSetup() {
    const browser = await chromium.launch({
        headless: !!process.env.CI,
        slowMo: process.env.CI ? 0 : 300,
      });
      const context = await browser.newContext({ baseURL: 'http://localhost:8080' });
      const page = await context.newPage();

  // 1) 컨테이너가 완전히 응답할 때까지 재시도
  let ready = false;
  for (let i = 0; i < 20; i++) {
    try {
      await page.goto('http://localhost:8080', { timeout: 5000 });
      ready = true;
      break;
    } catch {
      await page.waitForTimeout(3000);
    }
  }
  if (!ready) {
    await browser.close();
    throw new Error('OrangeHRM 컨테이너가 시간 내에 응답하지 않았습니다');
  }

  // 2) 이미 설치되어 있으면(로그인 화면으로 리다이렉트) 설치 단계 스킵
  if (page.url().includes('/auth/login')) {
    console.log('[global-setup] 이미 설치된 상태 - 설치 단계 건너뜀');
    await browser.close();
    return;
  }

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
  try {
    await page.getByPlaceholder('First Name').fill(process.env.ADMIN_FIRST_NAME || 'ahn');
  } catch (e) {
    await page.screenshot({ path: 'installer-failure.png', fullPage: true });
    throw e;
  }
  await page.getByPlaceholder('Last Name').fill(process.env.ADMIN_LAST_NAME || 'intaek');
  await page.getByRole('textbox').nth(2).fill(process.env.ADMIN_EMAIL!);
  await page.getByRole('textbox').nth(4).fill(process.env.ADMIN_ID!);
  await page.getByRole('textbox').nth(5).fill(process.env.ADMIN_PW!);
  await page.locator('input[type="password"]').nth(1).fill(process.env.ADMIN_PW!);
  await goToNextInstallerStep(page);

  // 9) 설치 실행 - 여기서 실제 DB 마이그레이션이 진행되므로 넉넉한 타임아웃 필요
  console.log('[global-setup] DB 마이그레이션 시작 - 시간이 걸릴 수 있습니다');
  await page.getByRole('button', { name: 'Install' }).click();
  await page.getByRole('button', { name: 'Next' }).waitFor({ timeout: 300_000 }); // 최대 2분 대기
  await goToNextInstallerStep(page);

  // 10) 설치 완료
  await page.getByRole('button', { name: 'Launch OrangeHRM' }).click();
  await page.waitForURL('**/auth/login', { timeout: 30_000 });

  console.log('[global-setup] 설치 완료');

  const loginPage = new LoginPage(page);
  const jobSettingsPage = new JobSettingsPage(page);

  await loginPage.goto();
  await loginPage.login(process.env.ADMIN_ID!, process.env.ADMIN_PW!);
  await jobSettingsPage.goto();

  // 1) Job Title 시딩 (기존)
  const jobName = SEED_JOB_TITLE;
  await jobSettingsPage.gotoJobTitles();

  const jobExists = await page.locator('.oxd-table-row')
    .filter({ has: page.locator(`div:text-is("${jobName}")`) })
    .count() > 0;

  if (!jobExists) {
    console.log('Job Title 시드 데이터 생성');
    await jobSettingsPage.addJobDetails({
      jobName: jobName,
      jobDescription: `Job Title Description for ${jobName}`,
      jobNote: `Job Title Note for ${jobName}`,
    });
  } else {
    console.log('Job Title 시드 데이터 이미 존재 - 건너뜀');
  }

  // 2) Job Category 시딩 (신규 추가) - 같은 멱등성 패턴 재사용
  const categoryName = SEED_JOB_CATEGORY;
  await jobSettingsPage.gotoJobCategories();

  const categoryExists = await page.locator('.oxd-table-row')
    .filter({ has: page.locator(`div:text-is("${categoryName}")`) })
    .count() > 0;

  if (!categoryExists) {
    console.log('Job Category 시드 데이터 생성');
    await jobSettingsPage.addJobCategory(categoryName);
  } else {
    console.log('Job Category 시드 데이터 이미 존재 - 건너뜀');
  }

    await browser.close();
  }

export default globalSetup;