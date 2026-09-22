import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from '@headlessui/react';
import { Fragment, type ComponentType } from 'react';
import {
  Activity,
  Briefcase,
  ChevronsDown,
  Clock,
  ExternalLink,
  Eye,
  FileText,
  Layers,
  MousePointer,
  Play,
  X,
} from 'react-feather';
import type {
  AnalyticsOutboundChannel,
  AnalyticsSessionDetail,
  AnalyticsSessionEvent,
} from '@/modules/admin/analyticsTypes';
import {
  formatActiveMs,
  formatJakartaDateTime,
  formatJakartaTime,
  propNumber,
  propString,
} from '@/modules/admin/utils/analyticsFormat';
import { AdminLoading } from '@/modules/admin/components/PageState';
import {
  CHANNEL_TONES,
  channelLabel,
  clickLabel,
  deviceLabel,
  eventLabel,
  isHiddenPropKey,
  pageLabel,
  referrerLabel,
  sectionLabel,
} from '@/modules/admin/utils/analyticsLabels';

type TimelineItem =
  | { type: 'event'; event: AnalyticsSessionEvent }
  | { type: 'heartbeats'; events: AnalyticsSessionEvent[] };

const EVENT_ICONS: Record<string, ComponentType<{ size?: number; className?: string }>> = {
  page_view: FileText,
  session_start: Play,
  intro_shown: Eye,
  intro_skipped: Eye,
  intro_completed: Eye,
  section_view: Layers,
  scroll_depth: ChevronsDown,
  click: MousePointer,
  work_card_view: Briefcase,
  outbound_click: ExternalLink,
  engagement_heartbeat: Activity,
};

function groupTimeline(events: AnalyticsSessionEvent[]): TimelineItem[] {
  const items: TimelineItem[] = [];
  for (const event of events) {
    if (event.name === 'engagement_heartbeat') {
      const last = items[items.length - 1];
      if (last?.type === 'heartbeats') {
        last.events.push(event);
      } else {
        items.push({ type: 'heartbeats', events: [event] });
      }
    } else {
      items.push({ type: 'event', event });
    }
  }
  return items;
}

function heartbeatCopy(events: AnalyticsSessionEvent[]): string {
  const firstMs = propNumber(events[0]?.props, 'active_ms') ?? 0;
  const lastMs = propNumber(events[events.length - 1]?.props, 'active_ms') ?? firstMs;
  const intervalSec =
    events.length > 1
      ? Math.max(1, Math.round((lastMs - firstMs) / (events.length - 1) / 1000))
      : 15;
  return `Aktif ${intervalSec}s × ${events.length}`;
}

function eventDetail(event: AnalyticsSessionEvent): string {
  const { name, props, path, page_id } = event;
  if (name === 'scroll_depth') {
    const percent = propNumber(props, 'percent');
    return percent != null ? `${percent}%` : '';
  }
  if (name === 'outbound_click') {
    const channel = propString(props, 'channel');
    const elementId = propString(props, 'element_id');
    return [channel ? channelLabel(channel) : null, elementId ? clickLabel(elementId) : null]
      .filter(Boolean)
      .join(' · ');
  }
  if (name === 'click') {
    const elementId = propString(props, 'element_id');
    const workTitle = propString(props, 'work_title') ?? propString(props, 'work_slug');
    if (workTitle) return workTitle;
    return elementId ? clickLabel(elementId) : '';
  }
  if (name === 'work_card_view') {
    return propString(props, 'work_title') ?? propString(props, 'work_slug') ?? '';
  }
  if (name === 'section_view') {
    const sectionId = propString(props, 'section_id');
    return sectionId ? sectionLabel(sectionId) : '';
  }
  if (name === 'page_view' || name === 'session_start') {
    return [pageLabel(page_id), path].filter(Boolean).join(' · ');
  }

  const extras = Object.entries(props)
    .filter(([key]) => !isHiddenPropKey(key))
    .slice(0, 3)
    .map(([key, value]) => `${key}: ${String(value)}`);
  return extras.join(' · ');
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-suite-faint">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-suite-ink">{value}</dd>
    </div>
  );
}

