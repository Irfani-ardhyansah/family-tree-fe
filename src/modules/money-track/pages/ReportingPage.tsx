import { useEffect, useMemo, useState } from 'react';
import { Download, EyeOff } from 'react-feather';
import { fetchMoneyMonthlyReport } from '@/modules/money-track/api/moneyApi';
import { DataSourceBanner } from '@/modules/money-track/components/DataSourceBanner';
import {
  FieldLabel,
  FieldSelect,
} from '@/modules/money-track/components/modals/MoneyFormFields';
import {
  FilterChip,
  MoneyCard,
  PageHeader,
} from '@/modules/money-track/components/PageChrome';
import { useMoneyTrackUi } from '@/modules/money-track/context/MoneyTrackUiContext';
import {
  applyCategoryExclusions,
  buildLocalMonthlyReport,
  downloadMonthlyCsv,
  formatChangePct,
  mapMoneyMonthlyReport,
  prevYearMonth,
  type CategorySlice,
  type DayPoint,
  type MonthlyReportView,
  type PersonBar,
  type PocketBar,
} from '@/modules/money-track/lib/reportingCalc';
import { formatIdr } from '@/modules/money-track/types';
import { ApiClientError } from '@/shared/lib/apiClient';

type ReportKind = 'expense' | 'income';

const EXCLUDED_CATEGORIES_KEY = 'money-track.reportExcludedCategories';

type ExcludedCategory = { key: string; label: string };

type ExcludedCategories = {
  expense: ExcludedCategory[];
  income: ExcludedCategory[];
};

function normalizeExcludedList(value: unknown): ExcludedCategory[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === 'string') {
        return { key: item, label: item };
      }
      if (
        item &&
        typeof item === 'object' &&
        'key' in item &&
        typeof (item as { key: unknown }).key === 'string'
      ) {
        const row = item as { key: string; label?: unknown };
        return {
          key: row.key,
          label: typeof row.label === 'string' && row.label.trim() ? row.label : row.key,
        };
      }
      return null;
    })
    .filter((item): item is ExcludedCategory => item != null);
}

function readExcludedCategories(): ExcludedCategories {
  try {
    const raw = localStorage.getItem(EXCLUDED_CATEGORIES_KEY);
    if (!raw) return { expense: [], income: [] };
    const parsed = JSON.parse(raw) as Partial<ExcludedCategories>;
    return {
      expense: normalizeExcludedList(parsed.expense),
      income: normalizeExcludedList(parsed.income),
    };
  } catch {
    return { expense: [], income: [] };
  }
}

