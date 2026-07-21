import { apiFetch } from '@/lib/apiClient';
import type {
  Person,
  PersonListResponse,
  PersonWritePayload,
  TreeFilterParams,
} from '@/types/api';

function withFocus(focusPersonId: number, query = ''): string {
  const params = new URLSearchParams({ focusPersonId: String(focusPersonId) });
  const extra = query.startsWith('?') ? query.slice(1) : query;
  if (extra) {
    for (const part of extra.split('&')) {
      const [key, value] = part.split('=');
      if (key && value != null) params.set(key, value);
    }
  }
  return params.toString();
}

export type PersonListResult = Extract<PersonListResponse, { view: 'list' }>;
export type PersonTreeResult = Extract<PersonListResponse, { view: 'tree' }>;

function appendTreeFilter(params: URLSearchParams, filter?: TreeFilterParams) {
  if (!filter) return;
  params.set('lineage', filter.lineage);
  params.set('generationsUp', String(filter.generationsUp));
  params.set('showSpouses', String(filter.showSpouses));
  params.set('showSiblings', String(filter.showSiblings));
  params.set('showChildren', String(filter.showChildren));
}

export async function fetchPersonTree(
  focusPersonId: number,
  filter?: TreeFilterParams,
): Promise<PersonTreeResult> {
  const params = new URLSearchParams({
    focusPersonId: String(focusPersonId),
    view: 'tree',
  });
  appendTreeFilter(params, filter);
  return apiFetch<PersonTreeResult>(`/persons?${params.toString()}`);
}

export async function fetchPersonList(
  focusPersonId: number,
  page = 1,
  limit = 20,
): Promise<PersonListResult> {
  const qs = withFocus(focusPersonId, `page=${page}&limit=${limit}`);
  return apiFetch<PersonListResult>(`/persons?${qs}`);
}

export async function fetchPersonById(
  id: number,
  focusPersonId: number,
): Promise<Person> {
  const qs = withFocus(focusPersonId);
  return apiFetch<Person>(`/persons/${id}?${qs}`);
}

export async function createPerson(
  focusPersonId: number,
  payload: PersonWritePayload,
): Promise<Person> {
  const qs = withFocus(focusPersonId);
  return apiFetch<Person>(`/persons?${qs}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updatePerson(
  id: number,
  focusPersonId: number,
  payload: PersonWritePayload,
): Promise<Person> {
  const qs = withFocus(focusPersonId);
  return apiFetch<Person>(`/persons/${id}?${qs}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deletePersonById(
  id: number,
  focusPersonId: number,
): Promise<{ deleted: boolean }> {
  const qs = withFocus(focusPersonId);
  return apiFetch<{ deleted: boolean }>(`/persons/${id}?${qs}`, {
    method: 'DELETE',
  });
}
