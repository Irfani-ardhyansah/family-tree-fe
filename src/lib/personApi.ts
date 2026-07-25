import { apiFetch } from '@/lib/apiClient';
import { buildQuery } from '@/lib/apiQuery';
import type {
  Person,
  PersonListResponse,
  PersonWritePayload,
  TreeFilterParams,
} from '@/types/api';

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

export async function fetchPersonList(
  page = 1,
  limit = 20,
): Promise<PersonListResult> {
  return apiFetch<PersonListResult>(
    `/persons${buildQuery({ page: String(page), limit: String(limit) })}`,
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
