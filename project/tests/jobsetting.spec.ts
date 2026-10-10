import { test } from '../fixtures/authedPage.fixture';
import { JobSettingsPage } from '../pages/jobSettingsPage';

test('Job 을 Setting한다', async ({ authedPage: page }) => {
  const jobSettingsPage = new JobSettingsPage(page);
  const uniqueSuffix = Date.now();

  const jobDetails = {
    jobName: `test_job_${uniqueSuffix}`,
    jobDescription: `desc_${uniqueSuffix}`,
    jobNote: `note_${uniqueSuffix}`,
  };

  await jobSettingsPage.goto();

  await test.step('Job Title을 등록, 수정한다', async () => {
    await jobSettingsPage.gotoJobTitles();
    await jobSettingsPage.addJobDetails(jobDetails);
    await jobSettingsPage.modifyJobDetails(jobDetails);
  });
  
  await test.step('Job Category를 등록한다', async () => {
    await jobSettingsPage.gotoJobCategories();
    await jobSettingsPage.addJobCategory(`test_category_${uniqueSuffix}`);
  });
});