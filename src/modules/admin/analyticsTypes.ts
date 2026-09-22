export type AnalyticsPageId = 'home' | 'work';

export type AnalyticsOutboundChannel = 'email' | 'whatsapp' | 'instagram';

export type AnalyticsQuery = {
  from: string;
  to: string;
  pageId: AnalyticsPageId | '';
  excludeBots: boolean;
};

export type AnalyticsOverview = {
  from: string;
  to: string;
  timezone: string;
  exclude_bots: boolean;
  page_id: AnalyticsPageId | null;
  unique_visitors: number;
  sessions: number;
  pageviews: number;
  bounce_rate: number;
  avg_active_ms: number;
  outbounds: Record<AnalyticsOutboundChannel, number>;
};

export type AnalyticsTimeseriesBucket = {
  date: string;
  unique_visitors: number;
  pageviews: number;
  sessions: number;
};

export type AnalyticsTimeseries = {
  from: string;
  to: string;
  buckets: AnalyticsTimeseriesBucket[];
};

export type AnalyticsGeoItem = {
  country_code: string;
  country_name: string;
  count: number;
  percent: number;
};

export type AnalyticsPageItem = {
  page_id: string;
  path: string;
  pageviews: number;
  unique_visitors: number;
  avg_active_ms: number;
  bounce_rate: number;
};

export type AnalyticsSectionItem = {
  page_id: string;
  section_id: string;
  views: number;
  unique_sessions: number;
};

export type AnalyticsClickItem = {
  element_id: string;
  element_type: string;
  label: string;
  count: number;
  percent: number;
};

export type AnalyticsOutboundTotals = Record<AnalyticsOutboundChannel, number>;

export type AnalyticsOutboundBucket = {
  date: string;
} & AnalyticsOutboundTotals;

export type AnalyticsOutbounds = {
  totals: AnalyticsOutboundTotals;
  buckets: AnalyticsOutboundBucket[];
};

export type AnalyticsReferrerItem = {
  referrer: string | null;
  count: number;
  percent: number;
};

export type AnalyticsUtmSourceItem = {
  source: string | null;
  count: number;
  percent: number;
};

export type AnalyticsReferrers = {
  referrers: AnalyticsReferrerItem[];
  utm_sources: AnalyticsUtmSourceItem[];
};

export type AnalyticsSessionListItem = {
  session_id: string;
  visitor_id: string;
  started_at: string;
  ended_at: string | null;
  landing_path: string;
  exit_path: string;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  country_code: string | null;
  city: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  pageview_count: number;
  click_count: number;
  outbound_count: number;
  outbound_channels: AnalyticsOutboundChannel[];
  max_scroll_percent: number | null;
  active_ms: number;
  is_bot: boolean;
  incomplete: boolean;
};

export type AnalyticsSessionList = {
  items: AnalyticsSessionListItem[];
  page: number;
  pageSize: number;
  total: number;
};

export type AnalyticsEventName =
  | 'page_view'
  | 'session_start'
  | 'intro_shown'
  | 'intro_skipped'
  | 'intro_completed'
  | 'section_view'
  | 'scroll_depth'
  | 'click'
  | 'work_card_view'
  | 'outbound_click'
  | 'engagement_heartbeat'
  | (string & {});

export type AnalyticsSessionEvent = {
  event_id: string;
  name: AnalyticsEventName;
  ts: string;
  page_id: string | null;
  path: string | null;
  props: Record<string, unknown>;
};

export type AnalyticsSessionDetail = {
  session: AnalyticsSessionListItem;
  events: AnalyticsSessionEvent[];
};

export type AnalyticsDatePreset = 'today' | '7d' | '14d' | '30d' | 'custom';

export type AnalyticsDetailTab =
  | 'pages'
  | 'sections'
  | 'clicks'
  | 'referrers'
  | 'sessions';
