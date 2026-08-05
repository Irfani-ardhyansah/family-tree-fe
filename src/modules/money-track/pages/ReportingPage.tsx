import { useEffect, useMemo, useState } from 'react';
import {
  fetchMoneyActivity,
  mapActivityToUiTx,
  type MoneyUiTx,
} from '@/modules/money-track/api/moneyApi';
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
import { formatIdr } from '@/modules/money-track/types';
import { ApiClientError } from '@/shared/lib/apiClient';

type ReportKind = 'expense' | 'income';

type CategorySlice = {
  key: string;
  label: string;
  amount: number;
  pct: number;
  color: string;
};

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

/** Palet netral (hindari ungu default AI). */
const SLICE_COLORS = [
  '#6b5344',
  '#c06a5f',
  '#3d6b5a',
  '#c9a227',
  '#4a6fa5',
  '#8b5e3c',
  '#5c7a6e',
  '#b85c38',
  '#6e7f8d',
  '#9a7b4f',
];

function monthRange(year: string, month: string) {
  const y = Number(year);
  const m = Number(month);
  const lastDay = new Date(y, m, 0).getDate();
  return {
    fromDate: `${year}-${month}-01`,
    toDate: `${year}-${month}-${String(lastDay).padStart(2, '0')}`,
  };
}

function buildYearOptions(centerYear: number) {
  const years: { value: string; label: string }[] = [];
  for (let y = centerYear + 1; y >= centerYear - 5; y -= 1) {
    years.push({ value: String(y), label: String(y) });
  }
  return years;
}

