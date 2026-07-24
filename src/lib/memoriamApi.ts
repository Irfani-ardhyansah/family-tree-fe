import { apiFetch } from '@/lib/apiClient';
import type {
  ApiMemoriamTribute,
  ApiPrayerRecord,
  MemoriamDeceasedListResponse,
  MemoriamDetailResponse,
  MemoriamMyPrayerResponse,
  MemoriamPrayersResponse,
  MemoriamTributesResponse,
  TributeWritePayload,
} from '@/types/api';

function withFocus(focusPersonId: number, extra?: Record<string, string>): string {
  const params = new URLSearchParams({ focusPersonId: String(focusPersonId) });
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      if (value !== '') params.set(key, value);
    }
  }
  return params.toString();
}

export type MemoriamListQuery = {
  q?: string;
  deathYear?: string;
};

export async function fetchMemoriamDeceased(
  focusPersonId: number,
  query: MemoriamListQuery = {},
): Promise<MemoriamDeceasedListResponse> {
  const extra: Record<string, string> = {};
  if (query.q) extra.q = query.q;
  if (query.deathYear) extra.deathYear = query.deathYear;

  const qs = withFocus(focusPersonId, extra);
  return apiFetch<MemoriamDeceasedListResponse>(`/memoriam/deceased?${qs}`);
}

export async function fetchMemorialDetail(
  deceasedId: number,
  focusPersonId: number,
): Promise<MemoriamDetailResponse> {
  const qs = withFocus(focusPersonId);
  return apiFetch<MemoriamDetailResponse>(`/memoriam/${deceasedId}?${qs}`);
}

export async function fetchMemorialTributes(
  deceasedId: number,
  focusPersonId: number,
): Promise<MemoriamTributesResponse> {
  const qs = withFocus(focusPersonId);
  return apiFetch<MemoriamTributesResponse>(
    `/memoriam/${deceasedId}/tributes?${qs}`,
  );
}

export async function createMemorialTribute(
  deceasedId: number,
  focusPersonId: number,
  payload: TributeWritePayload,
): Promise<ApiMemoriamTribute> {
  const qs = withFocus(focusPersonId);
  return apiFetch<ApiMemoriamTribute>(
    `/memoriam/${deceasedId}/tributes?${qs}`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

export async function fetchMemorialPrayers(
  deceasedId: number,
  focusPersonId: number,
): Promise<MemoriamPrayersResponse> {
  const qs = withFocus(focusPersonId);
  return apiFetch<MemoriamPrayersResponse>(
    `/memoriam/${deceasedId}/prayers?${qs}`,
  );
}

export async function addMemorialPrayer(
  deceasedId: number,
  focusPersonId: number,
): Promise<ApiPrayerRecord> {
  const qs = withFocus(focusPersonId);
  return apiFetch<ApiPrayerRecord>(`/memoriam/${deceasedId}/prayers?${qs}`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function fetchMyMemorialPrayer(
  deceasedId: number,
  focusPersonId: number,
): Promise<MemoriamMyPrayerResponse> {
  const qs = withFocus(focusPersonId);
  return apiFetch<MemoriamMyPrayerResponse>(
    `/memoriam/${deceasedId}/prayers/me?${qs}`,
  );
}
