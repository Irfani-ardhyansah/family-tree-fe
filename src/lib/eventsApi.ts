import { apiFetch } from '@/lib/apiClient';
import type {
  ApiEvent,
  ContributionWritePayload,
  EventDetailResponse,
  EventListResponse,
  EventWritePayload,
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

export async function fetchEvents(
  focusPersonId: number,
  query: EventListQuery = {},
): Promise<EventListResponse> {
  const extra: Record<string, string> = {};
  if (query.type) extra.type = query.type;
  if (query.year) extra.year = query.year;
  if (query.month) extra.month = query.month;
  if (query.dateFrom) extra.dateFrom = query.dateFrom;
  if (query.dateTo) extra.dateTo = query.dateTo;
  if (query.q) extra.q = query.q;
  if (query.page != null) extra.page = String(query.page);
  if (query.limit != null) extra.limit = String(query.limit);

  const qs = withFocus(focusPersonId, extra);
  return apiFetch<EventListResponse>(`/events?${qs}`);
}

export async function fetchEventById(
  id: number,
  focusPersonId: number,
): Promise<ApiEvent> {
  const qs = withFocus(focusPersonId);
  const data = await apiFetch<EventDetailResponse>(`/events/${id}?${qs}`);
  return data.event;
}

export async function createEvent(
  focusPersonId: number,
  payload: EventWritePayload,
): Promise<ApiEvent> {
  const qs = withFocus(focusPersonId);
  return apiFetch<ApiEvent>(`/events?${qs}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateEventById(
  id: number,
  focusPersonId: number,
  payload: EventWritePayload,
): Promise<ApiEvent> {
  const qs = withFocus(focusPersonId);
  return apiFetch<ApiEvent>(`/events/${id}?${qs}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteEventById(
  id: number,
  focusPersonId: number,
): Promise<{ deleted: boolean }> {
  const qs = withFocus(focusPersonId);
  return apiFetch<{ deleted: boolean }>(`/events/${id}?${qs}`, {
    method: 'DELETE',
  });
}

export async function addEventContribution(
  eventId: number,
  focusPersonId: number,
  payload: ContributionWritePayload,
): Promise<ApiEvent> {
  const qs = withFocus(focusPersonId);
  const data = await apiFetch<EventDetailResponse>(
    `/events/${eventId}/contributions?${qs}`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
  return data.event;
}
