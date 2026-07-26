import { apiBlobFetch, apiFetch, apiFormFetch } from '@/shared/lib/apiClient';
import { buildQuery } from '@/shared/lib/apiQuery';
import type {
  Person,
  PersonListResponse,
  PersonListScope,
  PersonWritePayload,
  TreeFilterParams,
} from '@/shared/types/api';
import type { PersonImportJobResponse } from '@/shared/types/personImport';

export type PersonListResult = Extract<PersonListResponse, { view: 'list' }>;
export type PersonTreeResult = Extract<PersonListResponse, { view: 'tree' }>;

function appendTreeFilter(params: URLSearchParams, filter?: TreeFilterParams) {
  if (!filter) return;
  params.set('lineage', filter.lineage);
  params.set('generationsUp', String(filter.generationsUp));
  params.set('generationsDown', String(filter.generationsDown));
  params.set('showSpouses', String(filter.showSpouses));
  params.set('showSiblings', String(filter.showSiblings));
  params.set('showChildren', String(filter.showChildren));
}

export async function fetchPersonTree(
  filter?: TreeFilterParams,
): Promise<PersonTreeResult> {
  const params = new URLSearchParams({ view: 'tree' });
  appendTreeFilter(params, filter);
  return apiFetch<PersonTreeResult>(`/persons?${params.toString()}`);
}

export type FetchPersonListOptions = {
  /** Omit for BE default (`branch`). Only send when explicitly `family`. */
  scope?: PersonListScope;
  /** Server-side name search. Omit when empty. */
  q?: string;
  /** Server-side gender filter — father picker `male`, mother picker `female`. */
  gender?: 'male' | 'female';
};

export async function fetchPersonList(
  page = 1,
  limit = 20,
  options: FetchPersonListOptions = {},
): Promise<PersonListResult> {
  const q = options.q?.trim();
  return apiFetch<PersonListResult>(
    `/persons${buildQuery({
      page: String(page),
      limit: String(limit),
      scope: options.scope === 'family' ? 'family' : undefined,
      q: q || undefined,
      gender: options.gender,
    })}`,
  );
}

export async function fetchPersonById(id: number): Promise<Person> {
  return apiFetch<Person>(`/persons/${id}`);
}

export async function createPerson(payload: PersonWritePayload): Promise<Person> {
  return apiFetch<Person>('/persons', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updatePerson(
  id: number,
  payload: PersonWritePayload,
): Promise<Person> {
  return apiFetch<Person>(`/persons/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deletePersonById(id: number): Promise<{ deleted: boolean }> {
  return apiFetch<{ deleted: boolean }>(`/persons/${id}`, {
    method: 'DELETE',
  });
}

const POLL_INTERVAL_MS = 1000;

export async function downloadPersonImportTemplateFile(): Promise<void> {
  const { blob, filename } = await apiBlobFetch('/persons/import/template');
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename || 'persons-import-template.csv';
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function enqueuePersonImport(
  file: File,
  dryRun: boolean,
): Promise<PersonImportJobResponse> {
  const form = new FormData();
  form.append('file', file);
  form.append('dryRun', String(dryRun));
  return apiFormFetch<PersonImportJobResponse>(
    `/persons/import${buildQuery({ dryRun: String(dryRun) })}`,
    form,
  );
}

export async function fetchPersonImportJob(
  jobId: string,
): Promise<PersonImportJobResponse> {
  return apiFetch<PersonImportJobResponse>(`/persons/import/jobs/${jobId}`);
}

export async function waitForPersonImportJob(
  jobId: string,
  onProgress: (job: PersonImportJobResponse) => void,
  signal?: AbortSignal,
): Promise<PersonImportJobResponse> {
  for (;;) {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    const job = await fetchPersonImportJob(jobId);
    onProgress(job);

    if (job.status === 'completed' || job.status === 'failed') {
      return job;
    }

    await new Promise<void>((resolve, reject) => {
      if (signal?.aborted) {
        reject(new DOMException('Aborted', 'AbortError'));
        return;
      }

      let timer = 0;
      const onAbort = () => {
        window.clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      };

      timer = window.setTimeout(() => {
        signal?.removeEventListener('abort', onAbort);
        resolve();
      }, POLL_INTERVAL_MS);

      signal?.addEventListener('abort', onAbort, { once: true });
    });
  }
}