function writeExcludedCategories(next: ExcludedCategories) {
  try {
    localStorage.setItem(EXCLUDED_CATEGORIES_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

const MONTH_OPTIONS = [
  { value: '01', label: 'Januari' },
  { value: '02', label: 'Februari' },
  { value: '03', label: 'Maret' },
  { value: '04', label: 'April' },
  { value: '05', label: 'Mei' },
  { value: '06', label: 'Juni' },
  { value: '07', label: 'Juli' },
  { value: '08', label: 'Agustus' },
  { value: '09', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' },
] as const;

const COLOR_INCOME = '#3d6b5a';
const COLOR_EXPENSE = '#c06a5f';
const COLOR_NET = '#6b5344';


function monthRange(year: string, month: string) {
  const y = Number(year);
  const m = Number(month);
  const lastDay = new Date(y, m, 0).getDate();
  return {
    fromDate: `${year}-${month}-01`,
    toDate: `${year}-${month}-${String(lastDay).padStart(2, '0')}`,
    daysInMonth: lastDay,
  };
}

function buildYearOptions(centerYear: number) {
  const years: { value: string; label: string }[] = [];
  for (let y = centerYear + 1; y >= centerYear - 5; y -= 1) {
    years.push({ value: String(y), label: String(y) });
  }
  return years;
}


function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function donutSegmentPath(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number,
): string {
  const sweep = Math.min(endAngle - startAngle, 359.999);
  const end = startAngle + sweep;
  const large = sweep > 180 ? 1 : 0;
  const o1 = polar(cx, cy, outerR, startAngle);
  const o2 = polar(cx, cy, outerR, end);
  const i1 = polar(cx, cy, innerR, end);
  const i2 = polar(cx, cy, innerR, startAngle);
  return [
    `M ${o1.x} ${o1.y}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${o2.x} ${o2.y}`,
    `L ${i1.x} ${i1.y}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${i2.x} ${i2.y}`,
    'Z',
  ].join(' ');
}

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

function MomBadge({
  pct,
  higherIsBad = false,
}: {
  pct: number | null;
  /** true untuk pengeluaran: naik = buruk */
  higherIsBad?: boolean;
}) {
  if (pct == null) {
    return (
      <span className="text-[11px] font-semibold text-money-faint">vs lalu n/a</span>
    );
  }
  const flat = pct === 0;
  const bad = higherIsBad ? pct > 0 : pct < 0;
  return (
    <span
      className={[
        'text-[11px] font-semibold',
        flat
          ? 'text-money-faint'
          : bad
            ? 'text-money-rose'
            : 'text-money-brown-deep',
      ].join(' ')}
    >
      {formatChangePct(pct)} vs lalu
    </span>
  );
}

function DonutChart({
  slices,
  selectedKey,
  excludedKeys,
  countedTotal,
  onSelect,
}: {
  slices: CategorySlice[];
  selectedKey: string | null;
  excludedKeys: ReadonlySet<string>;
  countedTotal: number;
  onSelect: (key: string | null) => void;
}) {
  const size = 240;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 96;
  const innerR = 58;
  const explode = 12;
  const selected =
    selectedKey && !excludedKeys.has(selectedKey)
      ? (slices.find((s) => s.key === selectedKey) ?? null)
      : null;

  let angle = 0;
  const segments = slices.map((slice) => {
    const start = angle;
    const sweep = (slice.pct / 100) * 360;
    const end = start + sweep;
    const mid = start + sweep / 2;
    angle = end;
    const excluded = excludedKeys.has(slice.key);
    const active = !excluded && selectedKey === slice.key;
    const dimmed = excluded || (selectedKey != null && !active);
    const dx = active ? Math.cos(((mid - 90) * Math.PI) / 180) * explode : 0;
    const dy = active ? Math.sin(((mid - 90) * Math.PI) / 180) * explode : 0;
    return { slice, start, end, mid, active, dimmed, excluded, dx, dy };
  });

  return (
    <div className="relative mx-auto h-[240px] w-[240px]">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={outerR + 2} fill="#efeae3" />
        {segments.map(({ slice, start, end, active, dimmed, excluded, dx, dy }) => (
          <g
            key={slice.key}
            className={excluded ? 'cursor-default' : 'cursor-pointer'}
            style={{
              transform: `translate(${dx}px, ${dy}px)`,
              opacity: excluded ? 0.2 : dimmed ? 0.32 : 1,
              transition: 'transform 320ms ease-out, opacity 280ms ease-out',
              filter: active
                ? 'drop-shadow(0 4px 8px rgba(31, 42, 31, 0.22))'
                : 'none',
            }}
            role="button"
            tabIndex={excluded ? -1 : 0}
            aria-label={`${slice.label} ${slice.pct.toFixed(1)} persen`}
            aria-pressed={active}
            aria-disabled={excluded}
            onClick={() => {
              if (excluded) return;
              onSelect(active ? null : slice.key);
            }}
            onKeyDown={(e) => {
              if (excluded) return;
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(active ? null : slice.key);
              }
            }}
          >
            <path
              d={donutSegmentPath(cx, cy, innerR, outerR, start, end)}
              fill={slice.color}
            />
          </g>
        ))}
        <circle cx={cx} cy={cy} r={innerR - 1} fill="#fffdf9" />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
        {selected ? (
          <>
            <div className="truncate text-[11px] font-bold uppercase tracking-wide text-money-faint">
              {selected.label}
            </div>
            <div className="font-money-mono text-[22px] font-extrabold leading-none text-money-ink">
              {selected.pct < 10
                ? selected.pct.toFixed(1)
                : Math.round(selected.pct)}
              %
            </div>
            <div className="font-money-mono mt-1 text-[12px] font-semibold text-money-muted">
              {formatIdr(selected.amount)}
            </div>
          </>
        ) : (
          <>
            <div className="text-[11px] font-bold uppercase tracking-wide text-money-faint">
              Total
            </div>
            <div className="font-money-mono px-2 text-[15px] font-extrabold leading-tight">
              {formatIdr(countedTotal)}
            </div>
            <div className="mt-1 text-[11px] font-semibold text-money-faint">
              Klik slice untuk fokus
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function DailyTrendChart({
  series,
  hoverDay,
  onHoverDay,
}: {
  series: DayPoint[];
  hoverDay: number | null;
  onHoverDay: (day: number | null) => void;
}) {
  const width = 640;
  const height = 220;
  const pad = { top: 16, right: 12, bottom: 28, left: 12 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const maxY = Math.max(
    1,
    ...series.map((d) => Math.max(d.income, d.expense)),
  );
  const xAt = (i: number) =>
    pad.left +
    (series.length <= 1 ? innerW / 2 : (i / (series.length - 1)) * innerW);
  const yAt = (v: number) => pad.top + innerH - (v / maxY) * innerH;

  const incomePts = series.map((d, i) => ({ x: xAt(i), y: yAt(d.income) }));
  const expensePts = series.map((d, i) => ({ x: xAt(i), y: yAt(d.expense) }));
  const hovered = hoverDay != null ? series.find((d) => d.day === hoverDay) : null;

  const tickDays =
    series.length <= 10
      ? series.map((d) => d.day)
      : [1, 5, 10, 15, 20, 25, series[series.length - 1]?.day].filter(
          (d, i, arr) => d != null && arr.indexOf(d) === i,
        );

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label="Tren harian pemasukan dan pengeluaran"
      >
        {[0.25, 0.5, 0.75, 1].map((t) => {
          const y = yAt(maxY * t);
          return (
            <line
              key={t}
              x1={pad.left}
              x2={width - pad.right}
              y1={y}
              y2={y}
              stroke="#efeae3"
              strokeWidth={1}
            />
          );
        })}
        <path
          d={linePath(incomePts, pad.top + innerH)}
          fill={`${COLOR_INCOME}22`}
        />
        <path
          d={linePath(expensePts, pad.top + innerH)}
          fill={`${COLOR_EXPENSE}1a`}
        />
        <path
          d={linePath(incomePts)}
          fill="none"
          stroke={COLOR_INCOME}
          strokeWidth={2.2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path
          d={linePath(expensePts)}
          fill="none"
          stroke={COLOR_EXPENSE}
          strokeWidth={2.2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {hovered ? (
          <line
            x1={xAt(hovered.day - 1)}
            x2={xAt(hovered.day - 1)}
            y1={pad.top}
            y2={pad.top + innerH}
            stroke="#cbbba8"
            strokeDasharray="4 4"
          />
        ) : null}
        {series.map((d, i) => (
          <rect
            key={d.dateIso}
            x={xAt(i) - innerW / series.length / 2}
            y={pad.top}
            width={Math.max(innerW / series.length, 8)}
            height={innerH}
            fill="transparent"
            className="cursor-crosshair"
            onMouseEnter={() => onHoverDay(d.day)}
            onMouseLeave={() => onHoverDay(null)}
          />
        ))}
        {tickDays.map((day) => (
          <text
            key={day}
            x={xAt(day - 1)}
            y={height - 8}
            textAnchor="middle"
            className="fill-money-faint"
            style={{ fontSize: 10, fontWeight: 600 }}
          >
            {day}
          </text>
        ))}
      </svg>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex flex-wrap gap-3 text-[12px] font-semibold text-money-muted">
          <span className="inline-flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: COLOR_INCOME }}
            />
            Pemasukan
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: COLOR_EXPENSE }}
            />
            Pengeluaran
          </span>
        </div>
        {hovered ? (
          <div className="font-money-mono text-[12px] font-semibold text-money-ink">
            tgl {hovered.day}: +{formatIdr(hovered.income)} / −
            {formatIdr(hovered.expense)}
          </div>
        ) : (
          <div className="text-[12px] text-money-faint">
            Arahkan ke grafik untuk detail hari
          </div>
        )}
      </div>
    </div>
  );
}

function formatIdrShort(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '−' : value > 0 ? '+' : '';
  if (abs >= 1_000_000_000) {
    return `${sign}${(abs / 1_000_000_000).toFixed(1)}M`;
  }
  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toFixed(1)}jt`;
  }
  if (abs >= 1_000) {
    return `${sign}${Math.round(abs / 1_000)}rb`;
  }
  return `${sign}${abs}`;
}

function CashflowChart({ series }: { series: DayPoint[] }) {
  const [hoverDay, setHoverDay] = useState<number | null>(null);
  const width = 640;
  const height = 210;
  const pad = { top: 18, right: 16, bottom: 28, left: 52 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const values = series.map((d) => d.cumulativeNet);
  const maxAbs = Math.max(1, ...values.map((v) => Math.abs(v)));
  const xAt = (i: number) =>
    pad.left +
    (series.length <= 1 ? innerW / 2 : (i / (series.length - 1)) * innerW);
  const yAt = (v: number) =>
    pad.top + innerH / 2 - (v / maxAbs) * (innerH / 2);
  const zeroY = yAt(0);
  const pts = series.map((d, i) => ({ x: xAt(i), y: yAt(d.cumulativeNet) }));
  const end = series[series.length - 1];
  const endNet = end?.cumulativeNet ?? 0;
  const hovered =
    hoverDay != null ? series.find((d) => d.day === hoverDay) : null;
  const tickDays = [1, Math.ceil(series.length / 2), series.length].filter(
    (d, i, arr) => arr.indexOf(d) === i,
  );

  return (
    <div className="w-full">
      <div className="mb-3 rounded-[12px] bg-money-soft/60 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-money-muted">
        Garis ini menumpuk{' '}
        <span className="font-semibold text-money-ink">
          pemasukan − pengeluaran
        </span>{' '}
        dari tanggal 1. Naik = lagi surplus, turun = lagi defisit. Garis putus
        di tengah = titik impas (0).
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label="Cashflow kumulatif bulan ini"
      >
        <text
          x={pad.left - 6}
          y={pad.top + 4}
          textAnchor="end"
          className="fill-money-faint"
          style={{ fontSize: 10, fontWeight: 700 }}
        >
          {formatIdrShort(maxAbs)}
        </text>
        <text
          x={pad.left - 6}
          y={zeroY + 3}
          textAnchor="end"
          className="fill-money-faint"
          style={{ fontSize: 10, fontWeight: 700 }}
        >
          0
        </text>
        <text
          x={pad.left - 6}
          y={pad.top + innerH}
          textAnchor="end"
          className="fill-money-faint"
          style={{ fontSize: 10, fontWeight: 700 }}
        >
          {formatIdrShort(-maxAbs)}
        </text>

        <line
          x1={pad.left}
          x2={width - pad.right}
          y1={zeroY}
          y2={zeroY}
          stroke="#cbbba8"
          strokeWidth={1.25}
          strokeDasharray="5 4"
        />
        <text
          x={width - pad.right}
          y={zeroY - 5}
          textAnchor="end"
          className="fill-money-faint"
          style={{ fontSize: 9, fontWeight: 700 }}
        >
          impas
        </text>

        <path
          d={linePath(pts, zeroY)}
          fill={endNet >= 0 ? `${COLOR_INCOME}18` : `${COLOR_EXPENSE}18`}
        />
        <path
          d={linePath(pts)}
          fill="none"
          stroke={COLOR_NET}
          strokeWidth={2.2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {hovered ? (
          <>
            <line
              x1={xAt(hovered.day - 1)}
              x2={xAt(hovered.day - 1)}
              y1={pad.top}
              y2={pad.top + innerH}
              stroke="#cbbba8"
              strokeDasharray="4 4"
            />
            <circle
              cx={xAt(hovered.day - 1)}
              cy={yAt(hovered.cumulativeNet)}
              r={4}
              fill={COLOR_NET}
            />
          </>
        ) : null}

        {series.map((d, i) => (
          <rect
            key={d.dateIso}
            x={xAt(i) - innerW / series.length / 2}
            y={pad.top}
            width={Math.max(innerW / series.length, 8)}
            height={innerH}
            fill="transparent"
            className="cursor-crosshair"
            onMouseEnter={() => setHoverDay(d.day)}
            onMouseLeave={() => setHoverDay(null)}
          />
        ))}

        {tickDays.map((day) => (
          <text
            key={day}
            x={xAt(day - 1)}
            y={height - 8}
            textAnchor="middle"
            className="fill-money-faint"
            style={{ fontSize: 10, fontWeight: 600 }}
          >
            tgl {day}
          </text>
        ))}
      </svg>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-1">
        {hovered ? (
          <div className="text-[12.5px] text-money-muted">
            Sampai tgl {hovered.day}:{' '}
            <span
              className={[
                'font-money-mono font-extrabold',
                hovered.cumulativeNet >= 0
                  ? 'text-money-brown-deep'
                  : 'text-money-rose',
              ].join(' ')}
            >
              {hovered.cumulativeNet >= 0 ? '+' : '−'}
              {formatIdr(Math.abs(hovered.cumulativeNet))}
            </span>
            <span className="text-money-faint">
              {' '}
              (hari itu {hovered.net >= 0 ? '+' : '−'}
              {formatIdr(Math.abs(hovered.net))})
            </span>
          </div>
        ) : (
          <div className="text-[12px] text-money-faint">
            Arahkan ke garis untuk lihat saldo sampai hari itu
          </div>
        )}
        <div className="text-right">
          <div className="text-[11px] font-semibold text-money-faint">
            Akhir bulan
          </div>
          <div
            className={[
              'font-money-mono text-[14px] font-extrabold',
              endNet >= 0 ? 'text-money-brown-deep' : 'text-money-rose',
            ].join(' ')}
          >
            {endNet >= 0 ? 'Surplus ' : 'Defisit '}
            {formatIdr(Math.abs(endNet))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CompareBars({
  income,
  expense,
}: {
  income: number;
  expense: number;
}) {
  const max = Math.max(income, expense, 1);
  return (
    <div className="space-y-4">
      {(
        [
          ['Pemasukan', income, COLOR_INCOME],
          ['Pengeluaran', expense, COLOR_EXPENSE],
        ] as const
      ).map(([label, value, color]) => (
        <div key={label}>
          <div className="mb-1.5 flex items-baseline justify-between gap-2">
            <span className="text-[12.5px] font-bold text-money-muted">
              {label}
            </span>
            <span className="font-money-mono text-[14px] font-extrabold">
              {formatIdr(value)}
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-money-soft">
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{
                width: `${Math.max((value / max) * 100, value > 0 ? 2 : 0)}%`,
                backgroundColor: color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function PersonBreakdown({ bars }: { bars: PersonBar[] }) {
  const max = Math.max(1, ...bars.map((b) => Math.max(b.income, b.expense)));
  if (bars.length === 0) {
    return (
      <p className="px-1 py-6 text-center text-[13px] text-money-faint">
        Belum ada data per orang di periode ini.
      </p>
    );
  }
  return (
    <div className="space-y-5">
      {bars.map((bar) => (
        <div key={bar.personId}>
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <span className="text-[13.5px] font-bold">{bar.label}</span>
            <span
              className={[
                'font-money-mono text-[12px] font-bold',
                bar.income - bar.expense >= 0
                  ? 'text-money-brown-deep'
                  : 'text-money-rose',
              ].join(' ')}
            >
              {bar.income - bar.expense >= 0 ? '+' : '−'}
              {formatIdr(Math.abs(bar.income - bar.expense))}
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-16 shrink-0 text-[11px] font-semibold text-money-faint">
                Masuk
              </span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-money-soft">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(bar.income / max) * 100}%`,
                    backgroundColor: COLOR_INCOME,
                  }}
                />
              </div>
              <span className="font-money-mono w-[7.5rem] shrink-0 text-right text-[11px] font-semibold text-money-muted">
                {formatIdr(bar.income)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-16 shrink-0 text-[11px] font-semibold text-money-faint">
                Keluar
              </span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-money-soft">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(bar.expense / max) * 100}%`,
                    backgroundColor: COLOR_EXPENSE,
                  }}
                />
              </div>
              <span className="font-money-mono w-[7.5rem] shrink-0 text-right text-[11px] font-semibold text-money-muted">
                {formatIdr(bar.expense)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PocketBreakdown({ bars }: { bars: PocketBar[] }) {
  const max = Math.max(1, ...bars.map((b) => b.expense));
  if (bars.length === 0) {
    return (
      <p className="py-8 text-center text-[13px] text-money-faint">
        Belum ada pengeluaran per kantong.
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {bars.slice(0, 8).map((bar) => (
        <li key={bar.key}>
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <span className="truncate text-[13px] font-bold">{bar.label}</span>
            <span className="font-money-mono shrink-0 text-[12px] font-extrabold text-money-rose">
              {formatIdr(bar.expense)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-money-soft">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(bar.expense / max) * 100}%`,
                backgroundColor: COLOR_EXPENSE,
              }}
            />
          </div>
          {bar.income > 0 ? (
            <div className="mt-0.5 text-[11px] text-money-faint">
              Masuk {formatIdr(bar.income)}
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}


export function ReportingPage() {
  const {
    scope,
    scopeLabel,
    dataSource,
    transactions,
    debts,
    activityTick,
  } = useMoneyTrackUi();

  const now = new Date();
  const [month, setMonth] = useState(
    String(now.getMonth() + 1).padStart(2, '0'),
  );
  const [year, setYear] = useState(String(now.getFullYear()));
  const [kind, setKind] = useState<ReportKind>('expense');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [hoverDay, setHoverDay] = useState<number | null>(null);
  const [excluded, setExcluded] = useState(readExcludedCategories);
  const excludedExpenseKeys = useMemo(
    () => new Set(excluded.expense.map((item) => item.key)),
    [excluded.expense],
  );
  const excludedIncomeKeys = useMemo(
    () => new Set(excluded.income.map((item) => item.key)),
    [excluded.income],
  );
  const activeExcluded = kind === 'expense' ? excluded.expense : excluded.income;
  const yearOptions = useMemo(
    () => buildYearOptions(now.getFullYear()),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fixed around first mount year
    [],
  );

  const { fromDate, toDate, daysInMonth } = useMemo(
    () => monthRange(year, month),
    [year, month],
  );
  const prev = useMemo(() => prevYearMonth(year, month), [year, month]);
  const prevRange = useMemo(
    () => monthRange(prev.year, prev.month),
    [prev.year, prev.month],
  );
  const periodLabelLocal =
    `${MONTH_OPTIONS.find((m) => m.value === month)?.label ?? month} ${year}`;
  const prevPeriodLabelLocal =
    `${MONTH_OPTIONS.find((m) => m.value === prev.month)?.label ?? prev.month} ${prev.year}`;
  const yearMonth = `${year}-${month}`;

  const [apiReport, setApiReport] = useState<MonthlyReportView | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (dataSource !== 'api') return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchMoneyMonthlyReport({
          yearMonth,
          scope: scope === 'all' ? 'all' : 'person',
          personId: scope !== 'all' ? scope : undefined,
        });
        if (!cancelled) setApiReport(mapMoneyMonthlyReport(data));
      } catch (err) {
        if (!cancelled) {
          setApiReport(null);
          setError(
            err instanceof ApiClientError
              ? err.message
              : err instanceof Error
                ? err.message
                : 'Gagal memuat data reporting.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dataSource, scope, yearMonth, activityTick]);

  const localReport = useMemo(() => {
    if (dataSource === 'api') return null;
    const currentRows = transactions.filter((row) => {
      if (scope !== 'all' && row.personId !== scope) return false;
      if (row.dateIso < fromDate || row.dateIso > toDate) return false;
      return true;
    });
    const previousRows = transactions.filter((row) => {
      if (scope !== 'all' && row.personId !== scope) return false;
      if (row.dateIso < prevRange.fromDate || row.dateIso > prevRange.toDate) {
        return false;
      }
      return true;
    });
    return buildLocalMonthlyReport({
      year,
      month,
      daysInMonth,
      periodLabel: periodLabelLocal,
      previousPeriodLabel: prevPeriodLabelLocal,
      currentRows,
      previousRows,
      debts,
      scope,
    });
  }, [
    dataSource,
    transactions,
    debts,
    scope,
    fromDate,
    toDate,
    prevRange,
    year,
    month,
    daysInMonth,
    periodLabelLocal,
    prevPeriodLabelLocal,
  ]);

  const rawReport = dataSource === 'api' ? apiReport : localReport;
  const report = useMemo(() => {
    if (!rawReport) return null;
    return applyCategoryExclusions(
      rawReport,
      excludedExpenseKeys,
      excludedIncomeKeys,
    );
  }, [rawReport, excludedExpenseKeys, excludedIncomeKeys]);

  const allSlices = useMemo(
    () =>
      kind === 'expense'
        ? (rawReport?.categoryExpense ?? [])
        : (rawReport?.categoryIncome ?? []),
    [kind, rawReport],
  );
  const activeExcludedKeys =
    kind === 'expense' ? excludedExpenseKeys : excludedIncomeKeys;
  const periodLabel = report?.periodLabel || periodLabelLocal;
  const prevPeriodLabel = report?.previousPeriodLabel || prevPeriodLabelLocal;

  const incomeTotal = report?.income ?? 0;
  const expenseTotal = report?.expense ?? 0;
  const net = report?.net ?? 0;
  const savingsRate = report?.savingsRatePct ?? null;
  const incomeMom = report?.incomeChangePct ?? null;
  const expenseMom = report?.expenseChangePct ?? null;
  const netMom = report?.netChangePct ?? null;
  const dailySeries = report?.daily ?? [];
  const topExpenseDays = report?.topExpenseDays ?? [];
  const personBars = report?.persons ?? [];
  const pocketBars = report?.pockets ?? [];
  const moves = report?.moves ?? {
    transferCount: 0,
    transferAmount: 0,
    cashCount: 0,
    cashAmount: 0,
  };
  const debtSnapshot = report?.debts ?? {
    utang: 0,
    piutang: 0,
    dueSoon: 0,
    count: 0,
  };
  const slices = useMemo(
    () =>
      kind === 'expense'
        ? (report?.categoryExpense ?? [])
        : (report?.categoryIncome ?? []),
    [kind, report],
  );
  const categoryTotal = slices.reduce((s, x) => s + x.amount, 0);
  const hasData = Boolean(report?.hasLedgerData);
  const showPersonBreakdown = scope === 'all' && personBars.length > 1;

  useEffect(() => {
    setSelectedKey(null);
    setHoverDay(null);
  }, [kind, scope, yearMonth]);

  useEffect(() => {
    if (selectedKey && !slices.some((s) => s.key === selectedKey)) {
      setSelectedKey(null);
    }
  }, [slices, selectedKey]);

  const persistExcluded = (next: ExcludedCategories) => {
    setExcluded(next);
    writeExcludedCategories(next);
  };

  const excludeCategory = (slice: CategorySlice) => {
    const list = kind === 'expense' ? excluded.expense : excluded.income;
    if (list.some((item) => item.key === slice.key)) return;
    persistExcluded({
      ...excluded,
      [kind]: [...list, { key: slice.key, label: slice.label }],
    });
    if (selectedKey === slice.key) setSelectedKey(null);
  };

  const restoreCategory = (key: string) => {
    persistExcluded({
      ...excluded,
      [kind]: (kind === 'expense' ? excluded.expense : excluded.income).filter(
        (item) => item.key !== key,
      ),
    });
  };

  const restoreAllCategories = () => {
    persistExcluded({
      ...excluded,
      [kind]: [],
    });
  };

  const handleExport = () => {
    if (!report) return;
    downloadMonthlyCsv({
      periodLabel,
      scopeLabel,
      income: report.income,
      expense: report.expense,
      net: report.net,
      prevIncome: report.prevIncome,
      prevExpense: report.prevExpense,
      prevNet: report.prevNet,
      categories: slices.map((s) => ({
        label: s.label,
        amount: s.amount,
        pct: s.pct,
      })),
      pockets: report.pockets,
      moves: report.moves,
    });
  };

  return (
    <div>
      <DataSourceBanner />
      <PageHeader
        title="Reporting"
        description={`Evaluasi bulanan — ${scopeLabel} · ${periodLabel}`}
        actions={
          <button
            type="button"
            onClick={handleExport}
            disabled={loading || !hasData}
            className="inline-flex items-center gap-1.5 rounded-full border border-money-border px-3.5 py-2 text-[13px] font-bold text-money-muted hover:bg-money-soft disabled:opacity-40"
          >
            <Download size={15} />
            Export CSV
          </button>
        }
      />

      <MoneyCard className="mb-4 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-[140px]">
            <FieldLabel>Bulan</FieldLabel>
            <FieldSelect
              value={month}
              onChange={setMonth}
              options={MONTH_OPTIONS.map((m) => ({
                value: m.value,
                label: m.label,
              }))}
            />
          </div>
          <div className="w-[110px]">
            <FieldLabel>Tahun</FieldLabel>
            <FieldSelect
              value={year}
              onChange={setYear}
              options={yearOptions}
            />
          </div>
          <p className="pb-2 text-[12px] text-money-faint">
            Dibandingkan dengan {prevPeriodLabel}
          </p>
        </div>
      </MoneyCard>

      {error ? (
        <div className="mb-4 rounded-[10px] border border-money-rose/30 bg-money-rose-soft px-3 py-2 text-[12.5px] font-semibold text-money-rose">
          {error}
        </div>
      ) : null}

      {excluded.expense.length + excluded.income.length > 0 ? (
        <p className="mb-3 text-[12.5px] text-money-muted">
          Kategori yang redup tidak masuk hitungan total & komposisi.
        </p>
      ) : null}

      <div className="mb-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MoneyCard className="px-5 py-4">
          <div className="text-[11px] font-bold uppercase tracking-wide text-money-faint">
            Pemasukan
          </div>
          <div className="mt-1 font-money-mono text-xl font-extrabold text-money-brown-deep">
            {loading ? '…' : formatIdr(incomeTotal)}
          </div>
          {!loading ? <MomBadge pct={incomeMom} /> : null}
        </MoneyCard>
        <MoneyCard className="px-5 py-4">
          <div className="text-[11px] font-bold uppercase tracking-wide text-money-faint">
            Pengeluaran
          </div>
          <div className="mt-1 font-money-mono text-xl font-extrabold text-money-rose">
            {loading ? '…' : formatIdr(expenseTotal)}
          </div>
          {!loading ? <MomBadge pct={expenseMom} higherIsBad /> : null}
        </MoneyCard>
        <MoneyCard className="px-5 py-4">
          <div className="text-[11px] font-bold uppercase tracking-wide text-money-faint">
            Selisih
          </div>
          <div
            className={[
              'mt-1 font-money-mono text-xl font-extrabold',
              net >= 0 ? 'text-money-brown-deep' : 'text-money-rose',
            ].join(' ')}
            style={net >= 0 ? { color: COLOR_NET } : undefined}
          >
            {loading
              ? '…'
              : `${net >= 0 ? '+' : '−'}${formatIdr(Math.abs(net))}`}
          </div>
          {!loading ? (
            <div className="flex flex-wrap items-center gap-2">
              <MomBadge pct={netMom} />
              {savingsRate != null ? (
                <span className="text-[11px] font-semibold text-money-faint">
                  · simpan {savingsRate.toFixed(0)}%
                </span>
              ) : null}
            </div>
          ) : null}
        </MoneyCard>
        <MoneyCard className="px-5 py-4">
          <div className="text-[11px] font-bold uppercase tracking-wide text-money-faint">
            Utang / Piutang open
          </div>
          <div className="mt-1 font-money-mono text-[15px] font-extrabold text-money-ink">
            −{formatIdr(debtSnapshot.utang)}
          </div>
          <div className="font-money-mono text-[15px] font-extrabold text-money-brown-deep">
            +{formatIdr(debtSnapshot.piutang)}
          </div>
          {debtSnapshot.dueSoon > 0 ? (
            <div className="mt-0.5 text-[11px] font-semibold text-money-amber">
              {debtSnapshot.dueSoon} jatuh tempo dekat
            </div>
          ) : (
            <div className="mt-0.5 text-[11px] font-semibold text-money-faint">
              {debtSnapshot.count} catatan aktif
            </div>
          )}
        </MoneyCard>
      </div>

      <div className="flex flex-col gap-3.5">
        <MoneyCard className="p-5">
          <div className="mb-3">
            <h2 className="text-[15px] font-bold">Tren harian</h2>
            <p className="mt-0.5 text-[12.5px] text-money-muted">
              Pola masuk & keluar sepanjang {periodLabel}
            </p>
          </div>
          {loading ? (
            <p className="py-10 text-center text-[13px] text-money-faint">
              Memuat grafik…
            </p>
          ) : !hasData ? (
            <p className="py-10 text-center text-[13px] text-money-faint">
              Belum ada transaksi di periode ini.
            </p>
          ) : (
            <DailyTrendChart
              series={dailySeries}
              hoverDay={hoverDay}
              onHoverDay={setHoverDay}
            />
          )}
        </MoneyCard>

        <MoneyCard className="p-5">
          <div className="mb-3">
            <h2 className="text-[15px] font-bold">Cashflow kumulatif</h2>
            <p className="mt-0.5 text-[12.5px] text-money-muted">
              Saldo berjalan bulan ini — bukan saldo kantong, tapi total masuk
              dikurangi keluar dari tgl 1
            </p>
          </div>
          {loading || !hasData ? (
            <p className="py-8 text-center text-[13px] text-money-faint">
              {loading ? 'Memuat…' : 'Belum ada data.'}
            </p>
          ) : (
            <CashflowChart series={dailySeries} />
          )}
        </MoneyCard>

        <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
          <MoneyCard className="p-5">
            <div className="mb-4">
              <h2 className="text-[15px] font-bold">Pemasukan vs pengeluaran</h2>
              <p className="mt-0.5 text-[12.5px] text-money-muted">
                Banding total bulan ini
              </p>
            </div>
            {loading ? (
              <p className="py-8 text-center text-[13px] text-money-faint">
                Memuat…
              </p>
            ) : (
              <CompareBars income={incomeTotal} expense={expenseTotal} />
            )}
          </MoneyCard>

          <MoneyCard className="p-5">
            <div className="mb-4">
              <h2 className="text-[15px] font-bold">Hari pengeluaran tertinggi</h2>
              <p className="mt-0.5 text-[12.5px] text-money-muted">
                Titik evaluasi: kapan paling boros
              </p>
            </div>
            {loading ? (
              <p className="py-8 text-center text-[13px] text-money-faint">
                Memuat…
              </p>
            ) : topExpenseDays.length === 0 ? (
              <p className="py-8 text-center text-[13px] text-money-faint">
                Belum ada pengeluaran.
              </p>
            ) : (
              <ol className="space-y-3">
                {topExpenseDays.map((d, i) => (
                  <li
                    key={d.dateIso}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-money-soft text-[12px] font-extrabold text-money-muted">
                        {i + 1}
                      </span>
                      <div>
                        <div className="text-[13.5px] font-bold">
                          Tanggal {d.day}
                        </div>
                        <div className="text-[11px] text-money-faint">
                          Masuk {formatIdr(d.income)}
                        </div>
                      </div>
                    </div>
                    <div className="font-money-mono text-[14px] font-extrabold text-money-rose">
                      {formatIdr(d.expense)}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </MoneyCard>
        </div>

        <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
          <MoneyCard className="p-5">
            <div className="mb-4">
              <h2 className="text-[15px] font-bold">Per kantong</h2>
              <p className="mt-0.5 text-[12.5px] text-money-muted">
                Kantong mana yang paling banyak keluar
              </p>
            </div>
            {loading ? (
              <p className="py-8 text-center text-[13px] text-money-faint">
                Memuat…
              </p>
            ) : (
              <PocketBreakdown bars={pocketBars} />
            )}
          </MoneyCard>

          <MoneyCard className="p-5">
            <div className="mb-4">
              <h2 className="text-[15px] font-bold">Transfer & tarik tunai</h2>
              <p className="mt-0.5 text-[12.5px] text-money-muted">
                Arus internal (bukan pengeluaran)
              </p>
            </div>
            {loading ? (
              <p className="py-8 text-center text-[13px] text-money-faint">
                Memuat…
              </p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3 rounded-[12px] bg-money-soft/70 px-4 py-3">
                  <div>
                    <div className="text-[13px] font-bold">Transfer</div>
                    <div className="text-[11px] text-money-faint">
                      {moves.transferCount} transaksi
                    </div>
                  </div>
                  <div className="font-money-mono text-[15px] font-extrabold">
                    {formatIdr(moves.transferAmount)}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-[12px] bg-money-soft/70 px-4 py-3">
                  <div>
                    <div className="text-[13px] font-bold">Tarik tunai</div>
                    <div className="text-[11px] text-money-faint">
                      {moves.cashCount} transaksi
                    </div>
                  </div>
                  <div className="font-money-mono text-[15px] font-extrabold">
                    {formatIdr(moves.cashAmount)}
                  </div>
                </div>
              </div>
            )}
          </MoneyCard>
        </div>

        {showPersonBreakdown ? (
          <MoneyCard className="p-5">
            <div className="mb-4">
              <h2 className="text-[15px] font-bold">Per orang</h2>
              <p className="mt-0.5 text-[12.5px] text-money-muted">
                Kontribusi tiap person di periode yang sama
              </p>
            </div>
            <PersonBreakdown bars={personBars} />
          </MoneyCard>
        ) : null}

        <MoneyCard className="p-4">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-[15px] font-bold">Komposisi kategori</h2>
              <p className="mt-0.5 text-[12.5px] text-money-muted">
                Breakdown {kind === 'expense' ? 'pengeluaran' : 'pemasukan'}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <FilterChip
                label="Pengeluaran"
                active={kind === 'expense'}
                onClick={() => setKind('expense')}
              />
              <FilterChip
                label="Pemasukan"
                active={kind === 'income'}
                onClick={() => setKind('income')}
              />
            </div>
          </div>
        </MoneyCard>

        <MoneyCard className="flex flex-col items-center justify-center px-6 py-8">
          {loading ? (
            <p className="text-[13px] text-money-faint">Memuat grafik…</p>
          ) : allSlices.length === 0 ? (
            <p className="text-center text-[13px] text-money-faint">
              Belum ada {kind === 'expense' ? 'pengeluaran' : 'pemasukan'} di
              periode ini.
            </p>
          ) : (
            <>
              <DonutChart
                slices={allSlices}
                selectedKey={selectedKey}
                excludedKeys={activeExcludedKeys}
                countedTotal={categoryTotal}
                onSelect={setSelectedKey}
              />
              <p className="mt-3 text-center text-[12px] font-semibold text-money-faint">
                {kind === 'expense'
                  ? 'Komposisi pengeluaran'
                  : 'Komposisi pemasukan'}
              </p>
            </>
          )}
        </MoneyCard>

        <MoneyCard className="overflow-hidden">
          <div className="border-b border-money-border px-5 py-3">
            <h2 className="text-[15px] font-bold">Persentase per kategori</h2>
            <p className="mt-0.5 text-[12.5px] text-money-muted">
              {loading
                ? 'Memuat…'
                : allSlices.length > 0
                  ? `${allSlices.length} kategori · dihitung ${formatIdr(categoryTotal)}`
                  : 'Tidak ada data'}
              {activeExcluded.length > 0
                ? ` · ${activeExcluded.length} tidak dihitung`
                : ''}
            </p>
            {activeExcluded.length > 0 ? (
              <button
                type="button"
                onClick={restoreAllCategories}
                className="mt-1 text-[11.5px] font-bold text-money-brown-deep hover:underline"
              >
                Pulihkan semua
              </button>
            ) : null}
          </div>

          {allSlices.length === 0 && !loading ? (
            <div className="px-5 py-10 text-center text-sm text-money-faint">
              Ubah periode atau scope untuk melihat breakdown.
            </div>
          ) : (
            <ul className="divide-y divide-money-border">
              {allSlices.map((slice) => {
                const excluded = activeExcludedKeys.has(slice.key);
                const counted = slices.find((item) => item.key === slice.key);
                const active = !excluded && selectedKey === slice.key;
                const dimmed =
                  excluded || (selectedKey != null && !active);
                const displayPct = excluded
                  ? slice.pct
                  : (counted?.pct ?? slice.pct);
                return (
                  <li key={slice.key} className="flex items-stretch">
                    <button
                      type="button"
                      onClick={() => {
                        if (excluded) return;
                        setSelectedKey(active ? null : slice.key);
                      }}
                      className={[
                        'flex min-w-0 flex-1 flex-col gap-2 px-5 py-3.5 text-left transition-colors sm:flex-row sm:items-center sm:gap-4',
                        excluded
                          ? 'bg-money-soft/40'
                          : active
                            ? 'bg-money-brown-soft/50'
                            : 'hover:bg-money-soft/70',
                        dimmed ? 'opacity-40' : 'opacity-100',
                      ].join(' ')}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-2.5">
                        <span
                          className={[
                            'h-2.5 w-2.5 shrink-0 rounded-full transition-transform',
                            active ? 'scale-125' : '',
                          ].join(' ')}
                          style={{ backgroundColor: slice.color }}
                        />
                        <div className="min-w-0">
                          <div
                            className={[
                              'truncate text-[13.5px] font-bold',
                              excluded ? 'line-through' : '',
                            ].join(' ')}
                          >
                            {slice.label}
                          </div>
                          <div className="font-money-mono text-[12px] text-money-faint">
                            {formatIdr(slice.amount)}
                            {excluded ? ' · tidak dihitung' : ''}
                          </div>
                        </div>
                      </div>
                      <div className="w-full sm:w-[220px]">
                        <div className="mb-1 flex items-baseline justify-between gap-2">
                          <span
                            className={[
                              'font-money-mono text-[18px] font-extrabold tabular-nums',
                              excluded ? 'text-money-faint' : 'text-money-ink',
                            ].join(' ')}
                          >
                            {displayPct < 10
                              ? displayPct.toFixed(1)
                              : Math.round(displayPct)}
                            %
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-money-soft">
                          <div
                            className="h-full rounded-full transition-[width] duration-500"
                            style={{
                              width: `${Math.max(displayPct, 1.5)}%`,
                              backgroundColor: slice.color,
                            }}
                          />
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      title={
                        excluded
                          ? `Hitung lagi ${slice.label}`
                          : `Kecualikan ${slice.label} dari hitungan`
                      }
                      aria-label={
                        excluded
                          ? `Hitung lagi ${slice.label}`
                          : `Kecualikan ${slice.label} dari hitungan`
                      }
                      aria-pressed={excluded}
                      onClick={() =>
                        excluded
                          ? restoreCategory(slice.key)
                          : excludeCategory(slice)
                      }
                      className={[
                        'shrink-0 self-center px-3 py-2',
                        excluded
                          ? 'text-money-rose'
                          : 'text-money-faint hover:text-money-rose',
                      ].join(' ')}
                    >
                      <EyeOff size={16} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </MoneyCard>
      </div>
    </div>
  );
}
