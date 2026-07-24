import { apiFetch } from '@/lib/apiClient';
import type { Person, PersonAddress, PersonMapResponse } from '@/types/api';

export type MapQueryParams = {
  lineage?: 'both' | 'paternal' | 'maternal';
  status?: 'alive' | 'deceased' | 'all';
  city?: string;
  province?: string;
  q?: string;
};

function buildMapQuery(focusPersonId: number, params?: MapQueryParams): string {
  const search = new URLSearchParams({
    focusPersonId: String(focusPersonId),
  });

  if (params?.lineage && params.lineage !== 'both') {
    search.set('lineage', params.lineage);
  }
  if (params?.status && params.status !== 'all') {
    search.set('status', params.status);
  }
  if (params?.city) search.set('city', params.city);
  if (params?.province) search.set('province', params.province);
  if (params?.q) search.set('q', params.q);

  return search.toString();
}

export async function fetchPersonMap(
  focusPersonId: number,
  params?: MapQueryParams,
): Promise<PersonMapResponse> {
  const qs = buildMapQuery(focusPersonId, params);
  return apiFetch<PersonMapResponse>(`/persons/map?${qs}`);
}

export async function patchPersonAddress(
  id: number,
  focusPersonId: number,
  address: PersonAddress,
): Promise<Person> {
  const qs = new URLSearchParams({ focusPersonId: String(focusPersonId) });
  return apiFetch<Person>(`/persons/${id}?${qs.toString()}`, {
    method: 'PATCH',
    body: JSON.stringify({ address }),
  });
}
