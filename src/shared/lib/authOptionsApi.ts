import { apiFetch } from '@/shared/lib/apiClient';
import type { PersonOptionsResponse } from '@/shared/types/api';

export async function patchMeOption(
  setting: string,
  value: string,
): Promise<PersonOptionsResponse> {
  return apiFetch<PersonOptionsResponse>('/auth/me/options', {
    method: 'PATCH',
    body: JSON.stringify({ setting, value }),
  });
}

export async function fetchMeOptions(): Promise<PersonOptionsResponse> {
  return apiFetch<PersonOptionsResponse>('/auth/me/options');
}
