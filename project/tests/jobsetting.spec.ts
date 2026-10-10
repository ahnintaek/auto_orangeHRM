import { test, expect } from '../fixtures/authedPage.fixture';
import { JobSettingsPage } from '../pages/jobSettingsPage';
import { createJobTitle, deleteJobTitleByName, listJobTitles } from '../api/jobApi';
import { uniqueId } from '../utils/unique';

test('Job 을 Setting한다', async ({ authedPage: page, request, apiCleanup }) => {
  const jobSettingsPage = new JobSettingsPage(page);
  const id = uniqueId();

  const jobDetails = {
    jobName: `test_job_${id}`,
    jobDescription: `desc_${id}`,
    jobNote: `note_${id}`,
  };

  // 중간에 실패해도 만든 직무가 남지 않도록 시작 전에 정리를 등록한다.
  apiCleanup.add(`job title ${jobDetails.jobName}`, () => deleteJobTitleByName(request, jobDetails.jobName));

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

  await test.step('Job Category를 등록', async () => {
    await jobSettingsPage.gotoJobCategories();
    await jobSettingsPage.addJobCategory(`test_category_${id}`);
    // TODO: Job Category는 API 요청을 아직 확인하지 않아 정리와 검증이 없다.
  });
});

// 서로 독립적인 검증 케이스는 시나리오와 분리한다.
test.describe('Job Title 등록 검증', () => {
  test('이미 존재하는 Title Name', async ({
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

  test('Title 빈 값', async ({ authedPage: page }) => {
    const jobSettingsPage = new JobSettingsPage(page);
    await jobSettingsPage.goto();
    await jobSettingsPage.gotoJobTitles();
    await jobSettingsPage.submitJobTitle('');

    await expect(jobSettingsPage.jobTitleError()).toHaveText('Required');
  });
});