import { test, expect } from "../fixtures/authedPage.fixture";
import { JobSettingsPage } from "../pages/jobSettingsPage";
import {
  createJobTitle,
  deleteJobCategoryByName,
  deleteJobTitleByName,
} from "../api/jobApi";
import { uniqueId } from "../utils/unique";

test("Job 을 Setting한다", async ({
  authedPage: page,
  request,
  apiCleanup,
}) => {
  const jobSettingsPage = new JobSettingsPage(page);
  const id = uniqueId();

  const jobDetails = {
    jobName: `test_job_${id}`,
    jobDescription: `desc_${id}`,
    jobNote: `note_${id}`,
  };

  // 중간에 실패해도 만든 직무가 남지 않도록 시작 전에 정리를 등록한다.
  apiCleanup.add(`job title ${jobDetails.jobName}`, () =>
    deleteJobTitleByName(request, jobDetails.jobName),
  );

  const categoryName = `test_category_${id}`;
  apiCleanup.add(`job category ${categoryName}`, () =>
    deleteJobCategoryByName(request, categoryName),
  );

  await jobSettingsPage.goto();

  await test.step("Job Title을 등록, 수정한다", async () => {
    await jobSettingsPage.gotoJobTitles();
    await jobSettingsPage.addJobDetails(jobDetails);
    await jobSettingsPage.modifyJobDetails(jobDetails);
  });

  await test.step("수정한 내용이 저장되었는지 수정 화면을 다시 열어 확인한다", async () => {
    await jobSettingsPage.expectJobDetails(jobDetails);
  });

  await test.step("Job Category를 등록한다", async () => {
    await jobSettingsPage.gotoJobCategories();
    await jobSettingsPage.addJobCategory(categoryName);
    await jobSettingsPage.expectJobCategoryListed(categoryName);
  });
});

test.describe("Job Title 등록 검증", () => {
  test("이미 있는 이름으로 등록하면 Already exists 오류가 표시된다", async ({
    authedPage: page,
    request,
    apiCleanup,
  }) => {
    const name = `dup_job_${uniqueId()}`;
    apiCleanup.add(`job title ${name}`, () =>
      deleteJobTitleByName(request, name),
    );
    await createJobTitle(request, { title: name });

    const jobSettingsPage = new JobSettingsPage(page);
    await jobSettingsPage.goto();
    await jobSettingsPage.gotoJobTitles();
    await jobSettingsPage.submitJobTitle(name);

    await expect(jobSettingsPage.jobTitleError()).toHaveText("Already exists");
  });

  test("이름을 비우고 저장하면 Required 오류가 표시된다", async ({
    authedPage: page,
  }) => {
    const jobSettingsPage = new JobSettingsPage(page);
    await jobSettingsPage.goto();
    await jobSettingsPage.gotoJobTitles();
    await jobSettingsPage.submitJobTitle("");

    await expect(jobSettingsPage.jobTitleError()).toHaveText("Required");
  });
});
