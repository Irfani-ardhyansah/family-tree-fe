import { apiFetch } from '@/shared/lib/apiClient';
import type { Workplace, WorkplaceFormData } from '../types';

const WORKPLACES_PATH = '/workplaces';

function toList(data: Workplace[] | { items: Workplace[] }): Workplace[] {
  return Array.isArray(data) ? data : (data?.items ?? []);
}

/** Form FE (camelCase) → payload API (snake_case; BE juga terima alias camel). */
function toPayload(data: WorkplaceFormData) {
  return {
    name: data.name.trim(),
    employment_type: data.employmentType,
    role: data.role.trim() || null,
    location: data.location.trim() || null,
    accent: data.accent || null,
    started_at: data.startedAt || null,
    ended_at: data.endedAt || null,
  };
}

export const workplaceApi = {
  async list(): Promise<Workplace[]> {
    const data = await apiFetch<Workplace[] | { items: Workplace[] }>(
      WORKPLACES_PATH,
    );
    return toList(data);
  },

  async create(data: WorkplaceFormData): Promise<Workplace> {
    return apiFetch<Workplace>(WORKPLACES_PATH, {
      method: 'POST',
      body: JSON.stringify(toPayload(data)),
    });
  },

  async update(id: number, data: WorkplaceFormData): Promise<Workplace> {
    return apiFetch<Workplace>(`${WORKPLACES_PATH}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(toPayload(data)),
    });
  },

  async archive(id: number): Promise<Workplace> {
    return apiFetch<Workplace>(`${WORKPLACES_PATH}/${id}/archive`, {
      method: 'PATCH',
    });
  },

  async unarchive(id: number): Promise<Workplace> {
    return apiFetch<Workplace>(`${WORKPLACES_PATH}/${id}/unarchive`, {
      method: 'PATCH',
    });
  },

  async remove(id: number): Promise<void> {
    await apiFetch<{ deleted?: boolean }>(`${WORKPLACES_PATH}/${id}`, {
      method: 'DELETE',
    });
  },
};
