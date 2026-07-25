import { apiFetch } from '@/lib/apiClient';
import { buildQuery } from '@/lib/apiQuery';
import type {
  ApiEvent,
  ContributionWritePayload,
  EventDetailResponse,
  EventListResponse,
  EventWritePayload,
  EventWriteResponse,
} from '@/types/api';

export type EventListQuery = {
  type?: string;
  year?: string;
  month?: string;
  dateFrom?: string;
  dateTo?: string;
  q?: string;
  page?: number;
  limit?: number;
};

function eventQueryToParams(query: EventListQuery): Record<string, string | undefined> {
  return {
    type: query.type,
    year: query.year,
    month: query.month,
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
    q: query.q,
    page: query.page != null ? String(query.page) : undefined,
    limit: query.limit != null ? String(query.limit) : undefined,
  };
}

export async function fetchEvents(
  query: EventListQuery = {},
): Promise<EventListResponse> {
  return apiFetch<EventListResponse>(
    `/events${buildQuery(eventQueryToParams(query))}`,
  );
}

export async function fetchEventById(id: number): Promise<ApiEvent> {
  const data = await apiFetch<EventDetailResponse>(`/events/${id}`);
  return data.event;
}

export async function createEvent(payload: EventWritePayload): Promise<ApiEvent> {
  const data = await apiFetch<EventWriteResponse>('/events', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.event;
}

export async function updateEventById(
  id: number,
  payload: EventWritePayload,
): Promise<ApiEvent> {
  const data = await apiFetch<EventWriteResponse>(`/events/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return data.event;
}

export async function deleteEventById(id: number): Promise<{ deleted: boolean }> {
  return apiFetch<{ deleted: boolean }>(`/events/${id}`, {
    method: 'DELETE',
  });
}

export async function addEventContribution(
  eventId: number,
  payload: ContributionWritePayload,
): Promise<ApiEvent> {
  const data = await apiFetch<EventDetailResponse>(
    `/events/${eventId}/contributions`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
  return data.event;
}
