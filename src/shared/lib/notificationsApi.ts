import { apiFetch, ApiClientError } from '@/shared/lib/apiClient';
import { buildQuery } from '@/shared/lib/apiQuery';
import type {
  AppNotification,
  NotificationListResult,
} from '@/shared/types/notification';

type ListData = {
  items?: AppNotification[];
  page?: number;
  pageSize?: number;
  total?: number;
  unreadCount?: number;
  pagination?: {
    page?: number;
    pageSize?: number;
    limit?: number;
    total?: number;
  };
};

function asId(value: unknown): string {
  return value == null ? '' : String(value);
}

function normalizeItem(raw: AppNotification): AppNotification {
  return {
    id: asId(raw.id),
    title: raw.title ?? '',
    body: raw.body ?? '',
    type: raw.type ?? 'broadcast',
    broadcastId:
      raw.broadcastId == null ? null : asId(raw.broadcastId),
    isRead: Boolean(raw.isRead),
    readAt: raw.readAt ?? null,
    createdAt: raw.createdAt,
  };
}

function normalizeList(
  data: ListData,
  page: number,
  pageSize: number,
): NotificationListResult {
  const items = (data.items ?? []).map(normalizeItem);
  return {
    items,
    page: data.page ?? data.pagination?.page ?? page,
    pageSize:
      data.pageSize ??
      data.pagination?.pageSize ??
      data.pagination?.limit ??
      pageSize,
    total: data.total ?? data.pagination?.total ?? items.length,
    unreadCount: data.unreadCount ?? items.filter((i) => !i.isRead).length,
  };
}

export function isNotificationsApiMissing(error: unknown): boolean {
  return (
    error instanceof ApiClientError &&
    (error.code === 'NOT_FOUND' ||
      error.message.toLowerCase().includes('not found'))
  );
}

export async function fetchNotifications(options?: {
  page?: number;
  pageSize?: number;
  unreadOnly?: boolean;
}): Promise<NotificationListResult> {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 20;
  const data = await apiFetch<ListData>(
    `/notifications${buildQuery({
      page: String(page),
      pageSize: String(pageSize),
      unreadOnly: options?.unreadOnly ? 'true' : undefined,
    })}`,
  );
  return normalizeList(data, page, pageSize);
}

export async function fetchUnreadNotificationCount(): Promise<number> {
  try {
    const data = await apiFetch<{ unreadCount?: number }>(
      '/notifications/unread-count',
    );
    return data.unreadCount ?? 0;
  } catch (error) {
    if (isNotificationsApiMissing(error)) return 0;
    throw error;
  }
}

export async function markNotificationRead(
  id: string,
): Promise<AppNotification> {
  const data = await apiFetch<AppNotification>(
    `/notifications/${id}/read`,
    { method: 'PATCH' },
  );
  return normalizeItem(data);
}

export async function markAllNotificationsRead(): Promise<number> {
  const data = await apiFetch<{ updated?: number }>(
    '/notifications/read-all',
    { method: 'POST' },
  );
  return data.updated ?? 0;
}