function buildCategorySlices(rows: MoneyUiTx[]): CategorySlice[] {
  const totals = new Map<string, { label: string; amount: number }>();
  for (const row of rows) {
    const key = row.categoryId ?? row.category ?? 'uncategorized';
    const label =
      row.category?.trim() ||
      (row.categoryId ? `Kategori ${row.categoryId}` : 'Tanpa kategori');
    const prev = totals.get(key);
    totals.set(key, {
      label: prev?.label ?? label,
      amount: (prev?.amount ?? 0) + row.amount,
    });
  }

  const grand = [...totals.values()].reduce((s, r) => s + r.amount, 0);
  if (grand <= 0) return [];

  return [...totals.entries()]
    .map(([key, row], index) => ({
      key,
      label: row.label,
      amount: row.amount,
      pct: (row.amount / grand) * 100,
      color: SLICE_COLORS[index % SLICE_COLORS.length],
    }))
    .sort((a, b) => b.amount - a.amount);
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
  // Full circle: SVG arc can't draw 360° as one sweep — use near-full + close.
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

function DonutChart({
  slices,
  selectedKey,
  onSelect,
}: {
  slices: CategorySlice[];
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
}) {
  const size = 240;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 96;
  const innerR = 58;
  const explode = 12;
  const total = slices.reduce((s, x) => s + x.amount, 0);
  const selected = slices.find((s) => s.key === selectedKey) ?? null;

  let angle = 0;
  const segments = slices.map((slice) => {
    const start = angle;
    const sweep = (slice.pct / 100) * 360;
    const end = start + sweep;
    const mid = start + sweep / 2;
    angle = end;
    const active = selectedKey === slice.key;
    const dimmed = selectedKey != null && !active;
    const dx = active ? Math.cos(((mid - 90) * Math.PI) / 180) * explode : 0;
    const dy = active ? Math.sin(((mid - 90) * Math.PI) / 180) * explode : 0;
    return { slice, start, end, mid, active, dimmed, dx, dy };
  });

  return (
    <div className="relative mx-auto h-[240px] w-[240px]">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={outerR + 2} fill="#efeae3" />
        {segments.map(({ slice, start, end, active, dimmed, dx, dy }) => (
          <g
            key={slice.key}
            className="cursor-pointer"
            style={{
              transform: `translate(${dx}px, ${dy}px)`,
              opacity: dimmed ? 0.32 : 1,
              transition: 'transform 320ms ease-out, opacity 280ms ease-out',
              filter: active
                ? 'drop-shadow(0 4px 8px rgba(31, 42, 31, 0.22))'
                : 'none',
            }}
            role="button"
            tabIndex={0}
            aria-label={`${slice.label} ${slice.pct.toFixed(1)} persen`}
            aria-pressed={active}
            onClick={() => onSelect(active ? null : slice.key)}
            onKeyDown={(e) => {
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
        {/* Lubang tengah agar label tetap terbaca */}
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
              {formatIdr(total)}
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

export function ReportingPage() {
  const {
    scope,
    scopeLabel,
    dataSource,
    transactions,
    activityTick,
  } = useMoneyTrackUi();

  const now = new Date();
  const [month, setMonth] = useState(
    String(now.getMonth() + 1).padStart(2, '0'),
  );
  const [year, setYear] = useState(String(now.getFullYear()));
  const [kind, setKind] = useState<ReportKind>('expense');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const yearOptions = useMemo(
    () => buildYearOptions(now.getFullYear()),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fixed around first mount year
    [],
  );

  const { fromDate, toDate } = useMemo(
    () => monthRange(year, month),
    [year, month],
  );
  const periodLabel =
    `${MONTH_OPTIONS.find((m) => m.value === month)?.label ?? month} ${year}`;

  const [apiRows, setApiRows] = useState<MoneyUiTx[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (dataSource !== 'api') return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchMoneyActivity({
          kind,
          personId: scope !== 'all' ? scope : undefined,
          from: fromDate,
          to: toDate,
          pageSize: 200,
          page: 1,
        });
        if (!cancelled) {
          setApiRows(result.items.map(mapActivityToUiTx));
        }
      } catch (err) {
        if (!cancelled) {
          setApiRows([]);
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
  }, [dataSource, kind, scope, fromDate, toDate, activityTick]);

  const rows = useMemo(() => {
    if (dataSource === 'api') return apiRows;
    return transactions.filter((row) => {
      if (row.kind !== kind) return false;
      if (scope !== 'all' && row.personId !== scope) return false;
      if (row.dateIso < fromDate || row.dateIso > toDate) return false;
      return true;
    });
  }, [dataSource, apiRows, transactions, kind, scope, fromDate, toDate]);

  const slices = useMemo(() => buildCategorySlices(rows), [rows]);
  const total = slices.reduce((s, x) => s + x.amount, 0);

  useEffect(() => {
    setSelectedKey(null);
  }, [kind, scope, fromDate, toDate]);

  useEffect(() => {
    if (selectedKey && !slices.some((s) => s.key === selectedKey)) {
      setSelectedKey(null);
    }
  }, [slices, selectedKey]);

  return (
    <div>
      <DataSourceBanner />
      <PageHeader
        title="Reporting"
        description={`Persentase per kategori — ${scopeLabel} · ${periodLabel}`}
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
          <div className="flex flex-wrap gap-1.5 pb-0.5">
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

      {error ? (
        <div className="mb-4 rounded-[10px] border border-money-rose/30 bg-money-rose-soft px-3 py-2 text-[12.5px] font-semibold text-money-rose">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-[280px_1fr]">
        <MoneyCard className="flex flex-col items-center justify-center p-6">
          {loading ? (
            <p className="text-[13px] text-money-faint">Memuat grafik…</p>
          ) : slices.length === 0 ? (
            <p className="text-center text-[13px] text-money-faint">
              Belum ada {kind === 'expense' ? 'pengeluaran' : 'pemasukan'} di
              periode ini.
            </p>
          ) : (
            <>
              <DonutChart
                slices={slices}
                selectedKey={selectedKey}
                onSelect={setSelectedKey}
              />
              <p className="mt-3 text-center text-[12px] font-semibold text-money-faint">
                {kind === 'expense' ? 'Komposisi pengeluaran' : 'Komposisi pemasukan'}
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
                : total > 0
                  ? `${slices.length} kategori · total ${formatIdr(total)}`
                  : 'Tidak ada data'}
            </p>
          </div>

          {slices.length === 0 && !loading ? (
            <div className="px-5 py-10 text-center text-sm text-money-faint">
              Ubah periode atau scope untuk melihat breakdown.
            </div>
          ) : (
            <ul className="divide-y divide-money-border">
              {slices.map((slice) => {
                const active = selectedKey === slice.key;
                const dimmed = selectedKey != null && !active;
                return (
                  <li key={slice.key}>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedKey(active ? null : slice.key)
                      }
                      className={[
                        'flex w-full flex-col gap-2 px-5 py-3.5 text-left transition-colors sm:flex-row sm:items-center sm:gap-4',
                        active
                          ? 'bg-money-brown-soft/50'
                          : 'hover:bg-money-soft/70',
                        dimmed ? 'opacity-45' : 'opacity-100',
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
                          <div className="truncate text-[13.5px] font-bold">
                            {slice.label}
                          </div>
                          <div className="font-money-mono text-[12px] text-money-faint">
                            {formatIdr(slice.amount)}
                          </div>
                        </div>
                      </div>
                      <div className="w-full sm:w-[220px]">
                        <div className="mb-1 flex items-baseline justify-between gap-2">
                          <span className="font-money-mono text-[18px] font-extrabold tabular-nums text-money-ink">
                            {slice.pct < 10
                              ? slice.pct.toFixed(1)
                              : Math.round(slice.pct)}
                            %
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-money-soft">
                          <div
                            className="h-full rounded-full transition-[width] duration-500"
                            style={{
                              width: `${Math.max(slice.pct, 1.5)}%`,
                              backgroundColor: slice.color,
                            }}
                          />
                        </div>
                      </div>
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
