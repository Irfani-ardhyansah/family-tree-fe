import { apiFetch } from '@/lib/apiClient';
import { buildQuery } from '@/lib/apiQuery';
import type { DashboardResponse } from '@/types/api';

export type DashboardQuery = {
  recentLimit?: number;
  upcomingLimit?: number;
  memoriamLimit?: number;
};

export async function fetchDashboard(
  query: DashboardQuery = {},
): Promise<DashboardResponse> {
  return apiFetch<DashboardResponse>(
    `/dashboard${buildQuery({
      recentLimit:
        query.recentLimit != null ? String(query.recentLimit) : undefined,
      upcomingLimit:
        query.upcomingLimit != null ? String(query.upcomingLimit) : undefined,
      memoriamLimit:
        query.memoriamLimit != null ? String(query.memoriamLimit) : undefined,
    })}`,
  );
}
