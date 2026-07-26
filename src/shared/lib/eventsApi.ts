import { apiFetch } from '@/shared/lib/apiClient';
import { buildQuery } from '@/shared/lib/apiQuery';
import type {
  ApiEvent,
  ContributionWritePayload,
  EventDetailResponse,
  EventListResponse,
  EventWritePayload,
  EventWriteResponse,
} from '@/shared/types/api';

export type EventListQuery = {
  type?: string;
  year?: string;
  month?: string;
  dateFrom?: string;
  dateTo?: string;
  q?: string;
  page?: number;
  limit?: number;
  /** Mode kalender: wajib dateFrom+dateTo, abaikan page/limit, payload ringan */
  view?: 'calendar';
};

function eventQueryToParams(query: EventListQuery): Record<string, string | undefined> {
  const isCalendar = query.view === 'calendar';
  return {
    type: query.type,
    year: isCalendar ? undefined : query.year,
    month: isCalendar ? undefined : query.month,
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
    q: query.q,
    page: isCalendar || query.page == null ? undefined : String(query.page),
    limit: isCalendar || query.limit == null ? undefined : String(query.limit),
    view: query.view,
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
