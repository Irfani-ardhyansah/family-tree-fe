import { apiFetch } from '@/lib/apiClient';
import { buildQuery } from '@/lib/apiQuery';
import type {
  ApiMemoriamTribute,
  ApiPrayerRecord,
  MemoriamDeceasedListResponse,
  MemoriamDetailResponse,
  MemoriamMyPrayerResponse,
  MemoriamPrayersResponse,
  MemoriamTributeWriteResponse,
  MemoriamTributesResponse,
  TributeWritePayload,
} from '@/types/api';

export type MemoriamListQuery = {
  q?: string;
  deathYear?: string;
};

export async function fetchMemoriamDeceased(
  query: MemoriamListQuery = {},
): Promise<MemoriamDeceasedListResponse> {
  return apiFetch<MemoriamDeceasedListResponse>(
    `/memoriam/deceased${buildQuery({
      q: query.q,
      deathYear: query.deathYear,
    })}`,
  );
}

export async function fetchMemorialDetail(
  deceasedId: number,
): Promise<MemoriamDetailResponse> {
  return apiFetch<MemoriamDetailResponse>(`/memoriam/${deceasedId}`);
}

export async function fetchMemorialTributes(
  deceasedId: number,
): Promise<MemoriamTributesResponse> {
  return apiFetch<MemoriamTributesResponse>(
    `/memoriam/${deceasedId}/tributes`,
  );
}

export async function createMemorialTribute(
  deceasedId: number,
  payload: TributeWritePayload,
): Promise<ApiMemoriamTribute> {
  const data = await apiFetch<MemoriamTributeWriteResponse>(
    `/memoriam/${deceasedId}/tributes`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
  return { ...data.tribute, deceasedId: data.tribute.deceasedId ?? deceasedId };
}

export async function updateMemorialTribute(
  deceasedId: number,
  tributeId: number,
  payload: TributeWritePayload,
): Promise<ApiMemoriamTribute> {
  const data = await apiFetch<MemoriamTributeWriteResponse>(
    `/memoriam/${deceasedId}/tributes/${tributeId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );
  return { ...data.tribute, deceasedId: data.tribute.deceasedId ?? deceasedId };
}

export async function deleteMemorialTribute(
  deceasedId: number,
  tributeId: number,
): Promise<{ deleted: boolean }> {
  return apiFetch<{ deleted: boolean }>(
    `/memoriam/${deceasedId}/tributes/${tributeId}`,
    { method: 'DELETE' },
  );
}

export async function fetchMemorialPrayers(
  deceasedId: number,
): Promise<MemoriamPrayersResponse> {
  return apiFetch<MemoriamPrayersResponse>(
    `/memoriam/${deceasedId}/prayers`,
  );
}

export async function addMemorialPrayer(
  deceasedId: number,
): Promise<ApiPrayerRecord> {
  return apiFetch<ApiPrayerRecord>(`/memoriam/${deceasedId}/prayers`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function fetchMyMemorialPrayer(
  deceasedId: number,
): Promise<MemoriamMyPrayerResponse> {
  return apiFetch<MemoriamMyPrayerResponse>(
    `/memoriam/${deceasedId}/prayers/me`,
  );
}
