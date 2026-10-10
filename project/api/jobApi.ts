import { APIRequestContext, APIResponse } from '@playwright/test';

const JOB_TITLES = '/web/index.php/api/v2/admin/job-titles';

export interface JobTitle {
  id: number;
  title: string;
  description: string | null;
  note: string | null;
}

interface JobTitleInput {
  title: string;
  description?: string;
  note?: string;
}

// 실패하면 상태 코드와 응답 본문을 에러 메시지에 담아, 원인을 바로 알 수 있게 한다.
async function ensureOk(res: APIResponse, action: string) {
  if (!res.ok()) {
    throw new Error(`${action} 실패: ${res.status()} ${await res.text()}`);
  }
}

export async function listJobTitles(request: APIRequestContext): Promise<JobTitle[]> {
  const res = await request.get(JOB_TITLES, {
    params: { limit: 100, offset: 0, sortField: 'jt.jobTitleName', sortOrder: 'ASC' },
  });
  await ensureOk(res, '직무 목록 조회');
  return (await res.json()).data;
}

export async function getJobTitle(request: APIRequestContext, id: number): Promise<JobTitle> {
  const res = await request.get(`${JOB_TITLES}/${id}`);
  await ensureOk(res, `직무 조회(id=${id})`);
  return (await res.json()).data;
}

// 확인됨(실행 통과): 파일 첨부가 없을 때 specification을 null로 보내는 본문을 서버가 받아들인다.
// (화면이 보내는 Payload와 글자 단위로 같은지는 대조하지 않았다.)
export async function createJobTitle(
  request: APIRequestContext,
  input: JobTitleInput,
): Promise<JobTitle> {
  const res = await request.post(JOB_TITLES, {
    data: {
      title: input.title,
      description: input.description ?? '',
      specification: null,
      note: input.note ?? '',
    },
  });
  await ensureOk(res, '직무 생성');
  return (await res.json()).data;
}

// 확인됨(UI 캡처): 수정(PUT) 본문은 title, description, note 세 필드뿐이다. 비어 있으면 null로 보낸다.
// specification과 currentAttachment를 넣으면 422로 거절될 수 있다. (currentAttachment는 거절 확인됨)
export async function updateJobTitle(
  request: APIRequestContext,
  id: number,
  input: JobTitleInput,
): Promise<JobTitle> {
  const res = await request.put(`${JOB_TITLES}/${id}`, {
    data: {
      title: input.title,
      description: input.description ?? null,
      note: input.note ?? null,
    },
  });
  await ensureOk(res, `직무 수정(id=${id})`);
  return (await res.json()).data;
}

// 확인됨(실행 통과): 삭제는 URL에 id가 없고, 본문으로 id 목록({ ids: [...] })을 보낸다.
export async function deleteJobTitles(request: APIRequestContext, ids: number[]) {
  if (ids.length === 0) return;
  const res = await request.delete(JOB_TITLES, { data: { ids } });
  await ensureOk(res, '직무 삭제');
}

// 정리용: 이름이 정확히 일치하는 직무를 찾아 삭제한다. 없으면 아무것도 하지 않는다(멱등).
// 목록은 최대 100개까지만 조회하므로, 그 이상 쌓인 로컬 DB에서는 못 찾을 수 있다.
export async function deleteJobTitleByName(request: APIRequestContext, title: string) {
  const ids = (await listJobTitles(request))
    .filter((job) => job.title === title)
    .map((job) => job.id);
  await deleteJobTitles(request, ids);
}