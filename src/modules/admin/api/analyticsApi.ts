import type {
  AnalyticsClickItem,
  AnalyticsEventName,
  AnalyticsGeoItem,
  AnalyticsOutboundBucket,
  AnalyticsOutboundChannel,
  AnalyticsOutbounds,
  AnalyticsOutboundTotals,
  AnalyticsOverview,
  AnalyticsPageItem,
  AnalyticsQuery,
  AnalyticsReferrerItem,
  AnalyticsReferrers,
  AnalyticsSectionItem,
  AnalyticsSessionDetail,
  AnalyticsSessionEvent,
  AnalyticsSessionList,
  AnalyticsSessionListItem,
  AnalyticsTimeseries,
  AnalyticsTimeseriesBucket,
  AnalyticsUtmSourceItem,
} from '@/modules/admin/analyticsTypes';
import { asNumber, asString } from '@/modules/admin/utils/analyticsFormat';
import { apiFetch } from '@/shared/lib/apiClient';
import { buildQuery } from '@/shared/lib/apiQuery';

function queryString(
  query: AnalyticsQuery,
  extra?: Record<string, string | undefined>,
): string {
  return buildQuery({
    from: query.from,
    to: query.to,
    page_id: query.pageId || undefined,
    exclude_bots: query.excludeBots ? 'true' : 'false',
    ...extra,
  });
}

