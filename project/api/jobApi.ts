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

export async function deleteJobTitles(request: APIRequestContext, ids: number[]) {
  if (ids.length === 0) return;
  const res = await request.delete(JOB_TITLES, { data: { ids } });
  await ensureOk(res, '직무 삭제');
}

export async function deleteJobTitleByName(request: APIRequestContext, title: string) {
  const ids = (await listJobTitles(request))
    .filter((job) => job.title === title)
    .map((job) => job.id);
  await deleteJobTitles(request, ids);
}

const JOB_CATEGORIES = '/web/index.php/api/v2/admin/job-categories';

export interface JobCategory {
  id: number;
  name: string;
}

export async function listJobCategories(request: APIRequestContext): Promise<JobCategory[]> {
  const res = await request.get(JOB_CATEGORIES, { params: { limit: 100, offset: 0 } });
  await ensureOk(res, '직무 분류 목록 조회');
  return (await res.json()).data;
}

export async function createJobCategory(
  request: APIRequestContext,
  name: string,
): Promise<JobCategory> {
  const res = await request.post(JOB_CATEGORIES, { data: { name } });
  await ensureOk(res, '직무 분류 생성');
  return (await res.json()).data;
}

export async function deleteJobCategories(request: APIRequestContext, ids: number[]) {
  if (ids.length === 0) return;
  const res = await request.delete(JOB_CATEGORIES, { data: { ids } });
  await ensureOk(res, '직무 분류 삭제');
}

export async function deleteJobCategoryByName(request: APIRequestContext, name: string) {
  const ids = (await listJobCategories(request))
    .filter((category) => category.name === name)
    .map((category) => category.id);
  await deleteJobCategories(request, ids);
}