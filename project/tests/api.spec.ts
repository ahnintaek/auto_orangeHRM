import { test, expect } from "../fixtures/authedPage.fixture";
import {
  createJobTitle,
  deleteJobTitleByName,
  deleteJobTitles,
  getJobTitle,
  listJobTitles,
  updateJobTitle,
} from "../api/jobApi";
import { SEED_JOB_TITLE } from "../testData/seedData";
import { uniqueId } from "../utils/unique";

const JOB_TITLES = "/web/index.php/api/v2/admin/job-titles";

test.describe("Job Titles API", () => {
  test("목록을 조회하면 200과 올바른 구조로 응답하고 시드 데이터가 포함된다", async ({
    request,
  }) => {
    const res = await request.get(JOB_TITLES, {
      params: { limit: 100, offset: 0 },
    });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.data.length).toBeGreaterThan(0);
    for (const item of body.data) {
      expect(item).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          title: expect.any(String),
        }),
      );
    }
    expect(body.data.map((job: { title: string }) => job.title)).toContain(
      SEED_JOB_TITLE,
    );
  });

  test("인증 없이 호출시 거절", async ({ playwright, baseURL }) => {
    const anonymous = await playwright.request.newContext({
      baseURL,
      storageState: { cookies: [], origins: [] },
    }); // 쿠키 없는 새 컨텍스트
    const res = await anonymous.get(JOB_TITLES, { maxRedirects: 0 });
    expect(res.status(), `응답: ${res.status()} ${await res.text()}`).toBe(401);
    await anonymous.dispose();
  });

  test("직무를 생성, 조회, 수정, 삭제", async ({ request, apiCleanup }) => {
    const title = `api_job_${uniqueId()}`;
    apiCleanup.add(`job title ${title}`, () =>
      deleteJobTitleByName(request, title),
    );
    let id = 0;

    await test.step("생성하면 id를 가진 항목이 반환", async () => {
      const created = await createJobTitle(request, {
        title,
        description: "desc",
        note: "note",
      });
      expect(created.id).toEqual(expect.any(Number));
      expect(created.title).toBe(title);
      id = created.id;
    });

    await test.step("조회하면 생성한 값과 같음", async () => {
      expect(await getJobTitle(request, id)).toMatchObject({
        id,
        title,
        description: "desc",
        note: "note",
      });
    });

    await test.step("수정하면 변경된 값이 조회됨", async () => {
      await updateJobTitle(request, id, {
        title,
        description: "desc2",
        note: "note2",
      });
      expect(await getJobTitle(request, id)).toMatchObject({
        description: "desc2",
        note: "note2",
      });
    });

    await test.step("삭제하면 목록에서 사라짐", async () => {
      await deleteJobTitles(request, [id]);
      const titles = (await listJobTitles(request)).map((job) => job.title);
      expect(titles).not.toContain(title);
    });
  });

  test("이름 없이 생성하면 거절", async ({ request }) => {
    const res = await request.post(JOB_TITLES, {
      data: { title: "", description: "", specification: null, note: "" },
    });
    expect(res.status(), `응답: ${res.status()} ${await res.text()}`).toBe(422);
    expect((await res.json()).error.data.invalidParamKeys).toContain("title");
  });

  test("같은 이름으로 생성하면 거절되고 한 건만 남는다", async ({
    request,
    apiCleanup,
  }) => {
    const title = `api_dup_${uniqueId()}`;
    apiCleanup.add(`job title ${title}`, () =>
      deleteJobTitleByName(request, title),
    );
    await createJobTitle(request, { title });

    const res = await request.post(JOB_TITLES, {
      data: { title, description: "", specification: null, note: "" },
    });
    expect(res.status(), `응답: ...`).toBe(422);
    expect((await res.json()).error.data.invalidParamKeys).toContain("title");

    const sameName = (await listJobTitles(request)).filter(
      (job) => job.title === title,
    );
    expect(sameName).toHaveLength(1);
  });
});
