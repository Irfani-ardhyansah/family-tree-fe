import { useMemo, useState } from 'react';
import {
  formatCount,
  formatYmdLabel,
} from '@/modules/admin/utils/analyticsFormat';
import { CHANNEL_LABELS } from '@/modules/admin/utils/analyticsLabels';
import type { AnalyticsOutboundChannel } from '@/modules/admin/analyticsTypes';
import { cx } from '@/shared/ui';

type LineSeries = {
  key: string;
  label: string;
  color: string;
  values: number[];
};

function linePath(
  points: Array<{ x: number; y: number }>,
  closeY?: number,
): string {
  if (points.length === 0) return '';
  const line = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');
  if (closeY == null) return line;
  const first = points[0];
  const last = points[points.length - 1];
  return `${line} L ${last.x.toFixed(1)} ${closeY} L ${first.x.toFixed(1)} ${closeY} Z`;
}

function useChartLayout(dates: string[], series: LineSeries[]) {
  const width = 720;
  const height = 228;
  const pad = { top: 16, right: 12, bottom: 28, left: 36 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const maxY = Math.max(1, ...series.flatMap((s) => s.values));
  const xAt = (i: number) =>
    pad.left + (dates.length <= 1 ? innerW / 2 : (i / (dates.length - 1)) * innerW);
  const yAt = (v: number) => pad.top + innerH - (v / maxY) * innerH;
  const tickStep =
    dates.length <= 8 ? 1 : dates.length <= 16 ? 2 : Math.ceil(dates.length / 8);

  return { width, height, pad, innerW, innerH, maxY, xAt, yAt, tickStep };
}

function ChartFrame({
  dates,
  series,
  ariaLabel,
}: {
  dates: string[];
  series: LineSeries[];
  ariaLabel: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const layout = useChartLayout(dates, series);
  const { width, height, pad, innerW, innerH, maxY, xAt, yAt, tickStep } = layout;
  const hoveredDate = hover != null ? dates[hover] : null;

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label={ariaLabel}
      >
        {[0.25, 0.5, 0.75, 1].map((t) => {
          const y = yAt(maxY * t);
          return (
            <g key={t}>
              <line
                x1={pad.left}
                x2={width - pad.right}
                y1={y}
                y2={y}
                className="stroke-suite-border"
                strokeWidth={1}
              />
              <text
                x={pad.left - 8}
                y={y + 3}
                textAnchor="end"
                className="fill-suite-faint"
                style={{ fontSize: 10, fontWeight: 600 }}
              >
                {formatCount(Math.round(maxY * t))}
              </text>
            </g>
          );
        })}

        {series.map((s) => {
          const points = s.values.map((v, i) => ({ x: xAt(i), y: yAt(v) }));
          return (
            <g key={s.key}>
              <path d={linePath(points, pad.top + innerH)} fill={`${s.color}22`} />
              <path
                d={linePath(points)}
                fill="none"
                stroke={s.color}
                strokeWidth={2.2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </g>
          );
        })}

        {hover != null && hoveredDate ? (
          <line
            x1={xAt(hover)}
            x2={xAt(hover)}
            y1={pad.top}
            y2={pad.top + innerH}
            className="stroke-suite-faint"
            strokeDasharray="4 4"
          />
        ) : null}

        {dates.map((date, i) => (
          <rect
            key={date}
            x={xAt(i) - innerW / Math.max(dates.length, 1) / 2}
            y={pad.top}
            width={Math.max(innerW / Math.max(dates.length, 1), 8)}
            height={innerH}
            fill="transparent"
            className="cursor-crosshair"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          />
        ))}

        {dates.map((date, i) =>
          i % tickStep === 0 || i === dates.length - 1 ? (
            <text
              key={`tick-${date}`}
              x={xAt(i)}
              y={height - 8}
              textAnchor="middle"
              className="fill-suite-faint"
              style={{ fontSize: 10, fontWeight: 600 }}
            >
              {formatYmdLabel(date)}
            </text>
          ) : null,
        )}
      </svg>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex flex-wrap gap-3 text-[12px] font-semibold text-suite-muted">
          {series.map((s) => (
            <span key={s.key} className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
        {hover != null && hoveredDate ? (
          <p className="text-[12px] font-semibold text-suite-ink">
            {formatYmdLabel(hoveredDate, true)}
            {series.map((s) => (
              <span key={s.key} className="ml-2 text-suite-muted">
                {s.label} {formatCount(s.values[hover] ?? 0)}
              </span>
            ))}
          </p>
        ) : (
          <p className="text-[12px] text-suite-faint">Arahkan kursor untuk detail harian</p>
        )}
      </div>
    </div>
  );
}

export function AnalyticsTrafficChart({
  points,
}: {
  points: Array<{ date: string; unique_visitors: number; pageviews: number }>;
}) {
  const dates = points.map((p) => p.date);
  const series = useMemo<LineSeries[]>(
    () => [
      {
        key: 'unique_visitors',
        label: 'Unique visitors',
        color: '#0d9488',
        values: points.map((p) => p.unique_visitors),
      },
      {
        key: 'pageviews',
        label: 'Pageviews',
        color: '#0ea5e9',
        values: points.map((p) => p.pageviews),
      },
    ],
    [points],
  );

  if (points.length === 0) return null;
  return (
    <ChartFrame
      dates={dates}
      series={series}
      ariaLabel="Grafik unique visitors dan pageviews harian"
    />
  );
}

const OUTBOUND_COLORS: Record<AnalyticsOutboundChannel, string> = {
  email: '#0284c7',
  whatsapp: '#059669',
  instagram: '#7c3aed',
};

export function AnalyticsOutboundChart({
  points,
}: {
  points: Array<{ date: string } & Record<AnalyticsOutboundChannel, number>>;
}) {
  const dates = points.map((p) => p.date);
  const series = useMemo<LineSeries[]>(
    () =>
      (['email', 'whatsapp', 'instagram'] as AnalyticsOutboundChannel[]).map((key) => ({
        key,
        label: CHANNEL_LABELS[key],
        color: OUTBOUND_COLORS[key],
        values: points.map((p) => p[key]),
      })),
    [points],
  );

  if (points.length === 0) return null;
  return (
    <ChartFrame
      dates={dates}
      series={series}
      ariaLabel="Grafik klik outbound Email, WhatsApp, dan Instagram"
    />
  );
}

export function ChannelStat({
  channel,
  value,
}: {
  channel: AnalyticsOutboundChannel;
  value: number;
}) {
  return (
    <div
      className={cx(
        'rounded-xl px-3 py-3 text-center',
        channel === 'email' && 'bg-sky-50 dark:bg-sky-500/10',
        channel === 'whatsapp' && 'bg-emerald-50 dark:bg-emerald-500/10',
        channel === 'instagram' && 'bg-violet-50 dark:bg-violet-500/10',
      )}
    >
      <p
        className={cx(
          'text-[11px] font-bold uppercase tracking-wide',
          channel === 'email' && 'text-sky-700 dark:text-sky-300',
          channel === 'whatsapp' && 'text-emerald-700 dark:text-emerald-300',
          channel === 'instagram' && 'text-violet-700 dark:text-violet-300',
        )}
      >
        {CHANNEL_LABELS[channel]}
      </p>
      <p className="mt-1 text-2xl font-bold text-suite-ink">{formatCount(value)}</p>
    </div>
  );
}