export function SessionDetailDrawer({
  open,
  loading,
  detail,
  onClose,
}: {
  open: boolean;
  loading: boolean;
  detail: AnalyticsSessionDetail | null;
  onClose: () => void;
}) {
  const session = detail?.session;
  const timeline = detail ? groupTimeline(detail.events) : [];

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-ink-950/45" />
        </TransitionChild>
        <div className="fixed inset-0 flex justify-end">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="translate-x-8 opacity-0"
            enterTo="translate-x-0 opacity-100"
            leave="ease-in duration-150"
            leaveFrom="translate-x-0 opacity-100"
            leaveTo="translate-x-8 opacity-0"
          >
            <DialogPanel className="flex h-full w-full max-w-md flex-col border-l border-suite-border bg-suite-surface shadow-2xl">
              <div className="flex items-start justify-between gap-3 border-b border-suite-border px-5 py-4">
                <div>
                  <DialogTitle className="text-lg font-bold text-suite-ink">
                    Replay sesi
                  </DialogTitle>
                  {session ? (
                    <p className="mt-0.5 text-xs text-suite-muted">
                      {formatJakartaDateTime(session.started_at)}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-control p-1.5 text-suite-faint hover:bg-suite-soft hover:text-suite-ink"
                  aria-label="Tutup"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                {loading && !detail ? (
                  <AdminLoading label="Memuat sesi…" />
                ) : session ? (
                  <>
                    <dl className="grid grid-cols-2 gap-3">
                      <MetaRow
                        label="Lokasi"
                        value={
                          [session.city, session.country_code].filter(Boolean).join(', ') || '—'
                        }
                      />
                      <MetaRow
                        label="Perangkat"
                        value={[deviceLabel(session.device), session.os, session.browser]
                          .filter((v) => v && v !== '—')
                          .join(' · ') || '—'}
                      />
                      <MetaRow label="Masuk" value={session.landing_path || '—'} />
                      <MetaRow label="Keluar" value={session.exit_path || '—'} />
                      <MetaRow label="Referrer" value={referrerLabel(session.referrer)} />
                      <MetaRow
                        label="UTM"
                        value={
                          [session.utm_source, session.utm_medium, session.utm_campaign]
                            .filter(Boolean)
                            .join(' / ') || '(langsung)'
                        }
                      />
                      <MetaRow label="Aktif" value={formatActiveMs(session.active_ms)} />
                      <MetaRow
                        label="Pageviews / klik"
                        value={`${session.pageview_count} / ${session.click_count}`}
                      />
                    </dl>

                    {session.outbound_channels.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {session.outbound_channels.map((channel) => (
                          <span
                            key={channel}
                            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${CHANNEL_TONES[channel as AnalyticsOutboundChannel] ?? 'bg-suite-soft text-suite-ink'}`}
                          >
                            {channelLabel(channel)}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <h3 className="mb-2 mt-6 text-xs font-bold uppercase tracking-wide text-suite-faint">
                      Timeline
                    </h3>
                    {timeline.length === 0 ? (
                      <p className="text-sm text-suite-muted">Belum ada event untuk sesi ini.</p>
                    ) : (
                      <ol className="space-y-2.5">
                        {timeline.map((item, index) => {
                          if (item.type === 'heartbeats') {
                            return (
                              <li
                                key={`hb-${item.events[0]?.event_id ?? index}`}
                                className="flex gap-2.5 rounded-xl bg-suite-soft/70 px-3 py-2"
                              >
                                <Clock size={14} className="mt-0.5 shrink-0 text-suite-faint" />
                                <div>
                                  <p className="text-sm font-medium text-suite-ink">
                                    {heartbeatCopy(item.events)}
                                  </p>
                                  <p className="text-[11px] text-suite-faint">
                                    {formatJakartaTime(item.events[0].ts)}
                                    {item.events.length > 1
                                      ? ` – ${formatJakartaTime(item.events[item.events.length - 1].ts)}`
                                      : ''}
                                  </p>
                                </div>
                              </li>
                            );
                          }

                          const Icon = EVENT_ICONS[item.event.name] ?? Activity;
                          const extra = eventDetail(item.event);
                          return (
                            <li key={item.event.event_id} className="flex gap-2.5">
                              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-admin-50 text-admin-700 dark:bg-admin-600/20 dark:text-admin-200">
                                <Icon size={13} />
                              </span>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-suite-ink">
                                  {eventLabel(item.event.name)}
                                </p>
                                {extra ? (
                                  <p className="truncate text-[12px] text-suite-muted">{extra}</p>
                                ) : null}
                                <p className="text-[11px] text-suite-faint">
                                  {formatJakartaTime(item.event.ts)}
                                </p>
                              </div>
                            </li>
                          );
                        })}
                      </ol>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-suite-muted">Session tidak ditemukan.</p>
                )}
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}
