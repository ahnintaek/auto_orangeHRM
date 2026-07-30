import { test } from '@playwright/test';
import 'dotenv/config';
import { LoginPage } from '../pages/loginPage';
import { JobSettingsPage } from '../pages/jobSettingsPage';

test('Job Title을 등록하고 수정한다', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const jobSettingsPage = new JobSettingsPage(page);
  const uniqueSuffix = Date.now();

  const jobDetails = {
    jobName: `test_job_${uniqueSuffix}`,
    jobDescription: `desc_${uniqueSuffix}`,
    jobNote: `note_${uniqueSuffix}`,
  };

  await loginPage.loginAsAdmin();
  await jobSettingsPage.goto();
  await jobSettingsPage.gotoJobTitles();
  await jobSettingsPage.addJobDetails(jobDetails);
  await jobSettingsPage.modifyJobDetails(jobDetails);
  
  await jobSettingsPage.gotoJobCategories();
  await jobSettingsPage.addJobCategory(`test_category_${uniqueSuffix}`);
});