function outboundTotals(raw?: Partial<AnalyticsOutboundTotals> | null): AnalyticsOutboundTotals {
  return {
    email: asNumber(raw?.email),
    whatsapp: asNumber(raw?.whatsapp),
    instagram: asNumber(raw?.instagram),
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function unwrapItems<T>(data: { items?: T[] } | T[] | null | undefined): T[] {
  if (Array.isArray(data)) return data;
  return data?.items ?? [];
}

function normalizeOverview(raw: Partial<AnalyticsOverview>): AnalyticsOverview {
  return {
    from: asString(raw.from),
    to: asString(raw.to),
    timezone: asString(raw.timezone, 'Asia/Jakarta'),
    exclude_bots: Boolean(raw.exclude_bots),
    page_id: raw.page_id === 'home' || raw.page_id === 'work' ? raw.page_id : null,
    unique_visitors: asNumber(raw.unique_visitors),
    sessions: asNumber(raw.sessions),
    pageviews: asNumber(raw.pageviews),
    bounce_rate: asNumber(raw.bounce_rate),
    avg_active_ms: asNumber(raw.avg_active_ms),
    outbounds: outboundTotals(raw.outbounds),
  };
}

function normalizeTimeseriesBucket(
  raw: Partial<AnalyticsTimeseriesBucket>,
): AnalyticsTimeseriesBucket {
  return {
    date: asString(raw.date),
    unique_visitors: asNumber(raw.unique_visitors),
    pageviews: asNumber(raw.pageviews),
    sessions: asNumber(raw.sessions),
  };
}

function normalizeGeoItem(raw: Partial<AnalyticsGeoItem>): AnalyticsGeoItem {
  return {
    country_code: asString(raw.country_code),
    country_name: asString(raw.country_name),
    count: asNumber(raw.count),
    percent: asNumber(raw.percent),
  };
}

function normalizePageItem(raw: Partial<AnalyticsPageItem>): AnalyticsPageItem {
  return {
    page_id: asString(raw.page_id),
    path: asString(raw.path),
    pageviews: asNumber(raw.pageviews),
    unique_visitors: asNumber(raw.unique_visitors),
    avg_active_ms: asNumber(raw.avg_active_ms),
    bounce_rate: asNumber(raw.bounce_rate),
  };
}

function normalizeSectionItem(raw: Partial<AnalyticsSectionItem>): AnalyticsSectionItem {
  return {
    page_id: asString(raw.page_id),
    section_id: asString(raw.section_id),
    views: asNumber(raw.views),
    unique_sessions: asNumber(raw.unique_sessions),
  };
}

function normalizeClickItem(raw: Partial<AnalyticsClickItem>): AnalyticsClickItem {
  return {
    element_id: asString(raw.element_id),
    element_type: asString(raw.element_type),
    label: asString(raw.label),
    count: asNumber(raw.count),
    percent: asNumber(raw.percent),
  };
}

function normalizeOutboundBucket(
  raw: Partial<AnalyticsOutboundBucket>,
): AnalyticsOutboundBucket {
  return {
    date: asString(raw.date),
    ...outboundTotals(raw),
  };
}

function normalizeReferrerItem(raw: Partial<AnalyticsReferrerItem>): AnalyticsReferrerItem {
  return {
    referrer: raw.referrer == null || raw.referrer === '' ? null : asString(raw.referrer),
    count: asNumber(raw.count),
    percent: asNumber(raw.percent),
  };
}

function normalizeUtmItem(raw: Partial<AnalyticsUtmSourceItem>): AnalyticsUtmSourceItem {
  return {
    source: raw.source == null || raw.source === '' ? null : asString(raw.source),
    count: asNumber(raw.count),
    percent: asNumber(raw.percent),
  };
}

function asChannel(value: unknown): AnalyticsOutboundChannel | null {
  return value === 'email' || value === 'whatsapp' || value === 'instagram'
    ? value
    : null;
}

function normalizeSessionItem(
  raw: Partial<AnalyticsSessionListItem>,
): AnalyticsSessionListItem {
  const channels = Array.isArray(raw.outbound_channels)
    ? raw.outbound_channels.map(asChannel).filter((c): c is AnalyticsOutboundChannel => c != null)
    : [];

  return {
    session_id: asString(raw.session_id),
    visitor_id: asString(raw.visitor_id),
    started_at: asString(raw.started_at),
    ended_at: raw.ended_at ? asString(raw.ended_at) : null,
    landing_path: asString(raw.landing_path, '/'),
    exit_path: asString(raw.exit_path, raw.landing_path ?? '/'),
    referrer: raw.referrer == null || raw.referrer === '' ? null : asString(raw.referrer),
    utm_source: raw.utm_source ? asString(raw.utm_source) : null,
    utm_medium: raw.utm_medium ? asString(raw.utm_medium) : null,
    utm_campaign: raw.utm_campaign ? asString(raw.utm_campaign) : null,
    country_code: raw.country_code ? asString(raw.country_code) : null,
    city: raw.city ? asString(raw.city) : null,
    device: raw.device ? asString(raw.device) : null,
    browser: raw.browser ? asString(raw.browser) : null,
    os: raw.os ? asString(raw.os) : null,
    pageview_count: asNumber(raw.pageview_count),
    click_count: asNumber(raw.click_count),
    outbound_count: asNumber(raw.outbound_count),
    outbound_channels: channels,
    max_scroll_percent:
      raw.max_scroll_percent == null ? null : asNumber(raw.max_scroll_percent),
    active_ms: asNumber(raw.active_ms),
    is_bot: Boolean(raw.is_bot),
    incomplete: Boolean(raw.incomplete),
  };
}

function normalizeEvent(raw: Partial<AnalyticsSessionEvent>): AnalyticsSessionEvent {
  return {
    event_id: asString(raw.event_id),
    name: asString(raw.name) as AnalyticsEventName,
    ts: asString(raw.ts),
    page_id: raw.page_id ? asString(raw.page_id) : null,
    path: raw.path ? asString(raw.path) : null,
    props: asRecord(raw.props),
  };
}

export async function fetchAnalyticsOverview(
  query: AnalyticsQuery,
  signal?: AbortSignal,
): Promise<AnalyticsOverview> {
  const data = await apiFetch<Partial<AnalyticsOverview>>(
    `/admin/analytics/overview${queryString(query)}`,
    { signal },
  );
  return normalizeOverview(data);
}

export async function fetchAnalyticsTimeseries(
  query: AnalyticsQuery,
  signal?: AbortSignal,
): Promise<AnalyticsTimeseries> {
  const data = await apiFetch<Partial<AnalyticsTimeseries>>(
    `/admin/analytics/timeseries${queryString(query)}`,
    { signal },
  );
  return {
    from: asString(data.from, query.from),
    to: asString(data.to, query.to),
    buckets: (data.buckets ?? []).map(normalizeTimeseriesBucket),
  };
}

export async function fetchAnalyticsGeo(
  query: AnalyticsQuery,
  signal?: AbortSignal,
): Promise<AnalyticsGeoItem[]> {
  const data = await apiFetch<{ items?: Partial<AnalyticsGeoItem>[] } | Partial<AnalyticsGeoItem>[]>(
    `/admin/analytics/geo${queryString(query)}`,
    { signal },
  );
  return unwrapItems(data).map(normalizeGeoItem).slice(0, 20);
}

export async function fetchAnalyticsPages(
  query: AnalyticsQuery,
  signal?: AbortSignal,
): Promise<AnalyticsPageItem[]> {
  const data = await apiFetch<{ items?: Partial<AnalyticsPageItem>[] } | Partial<AnalyticsPageItem>[]>(
    `/admin/analytics/pages${queryString(query)}`,
    { signal },
  );
  return unwrapItems(data).map(normalizePageItem);
}

export async function fetchAnalyticsSections(
  query: AnalyticsQuery,
  signal?: AbortSignal,
): Promise<AnalyticsSectionItem[]> {
  const data = await apiFetch<
    { items?: Partial<AnalyticsSectionItem>[] } | Partial<AnalyticsSectionItem>[]
  >(`/admin/analytics/sections${queryString(query)}`, { signal });
  return unwrapItems(data).map(normalizeSectionItem);
}

export async function fetchAnalyticsClicks(
  query: AnalyticsQuery,
  signal?: AbortSignal,
): Promise<AnalyticsClickItem[]> {
  const data = await apiFetch<
    { items?: Partial<AnalyticsClickItem>[] } | Partial<AnalyticsClickItem>[]
  >(`/admin/analytics/clicks${queryString(query)}`, { signal });
  return unwrapItems(data).map(normalizeClickItem).slice(0, 50);
}

export async function fetchAnalyticsOutbounds(
  query: AnalyticsQuery,
  signal?: AbortSignal,
): Promise<AnalyticsOutbounds> {
  const data = await apiFetch<Partial<AnalyticsOutbounds>>(
    `/admin/analytics/outbounds${queryString(query)}`,
    { signal },
  );
  return {
    totals: outboundTotals(data.totals),
    buckets: (data.buckets ?? []).map(normalizeOutboundBucket),
  };
}

export async function fetchAnalyticsReferrers(
  query: AnalyticsQuery,
  signal?: AbortSignal,
): Promise<AnalyticsReferrers> {
  const data = await apiFetch<Partial<AnalyticsReferrers>>(
    `/admin/analytics/referrers${queryString(query)}`,
    { signal },
  );
  return {
    referrers: (data.referrers ?? []).map(normalizeReferrerItem),
    utm_sources: (data.utm_sources ?? []).map(normalizeUtmItem),
  };
}

export async function fetchAnalyticsSessions(
  query: AnalyticsQuery,
  page = 1,
  pageSize = 20,
  signal?: AbortSignal,
): Promise<AnalyticsSessionList> {
  const data = await apiFetch<Partial<AnalyticsSessionList>>(
    `/admin/analytics/sessions${queryString(query, {
      page: String(page),
      pageSize: String(pageSize),
    })}`,
    { signal },
  );
  const items = (data.items ?? []).map(normalizeSessionItem);
  return {
    items,
    page: asNumber(data.page, page),
    pageSize: asNumber(data.pageSize, pageSize),
    total: asNumber(data.total, items.length),
  };
}

export async function fetchAnalyticsSessionDetail(
  sessionId: string,
  signal?: AbortSignal,
): Promise<AnalyticsSessionDetail> {
  const data = await apiFetch<{
    session?: Partial<AnalyticsSessionListItem>;
    events?: Partial<AnalyticsSessionEvent>[];
  }>(`/admin/analytics/sessions/${encodeURIComponent(sessionId)}`, { signal });

  return {
    session: normalizeSessionItem(data.session ?? { session_id: sessionId }),
    events: (data.events ?? []).map(normalizeEvent),
  };
}
