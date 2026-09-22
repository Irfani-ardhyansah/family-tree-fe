import type { ReactNode } from 'react';
import { HelpCircle, Info } from 'react-feather';
import {
  AnalyticsOutboundChart,
  AnalyticsTrafficChart,
  ChannelStat,
} from '@/modules/admin/components/analytics/AnalyticsCharts';
import { PercentBar, WidgetFrame } from '@/modules/admin/components/analytics/WidgetFrame';
import { SessionDetailDrawer } from '@/modules/admin/components/analytics/SessionDetailDrawer';
import { usePortfolioAnalytics } from '@/modules/admin/hooks/usePortfolioAnalytics';
import type {
  AnalyticsDatePreset,
  AnalyticsDetailTab,
  AnalyticsOutboundChannel,
  AnalyticsPageId,
} from '@/modules/admin/analyticsTypes';
import {
  formatActiveMs,
  formatCount,
  formatInteger,
  formatJakartaDateTime,
  formatPercent,
  formatRangeEcho,
} from '@/modules/admin/utils/analyticsFormat';
import {
  CHANNEL_TONES,
  channelLabel,
  clickLabel,
  countryLabel,
  deviceLabel,
  pageLabel,
  referrerLabel,
  sectionLabel,
  utmLabel,
} from '@/modules/admin/utils/analyticsLabels';
import { cx } from '@/shared/ui';

const PRESETS: Array<{ id: Exclude<AnalyticsDatePreset, 'custom'>; label: string }> = [
  { id: 'today', label: 'Hari ini' },
  { id: '7d', label: '7 hari' },
  { id: '14d', label: '14 hari' },
  { id: '30d', label: '30 hari' },
];

const PAGE_FILTERS: Array<{ id: AnalyticsPageId | ''; label: string }> = [
  { id: '', label: 'Semua' },
  { id: 'home', label: 'Home' },
  { id: 'work', label: 'Work' },
];

const TABS: Array<{ id: AnalyticsDetailTab; label: string }> = [
  { id: 'pages', label: 'Halaman' },
  { id: 'sections', label: 'Section' },
  { id: 'clicks', label: 'Klik' },
  { id: 'referrers', label: 'Sumber' },
  { id: 'sessions', label: 'Sesi' },
];

const BOUNCE_HINT =
  'Bounce v1: sesi 1 pageview, 0 klik, aktif < 10 detik, max scroll < 25%.';

const TABLE_HEAD =
  'bg-suite-soft/80 text-left text-[11px] font-semibold uppercase tracking-wider text-suite-faint';

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'rounded-full px-3 py-1 text-[12px] font-semibold transition',
        active
          ? 'bg-admin-600 text-white'
          : 'bg-suite-soft text-suite-muted hover:bg-suite-border/80 hover:text-suite-ink',
      )}
    >
      {children}
    </button>
  );
}

