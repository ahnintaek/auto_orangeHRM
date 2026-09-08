import { test } from '../fixtures/authedPage.fixture';
import 'dotenv/config';
import { JobSettingsPage } from '../pages/jobSettingsPage';

test('Job Title을 등록하고 수정한다', async ({ authedPage: page }) => {
  const jobSettingsPage = new JobSettingsPage(page);
  const uniqueSuffix = Date.now();

  const jobDetails = {
    jobName: `test_job_${uniqueSuffix}`,
    jobDescription: `desc_${uniqueSuffix}`,
    jobNote: `note_${uniqueSuffix}`,
  };

  await jobSettingsPage.goto();
  await jobSettingsPage.gotoJobTitles();
  await jobSettingsPage.addJobDetails(jobDetails);
  await jobSettingsPage.modifyJobDetails(jobDetails);
  
  await jobSettingsPage.gotoJobCategories();
  await jobSettingsPage.addJobCategory(`test_category_${uniqueSuffix}`);
});