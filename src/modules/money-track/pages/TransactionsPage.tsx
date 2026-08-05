import { useEffect, useMemo, useState } from 'react';
import { Edit2, Plus, Trash2, X } from 'react-feather';
import {
  deleteMoneyCashWithdrawal,
  deleteMoneyTransaction,
  deleteMoneyTransfer,
  fetchMoneyActivity,
  mapActivityToUiTx,
  type MoneyUiTx,
} from '@/modules/money-track/api/moneyApi';
import { DataSourceBanner } from '@/modules/money-track/components/DataSourceBanner';
import {
  FieldInput,
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

type KindFilter = 'all' | 'income' | 'expense' | 'transfer' | 'cash_withdrawal';

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

function kindTone(kind: string) {
  if (kind === 'income') return 'bg-money-brown-soft text-money-brown-deep';
  if (kind === 'transfer') return 'bg-money-violet-soft text-money-violet';
  if (kind === 'cash_withdrawal') return 'bg-money-amber-soft text-money-amber';
  return 'bg-money-rose-soft text-money-rose';
}

function kindLabel(kind: string) {
  if (kind === 'income') return 'Income';
  if (kind === 'expense') return 'Expense';
  if (kind === 'transfer') return 'Transfer';
  return 'Tarik tunai';
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

function monthRange(year: string, month: string) {
  const y = Number(year);
  const m = Number(month);
  const lastDay = new Date(y, m, 0).getDate();
  const fromDate = `${year}-${month}-01`;
  const toDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
  return { fromDate, toDate };
}

function buildYearOptions(centerYear: number) {
  const years: { value: string; label: string }[] = [];
  for (let y = centerYear + 1; y >= centerYear - 5; y -= 1) {
    years.push({ value: String(y), label: String(y) });
  }
  return years;
}

export function TransactionsPage() {
  const {
    scope,
    scopeLabel,
    transactions,
    accounts,
    categories,
    openModal,
    dataSource,
    activityTick,
    bumpActivity,
    refreshApi,
    removeTransaction,
  } = useMoneyTrackUi();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'));
  const [year, setYear] = useState(String(now.getFullYear()));
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
    MONTH_OPTIONS.find((m) => m.value === month)?.label != null
      ? `${MONTH_OPTIONS.find((m) => m.value === month)!.label} ${year}`
      : `${month}/${year}`;

  const [kind, setKind] = useState<KindFilter>('all');
  const [categoryId, setCategoryId] = useState('all');
  const [pocketId, setPocketId] = useState('all');
  const [query, setQuery] = useState('');

  const debouncedQuery = useDebouncedValue(query.trim(), 300);

  const [apiRows, setApiRows] = useState<MoneyUiTx[]>([]);
  const [apiTotal, setApiTotal] = useState(0);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const pocketOptions = useMemo(() => {
    const list: { value: string; label: string }[] = [];
    for (const acc of accounts) {
      for (const p of acc.pockets) {
        list.push({
          value: p.id,
          label: `${p.name} — ${acc.personName} (${acc.name})`,
        });
      }
    }
    return list;
  }, [accounts]);

  const categoryOptions = useMemo(() => {
    return categories
      .filter((c) => {
        if (kind === 'income' || kind === 'expense') return c.type === kind;
        return true;
      })
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [categories, kind]);

  const hasExtraFilters =
    categoryId !== 'all' || pocketId !== 'all' || query.trim() !== '';

  useEffect(() => {
    if (dataSource !== 'api') return;

    let cancelled = false;
    async function load() {
      setApiLoading(true);
      setApiError(null);
      try {
        const result = await fetchMoneyActivity({
          kind,
          personId: scope !== 'all' ? scope : undefined,
          pocketId: pocketId !== 'all' ? pocketId : undefined,
          categoryId:
            categoryId !== 'all' && categoryId !== 'uncategorized'
              ? categoryId
              : undefined,
          uncategorized: categoryId === 'uncategorized' ? true : undefined,
          from: fromDate,
          to: toDate,
          q: debouncedQuery || undefined,
          pageSize: 50,
          page: 1,
        });
        if (!cancelled) {
          setApiRows(result.items.map(mapActivityToUiTx));
          setApiTotal(result.total);
        }
      } catch (err) {
        if (!cancelled) {
          setApiRows([]);
          setApiTotal(0);
          setApiError(
            err instanceof ApiClientError
              ? err.message
              : 'Gagal memuat transaksi.',
          );
        }
      } finally {
        if (!cancelled) setApiLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [
    dataSource,
    kind,
    scope,
    pocketId,
    categoryId,
    fromDate,
    toDate,
    debouncedQuery,
    activityTick,
  ]);

  const rows = useMemo(() => {
    if (dataSource === 'api') return apiRows;

    const q = query.trim().toLowerCase();
    return transactions.filter((row) => {
      if (scope !== 'all' && row.personId !== scope) return false;
      if (kind !== 'all' && row.kind !== kind) return false;
      if (categoryId === 'uncategorized') {
        if (row.categoryId != null) return false;
      } else if (categoryId !== 'all' && row.categoryId !== categoryId) {
        return false;
      }
      if (pocketId !== 'all' && row.pocketId !== pocketId) return false;
      if (row.dateIso < fromDate) return false;
      if (row.dateIso > toDate) return false;
      if (q) {
        const hay =
          `${row.title} ${row.category} ${row.person} ${row.pocket}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [
    dataSource,
    apiRows,
    transactions,
    scope,
    kind,
    categoryId,
    pocketId,
    fromDate,
    toDate,
    query,
  ]);

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const row of rows) {
      if (row.kind === 'income') income += row.amount;
      if (row.kind === 'expense') expense += row.amount;
    }
    return { income, expense };
  }, [rows]);

  const clearFilters = () => {
    setKind('all');
    setCategoryId('all');
    setPocketId('all');
    setQuery('');
    setMonth(String(now.getMonth() + 1).padStart(2, '0'));
    setYear(String(now.getFullYear()));
  };

  const shownCountLabel =
    dataSource === 'api' && apiTotal > rows.length
      ? `${rows.length} / ${apiTotal} item`
      : `${rows.length} item`;

  return (
    <div>
      <DataSourceBanner />
      <PageHeader
        title="Transaksi"
        description={`Riwayat aktivitas ${scopeLabel} — ${periodLabel}`}
        actions={
          <button
            type="button"
            onClick={() => openModal('transaction')}
            className="inline-flex items-center gap-1.5 rounded-full bg-money-brown px-3.5 py-2 text-[13px] font-bold text-white hover:bg-money-brown-deep"
          >
            <Plus size={15} />
            Catat
          </button>
        }
      />

      <MoneyCard className="mb-4 p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div>
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
          <div>
            <FieldLabel>Tahun</FieldLabel>
            <FieldSelect
              value={year}
              onChange={setYear}
              options={yearOptions}
            />
          </div>
          <div className="md:col-span-2">
            <FieldLabel>Cari</FieldLabel>
            <FieldInput
              value={query}
              onChange={setQuery}
              placeholder="Judul, kategori, person, kantong…"
            />
          </div>
          <div>
            <FieldLabel>Kategori</FieldLabel>
            <FieldSelect
              value={categoryId}
              onChange={setCategoryId}
              options={[
                { value: 'all', label: 'Semua kategori' },
                { value: 'uncategorized', label: 'Tanpa kategori' },
                ...categoryOptions.map((c) => ({
                  value: c.id,
                  label: c.name,
                })),
              ]}
            />
          </div>
          <div>
            <FieldLabel>Kantong</FieldLabel>
            <FieldSelect
              value={pocketId}
              onChange={setPocketId}
              options={[
                { value: 'all', label: 'Semua kantong' },
                ...pocketOptions,
              ]}
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {(
            [
              ['all', 'Semua'],
              ['income', 'Pemasukan'],
              ['expense', 'Pengeluaran'],
              ['transfer', 'Transfer'],
              ['cash_withdrawal', 'Tarik tunai'],
            ] as const
          ).map(([value, label]) => (
            <FilterChip
              key={value}
              label={label}
              active={kind === value}
              onClick={() => {
                setKind(value);
                if (
                  (value === 'income' || value === 'expense') &&
                  categoryId !== 'all' &&
                  categoryId !== 'uncategorized'
                ) {
                  const stillValid = categories.some(
                    (c) => c.id === categoryId && c.type === value,
                  );
                  if (!stillValid) setCategoryId('all');
                }
              }}
            />
          ))}
          {(kind !== 'all' ||
            hasExtraFilters ||
            month !== String(now.getMonth() + 1).padStart(2, '0') ||
            year !== String(now.getFullYear())) && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 rounded-full border border-money-border px-3 py-1.5 text-[12px] font-bold text-money-muted hover:bg-money-soft"
            >
              <X size={13} />
              Reset filter
            </button>
          )}
        </div>
      </MoneyCard>

      {apiError || actionError ? (
        <div className="mb-4 rounded-[12px] border border-money-rose/30 bg-money-rose-soft px-4 py-3 text-[13px] font-semibold text-money-rose">
          {actionError ?? apiError}
        </div>
      ) : null}

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MiniStat
          label={apiLoading ? 'Memuat…' : 'Ditampilkan'}
          value={shownCountLabel}
        />
        <MiniStat
          label="Pemasukan (filter)"
          value={formatIdr(totals.income)}
          tone="pos"
        />
        <MiniStat
          label="Pengeluaran (filter)"
          value={formatIdr(totals.expense)}
          tone="neg"
        />
      </div>

      <MoneyCard className="overflow-hidden">
        <div className="hidden grid-cols-[110px_1.3fr_1fr_1fr_120px_72px] gap-3 border-b border-money-border bg-money-soft/70 px-5 py-2.5 text-[11px] font-bold uppercase tracking-wide text-money-faint md:grid">
          <span>Tanggal</span>
          <span>Judul</span>
          <span>Kategori / Person</span>
          <span>Kantong</span>
          <span className="text-right">Nominal</span>
          <span className="text-right">Aksi</span>
        </div>
        {rows.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-money-faint">
            {apiLoading
              ? 'Memuat transaksi…'
              : 'Tidak ada transaksi untuk filter / sumber data ini.'}
          </div>
        ) : (
          rows.map((row) => {
            const isTxn = row.kind === 'income' || row.kind === 'expense';
            return (
              <div
                key={row.id}
                className="grid grid-cols-1 gap-2 border-t border-money-border px-5 py-3.5 first:border-t-0 md:grid-cols-[110px_1.3fr_1fr_1fr_120px_72px] md:items-center md:gap-3"
              >
                <div className="text-[12.5px] font-semibold text-money-muted">
                  {row.dateLabel}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[13.5px] font-bold">
                    {row.title}
                  </div>
                  <div className="mt-1 md:hidden">
                    <span
                      className={`inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-bold ${kindTone(row.kind)}`}
                    >
                      {kindLabel(row.kind)}
                    </span>
                  </div>
                </div>
                <div className="text-[12.5px] text-money-muted">
                  <span className="font-semibold text-money-ink">
                    {row.category}
                  </span>
                  <span className="text-money-faint"> · {row.person}</span>
                </div>
                <div className="min-w-0 text-[12.5px] text-money-faint">
                  {row.kind === 'transfer' || row.kind === 'cash_withdrawal' ? (
                    <TransferPocketLabel value={row.pocket} />
                  ) : (
                    <span className="truncate block">{row.pocket}</span>
                  )}
                </div>
                <div
                  className={[
                    'font-money-mono text-right text-[13.5px] font-extrabold',
                    row.kind === 'income' && 'text-money-brown-deep',
                    row.kind === 'expense' && 'text-money-rose',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {row.kind === 'income'
                    ? `+${formatIdr(row.amount)}`
                    : row.kind === 'expense'
                      ? `-${formatIdr(row.amount)}`
                      : formatIdr(row.amount)}
                </div>
                <div className="flex items-center justify-end gap-0.5">
                  <button
                    type="button"
                    title="Edit"
                    disabled={busyId === row.id}
                    onClick={() => {
                      if (isTxn) {
                        openModal('transaction', {
                          transactionId: row.id,
                          txType: row.kind as 'income' | 'expense',
                          txAmount: row.amount,
                          txCategoryId: row.categoryId,
                          pocketId: row.pocketId,
                          pocketName: row.pocket,
                          txNote: row.title,
                          txDateIso: row.dateIso,
                        });
                        return;
                      }
                      openModal('activityEdit', {
                        activityId: row.id,
                        activityKind: row.kind as
                          | 'transfer'
                          | 'cash_withdrawal',
                        activityTitle: row.title,
                        txAmount: row.amount,
                        txNote: row.title,
                        txDateIso: row.dateIso,
                        pocketId: row.pocketId,
                        pocketName: row.pocket,
                        fromPocketId: row.pocketId || undefined,
                        toPocketId: row.toPocketId || undefined,
                      });
                    }}
                    className="rounded-lg p-1.5 text-money-muted hover:bg-money-soft hover:text-money-ink disabled:opacity-40"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    type="button"
                    title="Hapus"
                    disabled={busyId === row.id}
                    onClick={() => {
                      void (async () => {
                        if (
                          !window.confirm(
                            `Hapus "${row.title}"? Tidak bisa dibatalkan.`,
                          )
                        ) {
                          return;
                        }
                        setBusyId(row.id);
                        setActionError(null);
                        try {
                          if (dataSource === 'api') {
                            if (row.kind === 'transfer') {
                              await deleteMoneyTransfer(row.id);
                            } else if (row.kind === 'cash_withdrawal') {
                              await deleteMoneyCashWithdrawal(row.id);
                            } else {
                              await deleteMoneyTransaction(row.id);
                            }
                            await refreshApi();
                            bumpActivity();
                          } else {
                            removeTransaction(row.id);
                          }
                        } catch (err) {
                          setActionError(
                            err instanceof ApiClientError
                              ? err.message
                              : err instanceof Error
                                ? err.message
                                : 'Gagal menghapus.',
                          );
                        } finally {
                          setBusyId(null);
                        }
                      })();
                    }}
                    className="rounded-lg p-1.5 text-money-muted hover:bg-money-rose-soft hover:text-money-rose disabled:opacity-40"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </MoneyCard>
    </div>
  );
}

/** Tampilkan "asal → tujuan" dengan tujuan lebih jelas di list. */
function TransferPocketLabel({ value }: { value: string }) {
  const parts = value.split(/\s*→\s*|\s*->\s*/);
  if (parts.length < 2) {
    return <span className="block truncate">{value}</span>;
  }
  const from = parts[0]?.trim() || '—';
  const to = parts.slice(1).join(' → ').trim() || '—';
  return (
    <div className="min-w-0 leading-snug">
      <div className="truncate text-money-muted">{from}</div>
      <div className="truncate font-semibold text-money-ink">
        <span className="mr-1 font-normal text-money-faint">→</span>
        {to}
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'pos' | 'neg';
}) {
  return (
    <MoneyCard className="px-4 py-3">
      <div className="text-[11px] font-bold uppercase tracking-wide text-money-faint">
        {label}
      </div>
      <div
        className={[
          'mt-1 font-money-mono text-[17px] font-extrabold',
          tone === 'pos' && 'text-money-brown-deep',
          tone === 'neg' && 'text-money-rose',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {value}
      </div>
    </MoneyCard>
  );
}