function KpiCard({
  label,
  value,
  hint,
  sub,
}: {
  label: string;
  value: string;
  hint?: string;
  sub?: ReactNode;
}) {
  return (
    <div className="suite-card p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-suite-faint">
          {label}
        </p>
        {hint ? (
          <span title={hint} className="text-suite-faint" aria-label={hint}>
            <HelpCircle size={13} />
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-3xl font-bold tabular-nums text-suite-ink">{value}</p>
      {sub}
    </div>
  );
}

export function AnalyticsPage() {
  const analytics = usePortfolioAnalytics();
  const overview = analytics.overview.data;
  const outboundTotal = overview
    ? overview.outbounds.email + overview.outbounds.whatsapp + overview.outbounds.instagram
    : 0;
  const emptyVisit =
    overview != null &&
    overview.unique_visitors === 0 &&
    overview.sessions === 0 &&
    overview.pageviews === 0;
  const sessions = analytics.sessions.data;
  const totalSessionPages = Math.max(
    1,
    Math.ceil((sessions?.total ?? 0) / (sessions?.pageSize ?? 20)),
  );

  return (
    <div>
      <div className="sticky top-14 z-20 -mx-3 mb-6 border-b border-suite-border bg-suite-bg/95 px-3 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-7 lg:px-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-suite-ink">
              Portfolio analytics
            </h1>
            <p className="mt-0.5 text-[12px] text-suite-muted">
              {formatRangeEcho(analytics.from, analytics.to)}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={analytics.excludeBots}
            onClick={() => analytics.changeExcludeBots(!analytics.excludeBots)}
            className="inline-flex items-center gap-2 text-[12px] font-semibold text-suite-ink"
          >
            <span
              className={cx(
                'relative h-5 w-9 rounded-full transition',
                analytics.excludeBots ? 'bg-admin-600' : 'bg-suite-border',
              )}
            >
              <span
                className={cx(
                  'absolute top-0.5 h-4 w-4 rounded-full bg-white transition',
                  analytics.excludeBots ? 'left-4' : 'left-0.5',
                )}
              />
            </span>
            Sembunyikan bot
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {PRESETS.map((preset) => (
            <FilterChip
              key={preset.id}
              active={analytics.preset === preset.id}
              onClick={() => analytics.applyPreset(preset.id)}
            >
              {preset.label}
            </FilterChip>
          ))}
          <span
            className={cx(
              'rounded-full px-3 py-1 text-[12px] font-semibold',
              analytics.preset === 'custom'
                ? 'bg-admin-600 text-white'
                : 'bg-suite-soft text-suite-muted',
            )}
          >
            Custom
          </span>
          <input
            type="date"
            value={analytics.from}
            onChange={(e) => analytics.setFrom(e.target.value)}
            className="rounded-xl border-suite-border bg-suite-surface text-sm text-suite-ink focus:border-admin-500 focus:ring-admin-500"
          />
          <span className="text-suite-faint">–</span>
          <input
            type="date"
            value={analytics.to}
            onChange={(e) => analytics.setTo(e.target.value)}
            className="rounded-xl border-suite-border bg-suite-surface text-sm text-suite-ink focus:border-admin-500 focus:ring-admin-500"
          />
          <div className="mx-1 hidden h-5 w-px bg-suite-border sm:block" />
          {PAGE_FILTERS.map((item) => (
            <FilterChip
              key={item.id || 'all'}
              active={analytics.pageId === item.id}
              onClick={() => analytics.changePageId(item.id)}
            >
              {item.label}
            </FilterChip>
          ))}
        </div>
      </div>

      {emptyVisit ? (
        <p className="mb-4 rounded-xl border border-dashed border-suite-border bg-suite-surface/70 px-4 py-3 text-sm text-suite-muted">
          Belum ada kunjungan di rentang ini.
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          label="Unique visitors"
          value={analytics.overview.loading ? '…' : formatCount(overview?.unique_visitors ?? 0)}
        />
        <KpiCard
          label="Sessions"
          value={analytics.overview.loading ? '…' : formatCount(overview?.sessions ?? 0)}
        />
        <KpiCard
          label="Pageviews"
          value={analytics.overview.loading ? '…' : formatCount(overview?.pageviews ?? 0)}
        />
        <KpiCard
          label="Bounce rate"
          value={
            analytics.overview.loading ? '…' : formatPercent(overview?.bounce_rate ?? 0)
          }
          hint={BOUNCE_HINT}
        />
        <KpiCard
          label="Avg time on page"
          value={
            analytics.overview.loading ? '…' : formatActiveMs(overview?.avg_active_ms ?? 0)
          }
        />
        <KpiCard
          label="Outbound total"
          value={analytics.overview.loading ? '…' : formatCount(outboundTotal)}
          sub={
            overview ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(['email', 'whatsapp', 'instagram'] as AnalyticsOutboundChannel[]).map(
                  (channel) => (
                    <span
                      key={channel}
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${CHANNEL_TONES[channel]}`}
                    >
                      {channelLabel(channel)} {formatInteger(overview.outbounds[channel])}
                    </span>
                  ),
                )}
              </div>
            ) : null
          }
        />
      </div>
      {analytics.overview.error ? (
        <p className="mt-2 text-sm text-money-rose">{analytics.overview.error}</p>
      ) : null}

      <div className="mt-6 grid gap-4 xl:grid-cols-5">
        <WidgetFrame
          className="xl:col-span-3"
          title="Kunjungan harian"
          loading={analytics.timeseries.loading}
          error={analytics.timeseries.error}
          onRetry={analytics.reloadFold}
          empty={(analytics.timeseries.data?.buckets.length ?? 0) === 0}
        >
          <AnalyticsTrafficChart points={analytics.timeseries.data?.buckets ?? []} />
        </WidgetFrame>

        <WidgetFrame
          className="xl:col-span-2"
          title="Negara"
          hint="Unique visitors. IP tidak ditampilkan."
          loading={analytics.geo.loading}
          error={analytics.geo.error}
          onRetry={analytics.reloadFold}
          empty={(analytics.geo.data?.length ?? 0) === 0}
        >
          <ul className="space-y-2.5">
            {(analytics.geo.data ?? []).map((item) => (
              <li key={`${item.country_code}-${item.country_name}`}>
                <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                  <span className="font-medium text-suite-ink">
                    {countryLabel(item.country_code, item.country_name)}
                  </span>
                  <span className="tabular-nums text-suite-muted">
                    {formatInteger(item.count)} · {formatPercent(item.percent)}
                  </span>
                </div>
                <PercentBar percent={item.percent} />
              </li>
            ))}
          </ul>
        </WidgetFrame>
      </div>

      <WidgetFrame
        className="mt-4"
        title="Lead intent — outbound"
        hint="Klik Email, WhatsApp, dan Instagram dari site portfolio."
        loading={analytics.outbounds.loading}
        error={analytics.outbounds.error}
        onRetry={analytics.reloadFold}
        empty={
          (analytics.outbounds.data?.buckets.length ?? 0) === 0 &&
          (analytics.outbounds.data
            ? analytics.outbounds.data.totals.email +
                analytics.outbounds.data.totals.whatsapp +
                analytics.outbounds.data.totals.instagram ===
              0
            : outboundTotal === 0)
        }
        emptyText="Belum ada klik outbound di rentang ini."
      >
        <div className="mb-4 grid gap-2 sm:grid-cols-3">
          {(['email', 'whatsapp', 'instagram'] as AnalyticsOutboundChannel[]).map((channel) => (
            <ChannelStat
              key={channel}
              channel={channel}
              value={analytics.outbounds.data?.totals[channel] ?? 0}
            />
          ))}
        </div>
        <AnalyticsOutboundChart points={analytics.outbounds.data?.buckets ?? []} />
      </WidgetFrame>

      <div className="mt-6">
        <div className="mb-3 flex flex-wrap gap-1 rounded-xl bg-suite-soft p-1">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => analytics.setTab(item.id)}
              className={cx(
                'rounded-lg px-3 py-1.5 text-[13px] font-semibold transition',
                analytics.tab === item.id
                  ? 'bg-suite-surface text-suite-ink shadow-sm'
                  : 'text-suite-muted hover:text-suite-ink',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {analytics.tab === 'pages' ? (
          <WidgetFrame
            title="Halaman"
            loading={analytics.pages.loading}
            error={analytics.pages.error}
            onRetry={analytics.reloadTab}
            empty={(analytics.pages.data?.length ?? 0) === 0}
          >
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className={TABLE_HEAD}>
                  <tr>
                    <th className="px-3 py-2">Halaman</th>
                    <th className="px-3 py-2">Path</th>
                    <th className="px-3 py-2 text-right">Pageviews</th>
                    <th className="px-3 py-2 text-right">Unique</th>
                    <th className="px-3 py-2 text-right">Avg aktif</th>
                    <th className="px-3 py-2 text-right">Bounce</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-suite-border">
                  {(analytics.pages.data ?? []).map((row) => (
                    <tr key={`${row.page_id}-${row.path}`}>
                      <td className="px-3 py-2.5 font-medium text-suite-ink">
                        {pageLabel(row.page_id)}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[12px] text-suite-muted">
                        {row.path}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {formatInteger(row.pageviews)}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {formatInteger(row.unique_visitors)}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {formatActiveMs(row.avg_active_ms)}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {formatPercent(row.bounce_rate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </WidgetFrame>
        ) : null}

        {analytics.tab === 'sections' ? (
          <WidgetFrame
            title="Section terlihat"
            hint="Impressi section_view — section yang kelihatan di viewport."
            loading={analytics.sections.loading}
            error={analytics.sections.error}
            onRetry={analytics.reloadTab}
            empty={(analytics.sections.data?.length ?? 0) === 0}
          >
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className={TABLE_HEAD}>
                  <tr>
                    <th className="px-3 py-2">Section</th>
                    <th className="px-3 py-2">Halaman</th>
                    <th className="px-3 py-2 font-mono text-[10px]">section_id</th>
                    <th className="px-3 py-2 text-right">Views</th>
                    <th className="px-3 py-2 text-right">Sesi unik</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-suite-border">
                  {(analytics.sections.data ?? []).map((row) => (
                    <tr key={`${row.page_id}-${row.section_id}`}>
                      <td className="px-3 py-2.5 font-medium text-suite-ink">
                        {sectionLabel(row.section_id)}
                      </td>
                      <td className="px-3 py-2.5 text-suite-muted">{pageLabel(row.page_id)}</td>
                      <td className="px-3 py-2.5 font-mono text-[12px] text-suite-faint">
                        {row.section_id}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {formatInteger(row.views)}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {formatInteger(row.unique_sessions)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </WidgetFrame>
        ) : null}

        {analytics.tab === 'clicks' ? (
          <WidgetFrame
            title="Klik elemen"
            loading={analytics.clicks.loading}
            error={analytics.clicks.error}
            onRetry={analytics.reloadTab}
            empty={(analytics.clicks.data?.length ?? 0) === 0}
          >
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className={TABLE_HEAD}>
                  <tr>
                    <th className="px-3 py-2">Label</th>
                    <th className="px-3 py-2">element_id</th>
                    <th className="px-3 py-2 text-right">Klik</th>
                    <th className="px-3 py-2 text-right">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-suite-border">
                  {(analytics.clicks.data ?? []).map((row) => (
                    <tr key={row.element_id}>
                      <td className="px-3 py-2.5 font-medium text-suite-ink">
                        {clickLabel(row.element_id, row.label)}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[12px] text-suite-faint">
                        {row.element_id}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {formatInteger(row.count)}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {formatPercent(row.percent)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </WidgetFrame>
        ) : null}

        {analytics.tab === 'referrers' ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <WidgetFrame
              title="Referrer"
              loading={analytics.referrers.loading}
              error={analytics.referrers.error}
              onRetry={analytics.reloadTab}
              empty={(analytics.referrers.data?.referrers.length ?? 0) === 0}
            >
              <ul className="space-y-2.5">
                {(analytics.referrers.data?.referrers ?? []).map((item, index) => (
                  <li key={`${item.referrer ?? 'direct'}-${index}`}>
                    <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                      <span className="truncate font-medium text-suite-ink">
                        {referrerLabel(item.referrer)}
                      </span>
                      <span className="shrink-0 tabular-nums text-suite-muted">
                        {formatInteger(item.count)} · {formatPercent(item.percent)}
                      </span>
                    </div>
                    <PercentBar percent={item.percent} />
                  </li>
                ))}
              </ul>
            </WidgetFrame>
            <WidgetFrame
              title="utm_source"
              loading={analytics.referrers.loading}
              error={analytics.referrers.error}
              onRetry={analytics.reloadTab}
              empty={(analytics.referrers.data?.utm_sources.length ?? 0) === 0}
            >
              <ul className="space-y-2.5">
                {(analytics.referrers.data?.utm_sources ?? []).map((item, index) => (
                  <li key={`${item.source ?? 'direct'}-${index}`}>
                    <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                      <span className="truncate font-medium text-suite-ink">
                        {utmLabel(item.source)}
                      </span>
                      <span className="shrink-0 tabular-nums text-suite-muted">
                        {formatInteger(item.count)} · {formatPercent(item.percent)}
                      </span>
                    </div>
                    <PercentBar percent={item.percent} />
                  </li>
                ))}
              </ul>
            </WidgetFrame>
          </div>
        ) : null}

        {analytics.tab === 'sessions' ? (
          <WidgetFrame
            title="Sesi pengunjung"
            hint="Klik baris untuk replay kasar. IP dan user-agent disembunyikan."
            loading={analytics.sessions.loading}
            error={analytics.sessions.error}
            onRetry={analytics.reloadTab}
            empty={(sessions?.items.length ?? 0) === 0}
            actions={
              sessions ? (
                <p className="text-[12px] text-suite-faint">
                  {formatInteger(sessions.total)} sesi
                </p>
              ) : null
            }
          >
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className={TABLE_HEAD}>
                  <tr>
                    <th className="px-3 py-2">Mulai</th>
                    <th className="px-3 py-2">Lokasi</th>
                    <th className="px-3 py-2">Perangkat</th>
                    <th className="px-3 py-2">Landing</th>
                    <th className="px-3 py-2">Exit</th>
                    <th className="px-3 py-2 text-right">Aktif</th>
                    <th className="px-3 py-2 text-right">PV</th>
                    <th className="px-3 py-2">Outbound</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-suite-border">
                  {(sessions?.items ?? []).map((row) => (
                    <tr
                      key={row.session_id}
                      className="cursor-pointer hover:bg-admin-50/40 dark:hover:bg-admin-600/10"
                      onClick={() => analytics.openSession(row.session_id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          analytics.openSession(row.session_id);
                        }
                      }}
                      tabIndex={0}
                    >
                      <td className="whitespace-nowrap px-3 py-2.5 text-suite-ink">
                        {formatJakartaDateTime(row.started_at)}
                        {row.is_bot ? (
                          <span className="ml-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-800 dark:bg-amber-500/15 dark:text-amber-200">
                            bot
                          </span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2.5 text-suite-muted">
                        {[row.city, row.country_code].filter(Boolean).join(', ') || '—'}
                      </td>
                      <td className="px-3 py-2.5 text-suite-muted">
                        {deviceLabel(row.device)}
                        {row.os ? (
                          <span className="block text-[11px] text-suite-faint">{row.os}</span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[12px] text-suite-muted">
                        {row.landing_path}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[12px] text-suite-muted">
                        {row.exit_path}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {formatActiveMs(row.active_ms)}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {row.pageview_count}
                      </td>
                      <td className="px-3 py-2.5">
                        {row.outbound_channels.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {row.outbound_channels.map((channel) => (
                              <span
                                key={channel}
                                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase ${CHANNEL_TONES[channel]}`}
                              >
                                {channel === 'whatsapp' ? 'WA' : channelLabel(channel)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-suite-faint">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-suite-muted">
              <p>
                Halaman {sessions?.page ?? 1}/{totalSessionPages}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={(sessions?.page ?? 1) <= 1}
                  onClick={() => analytics.setSessionPage((sessions?.page ?? 1) - 1)}
                  className="rounded-xl border border-suite-border px-3 py-1.5 font-semibold hover:bg-suite-soft disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  type="button"
                  disabled={(sessions?.page ?? 1) >= totalSessionPages}
                  onClick={() => analytics.setSessionPage((sessions?.page ?? 1) + 1)}
                  className="rounded-xl border border-suite-border px-3 py-1.5 font-semibold hover:bg-suite-soft disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </WidgetFrame>
        ) : null}
      </div>

      <p className="mt-4 flex items-start gap-1.5 text-[11px] text-suite-faint">
        <Info size={12} className="mt-0.5 shrink-0" />
        {BOUNCE_HINT} Data pengunjung portfolio bersifat anonim.
      </p>

      <SessionDetailDrawer
        open={analytics.selectedSessionId != null}
        loading={analytics.sessionDetail.loading}
        detail={analytics.sessionDetail.data}
        onClose={analytics.closeSession}
      />
    </div>
  );
}
