import { test, expect } from '../fixtures/authedPage.fixture';
import { JobSettingsPage } from '../pages/jobSettingsPage';
import {
  createJobTitle,
  deleteJobCategoryByName,
  deleteJobTitleByName,
  listJobCategories,
  listJobTitles,
} from '../api/jobApi';
import { uniqueId } from '../utils/unique';

test('Job 을 Setting한다', async ({ authedPage: page, request, apiCleanup }) => {
  const jobSettingsPage = new JobSettingsPage(page);
  const id = uniqueId();

  const jobDetails = {
    jobName: `test_job_${id}`,
    jobDescription: `desc_${id}`,
    jobNote: `note_${id}`,
  };

  apiCleanup.add(`job title ${jobDetails.jobName}`, () => 
    deleteJobTitleByName(request, jobDetails.jobName)
  );

  const categoryName = `test_category_${id}`;
  apiCleanup.add(`job category ${categoryName}`, () =>
    deleteJobCategoryByName(request, categoryName),
  );

  await jobSettingsPage.goto();

  await test.step('Job Title을 등록, 수정', async () => {
    await jobSettingsPage.gotoJobTitles();
    await jobSettingsPage.addJobDetails(jobDetails);
    await jobSettingsPage.modifyJobDetails(jobDetails);
  });

  await test.step('수정한 내용이 서버에 저장되었는지 API로 확인', async () => {
    const saved = (await listJobTitles(request)).find((job) => job.title === jobDetails.jobName);
    expect(saved).toMatchObject({
      description: jobDetails.jobDescription,
      note: jobDetails.jobNote,
    });
  });

  await test.step('Job Category 등록', async () => {
    await jobSettingsPage.gotoJobCategories();
    await jobSettingsPage.addJobCategory(categoryName);
 
    // 화면에서 등록한 분류가 서버에 실제로 저장됐는지 API로 확인한다.
    const names = (await listJobCategories(request)).map((category) => category.name);
    expect(names).toContain(categoryName);
  });
});

// 서로 독립적인 검증 케이스는 시나리오와 분리한다.
test.describe('Job Title 등록 검증', () => {
  test('이미 있는 이름으로 등록하면 Already exists 오류가 표시된다', async ({
    authedPage: page,
    request,
    apiCleanup,
  }) => {
    const name = `dup_job_${uniqueId()}`;
    apiCleanup.add(`job title ${name}`, () => deleteJobTitleByName(request, name));
    await createJobTitle(request, { title: name }); // 사전조건은 API로 빠르게 만든다
 
    const jobSettingsPage = new JobSettingsPage(page);
    await jobSettingsPage.goto();
    await jobSettingsPage.gotoJobTitles();
    await jobSettingsPage.submitJobTitle(name);
 
    await expect(jobSettingsPage.jobTitleError()).toHaveText('Already exists');
  });
 
  test('이름을 비우고 저장하면 Required 오류가 표시된다', async ({ authedPage: page }) => {
    const jobSettingsPage = new JobSettingsPage(page);
    await jobSettingsPage.goto();
    await jobSettingsPage.gotoJobTitles();
    await jobSettingsPage.submitJobTitle('');
 
    await expect(jobSettingsPage.jobTitleError()).toHaveText('Required');
  });
});