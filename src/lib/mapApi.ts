import { apiFetch } from '@/lib/apiClient';
import { buildQuery } from '@/lib/apiQuery';
import type { Person, PersonAddress, PersonMapResponse } from '@/types/api';

export type MapQueryParams = {
  lineage?: 'both' | 'paternal' | 'maternal';
  status?: 'alive' | 'deceased' | 'all';
  city?: string;
  province?: string;
  q?: string;
};

function mapParamsToQuery(params?: MapQueryParams): Record<string, string | undefined> {
  if (!params) return {};
  return {
    lineage: params.lineage && params.lineage !== 'both' ? params.lineage : undefined,
    status: params.status && params.status !== 'all' ? params.status : undefined,
    city: params.city || undefined,
    province: params.province || undefined,
    q: params.q || undefined,
  };
}

export async function fetchPersonMap(
  params?: MapQueryParams,
): Promise<PersonMapResponse> {
  return apiFetch<PersonMapResponse>(
    `/persons/map${buildQuery(mapParamsToQuery(params))}`,
  );
}

export async function patchPersonAddress(
  id: number,
  address: PersonAddress,
): Promise<Person> {
  return apiFetch<Person>(`/persons/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ address }),
  });
}
