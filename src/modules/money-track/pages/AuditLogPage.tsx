import { useCallback, useEffect, useMemo, useState } from 'react';
import { Eye, Search, X } from 'react-feather';
import { useSearchParams } from 'react-router-dom';
import {
  fetchMoneyAuditLogDetail,
  fetchMoneyAuditLogs,
  type MoneyAuditAction,
  type MoneyAuditEntityType,
  type MoneyAuditLogApi,
} from '@/modules/money-track/api/moneyApi';
import { DataSourceBanner } from '@/modules/money-track/components/DataSourceBanner';
import { MoneyListSkeleton } from '@/modules/money-track/components/MoneySkeleton';
import {
  FieldInput,
  FieldLabel,
  FieldSelect,
} from '@/modules/money-track/components/modals/MoneyFormFields';
import {
  MoneyModalShell,
  MoneyPrimaryButton,
} from '@/modules/money-track/components/modals/MoneyModalShell';
import {
  FilterChip,
  MoneyCard,
  PageHeader,
} from '@/modules/money-track/components/PageChrome';
import { useMoneyTrackUi } from '@/modules/money-track/context/MoneyTrackUiContext';
import {
  formatDateOnlyLabel,
  toDateOnlyIso,
  todayDateOnlyIso,
} from '@/modules/money-track/lib/dateOnly';
import {
  getMoneyAuditMockById,
  listMoneyAuditMock,
} from '@/modules/money-track/mocks/auditMock';
import { ApiClientError } from '@/shared/lib/apiClient';

const PAGE_SIZE = 20;

const ENTITY_OPTIONS: { value: MoneyAuditEntityType | ''; label: string }[] = [
  { value: '', label: 'Semua entity' },
  { value: 'transaction', label: 'Transaksi' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'cash_withdrawal', label: 'Tarik tunai' },
  { value: 'opening_balance', label: 'Saldo awal' },
  { value: 'balancing_adjustment', label: 'Balancing' },
  { value: 'category', label: 'Kategori' },
  { value: 'pocket', label: 'Kantong' },
  { value: 'account', label: 'Account' },
  { value: 'debt', label: 'Utang/Piutang' },
  { value: 'debt_payment', label: 'Cicilan' },
];

const ACTION_OPTIONS: { value: MoneyAuditAction | ''; label: string }[] = [
  { value: '', label: 'Semua aksi' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
];

const ACTION_STYLES: Record<MoneyAuditAction, string> = {
  create: 'bg-money-brown-soft text-money-brown-deep',
  update: 'bg-money-blue-soft text-money-blue',
  delete: 'bg-money-rose-soft text-money-rose',
};

const ENTITY_LABEL: Record<MoneyAuditEntityType, string> = {
  transaction: 'Transaksi',
  transfer: 'Transfer',
  cash_withdrawal: 'Tarik tunai',
  opening_balance: 'Saldo awal',
  balancing_adjustment: 'Balancing',
  category: 'Kategori',
  pocket: 'Kantong',
  account: 'Account',
  debt: 'Utang/Piutang',
  debt_payment: 'Cicilan',
};

function isAuditEntityType(value: string): value is MoneyAuditEntityType {
  return value in ENTITY_LABEL;
}

function isAuditAction(value: string): value is MoneyAuditAction {
  return value === 'create' || value === 'update' || value === 'delete';
}

function formatAuditDateTime(iso: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}

function defaultFromDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return toDateOnlyIso(d);
}

export function AuditLogPage() {
  const { dataSource, data, scopeLabel } = useMoneyTrackUi();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialEntityType = searchParams.get('entityType') ?? '';
  const initialEntityId = searchParams.get('entityId') ?? '';

  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [actorPersonId, setActorPersonId] = useState('');
  const [entityType, setEntityType] = useState<MoneyAuditEntityType | ''>(
    isAuditEntityType(initialEntityType) ? initialEntityType : '',
  );
  const [entityId, setEntityId] = useState(initialEntityId);
  const [action, setAction] = useState<MoneyAuditAction | ''>('');
  const defaultPeriod = useMemo(
    () => ({ from: defaultFromDate(), to: todayDateOnlyIso() }),
    [],
  );
  const [fromDate, setFromDate] = useState(defaultPeriod.from);
  const [toDate, setToDate] = useState(defaultPeriod.to);
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<MoneyAuditLogApi[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<MoneyAuditLogApi | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => window.clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const et = searchParams.get('entityType') ?? '';
    const eid = searchParams.get('entityId') ?? '';
    if (isAuditEntityType(et)) setEntityType(et);
    if (eid) setEntityId(eid);
  }, [searchParams]);

  const actorFilterOptions = useMemo(() => {
    return data.persons.map((p, index) => {
      const numeric = /^\d+$/.test(p.id) ? p.id : String(index + 1);
      return { value: numeric, label: p.name };
    });
  }, [data.persons]);

  const queryPayload = useMemo(
    () => ({
      q: debouncedQ || undefined,
      actorPersonId: actorPersonId || undefined,
      entityType: entityType || undefined,
      entityId: entityId.trim() || undefined,
      action: action || undefined,
      from: fromDate || undefined,
      to: toDate || undefined,
      page,
      pageSize: PAGE_SIZE,
    }),
    [
      debouncedQ,
      actorPersonId,
      entityType,
      entityId,
      action,
      fromDate,
      toDate,
      page,
    ],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (dataSource === 'dummy') {
        const result = listMoneyAuditMock(queryPayload);
        setItems(result.items);
        setTotal(result.total);
      } else {
        const result = await fetchMoneyAuditLogs(queryPayload);
        setItems(result.items);
        setTotal(result.total);
      }
    } catch (err) {
      setItems([]);
      setTotal(0);
      setError(
        err instanceof ApiClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Gagal memuat audit log.',
      );
    } finally {
      setLoading(false);
    }
  }, [dataSource, queryPayload]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const hasFilters =
    debouncedQ !== '' ||
    actorPersonId !== '' ||
    entityType !== '' ||
    entityId.trim() !== '' ||
    action !== '' ||
    fromDate !== defaultPeriod.from ||
    toDate !== defaultPeriod.to;

  const clearFilters = () => {
    setQ('');
    setDebouncedQ('');
    setActorPersonId('');
    setEntityType('');
    setEntityId('');
    setAction('');
    setFromDate(defaultPeriod.from);
    setToDate(defaultPeriod.to);
    setPage(1);
    setSearchParams({}, { replace: true });
  };

  const openDetail = async (row: MoneyAuditLogApi) => {
    setDetail(row);
    setDetailLoading(true);
    try {
      if (dataSource === 'dummy') {
        setDetail(getMoneyAuditMockById(row.id) ?? row);
      } else {
        const full = await fetchMoneyAuditLogDetail(row.id);
        setDetail(full);
      }
    } catch {
      // keep list row payload
    } finally {
      setDetailLoading(false);
    }
  };

  const handleFromChange = (value: string) => {
    const iso = toDateOnlyIso(value);
    if (!iso) return;
    setFromDate(iso);
    setPage(1);
    if (iso > toDate) setToDate(iso);
  };

  const handleToChange = (value: string) => {
    const iso = toDateOnlyIso(value);
    if (!iso) return;
    setToDate(iso);
    setPage(1);
    if (iso < fromDate) setFromDate(iso);
  };

  return (
    <div>
      <DataSourceBanner />
      <PageHeader
        title="Audit Log"
        description={`Jejak perubahan Money Track ${scopeLabel} — siapa melakukan apa.`}
      />

      <MoneyCard className="mb-4 p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="md:col-span-2">
            <FieldLabel>Cari</FieldLabel>
            <div className="relative">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-money-faint"
              />
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder="Ringkasan, actor, entity id…"
                className="w-full rounded-[10px] border border-money-border bg-money-surface py-2.5 pl-9 pr-3 text-[13.5px] text-money-ink placeholder:text-money-faint focus:border-money-brown focus:outline-none focus:ring-1 focus:ring-money-brown"
              />
            </div>
          </div>
          <div>
            <FieldLabel>Siapa</FieldLabel>
            <FieldSelect
              value={actorPersonId}
              onChange={(v) => {
                setActorPersonId(v);
                setPage(1);
              }}
              options={[
                { value: '', label: 'Semua orang' },
                ...actorFilterOptions.map((p) => ({
                  value: p.value,
                  label: p.label,
                })),
              ]}
            />
          </div>
          <div>
            <FieldLabel>Entity</FieldLabel>
            <FieldSelect
              value={entityType}
              onChange={(v) => {
                setEntityType(
                  v && isAuditEntityType(v) ? v : '',
                );
                setPage(1);
              }}
              options={ENTITY_OPTIONS}
            />
          </div>
          <div>
            <FieldLabel>Entity ID</FieldLabel>
            <FieldInput
              value={entityId}
              onChange={(v) => {
                setEntityId(v);
                setPage(1);
              }}
              placeholder="opsional"
            />
          </div>
          <div>
            <FieldLabel>Aksi</FieldLabel>
            <FieldSelect
              value={action}
              onChange={(v) => {
                setAction(v && isAuditAction(v) ? v : '');
                setPage(1);
              }}
              options={ACTION_OPTIONS}
            />
          </div>
          <div>
            <FieldLabel>Dari tanggal</FieldLabel>
            <FieldInput
              type="date"
              value={fromDate}
              onChange={handleFromChange}
            />
          </div>
          <div>
            <FieldLabel>Sampai tanggal</FieldLabel>
            <FieldInput type="date" value={toDate} onChange={handleToChange} />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {(
            [
              ['', 'Semua'],
              ['create', 'Create'],
              ['update', 'Update'],
              ['delete', 'Delete'],
            ] as const
          ).map(([value, label]) => (
            <FilterChip
              key={value || 'all'}
              label={label}
              active={action === value}
              onClick={() => {
                setAction(value);
                setPage(1);
              }}
            />
          ))}
          {hasFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 rounded-full border border-money-border px-3 py-1.5 text-[12px] font-bold text-money-muted hover:bg-money-soft"
            >
              <X size={13} />
              Reset filter
            </button>
          ) : null}
        </div>
      </MoneyCard>

      {error ? (
        <div className="mb-4 rounded-[12px] border border-money-rose/30 bg-money-rose-soft px-4 py-3 text-[13px] font-semibold text-money-rose">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-full border border-money-rose/40 px-3 py-1 text-[12px] font-bold hover:bg-white/50"
            >
              Coba lagi
            </button>
          </div>
        </div>
      ) : null}

      <MoneyCard className="overflow-hidden">
        <div className="hidden grid-cols-[140px_1fr_110px_90px_1.4fr_72px] gap-3 border-b border-money-border bg-money-soft/70 px-5 py-2.5 text-[11px] font-bold uppercase tracking-wide text-money-faint md:grid">
          <span>Waktu</span>
          <span>Siapa</span>
          <span>Entity</span>
          <span>Aksi</span>
          <span>Ringkasan</span>
          <span className="text-right">Detail</span>
        </div>

        {loading && items.length === 0 ? (
          <MoneyListSkeleton rows={7} />
        ) : items.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-money-faint">
            Tidak ada audit log untuk filter ini
            {dataSource === 'api' ? ' (atau endpoint belum tersedia).' : '.'}
          </div>
        ) : (
          items.map((row) => (
            <div
              key={row.id}
              className="grid grid-cols-1 gap-2 border-t border-money-border px-5 py-3.5 first:border-t-0 md:grid-cols-[140px_1fr_110px_90px_1.4fr_72px] md:items-center md:gap-3"
            >
              <div className="text-[12.5px] font-semibold text-money-muted">
                {formatAuditDateTime(row.createdAt)}
              </div>
              <div className="min-w-0 truncate text-[13.5px] font-bold">
                {row.actorName}
              </div>
              <div className="text-[12.5px] text-money-muted">
                {ENTITY_LABEL[row.entityType] ?? row.entityType}
                <span className="text-money-faint"> · #{row.entityId}</span>
              </div>
              <div>
                <span
                  className={`inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-bold ${ACTION_STYLES[row.action]}`}
                >
                  {row.action}
                </span>
              </div>
              <div className="truncate text-[12.5px] text-money-ink">
                {row.summary}
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  title="Detail"
                  onClick={() => void openDetail(row)}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[12px] font-bold text-money-brown-deep hover:bg-money-soft"
                >
                  <Eye size={14} />
                  Detail
                </button>
              </div>
            </div>
          ))
        )}
      </MoneyCard>

      {total > 0 ? (
        <div className="mt-4 flex items-center justify-between text-[13px] text-money-muted">
          <p>
            {total} entri · halaman {page}/{totalPages}
            {fromDate && toDate
              ? ` · ${formatDateOnlyLabel(fromDate)} – ${formatDateOnlyLabel(toDate)}`
              : ''}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-[10px] border border-money-border px-3 py-1.5 font-bold hover:bg-money-soft disabled:opacity-40"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-[10px] border border-money-border px-3 py-1.5 font-bold hover:bg-money-soft disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}

      {detail ? (
        <MoneyModalShell
          title="Detail Audit"
          subtitle={detailLoading ? 'Memuat…' : detail.summary}
          onClose={() => setDetail(null)}
          wide
          footer={
            <MoneyPrimaryButton onClick={() => setDetail(null)}>
              Tutup
            </MoneyPrimaryButton>
          }
        >
          <dl className="space-y-3 text-[13px]">
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wide text-money-faint">
                Waktu
              </dt>
              <dd className="mt-0.5 font-semibold text-money-ink">
                {formatAuditDateTime(detail.createdAt)}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wide text-money-faint">
                Siapa
              </dt>
              <dd className="mt-0.5 font-semibold text-money-ink">
                {detail.actorName}
                {detail.actorPersonId != null
                  ? ` (person #${detail.actorPersonId})`
                  : ''}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wide text-money-faint">
                Entity
              </dt>
              <dd className="mt-0.5 text-money-ink">
                {ENTITY_LABEL[detail.entityType] ?? detail.entityType} #
                {detail.entityId}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wide text-money-faint">
                Aksi
              </dt>
              <dd className="mt-1">
                <span
                  className={`inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-bold ${ACTION_STYLES[detail.action]}`}
                >
                  {detail.action}
                </span>
              </dd>
            </div>
            <div>
              <dt className="mb-1 text-[11px] font-bold uppercase tracking-wide text-money-faint">
                Before
              </dt>
              <pre className="overflow-x-auto rounded-[10px] bg-money-ink px-3 py-2.5 text-[11px] text-money-soft">
                {JSON.stringify(detail.before ?? null, null, 2)}
              </pre>
            </div>
            <div>
              <dt className="mb-1 text-[11px] font-bold uppercase tracking-wide text-money-faint">
                After
              </dt>
              <pre className="overflow-x-auto rounded-[10px] bg-money-ink px-3 py-2.5 text-[11px] text-money-soft">
                {JSON.stringify(detail.after ?? null, null, 2)}
              </pre>
            </div>
          </dl>
        </MoneyModalShell>
      ) : null}
    </div>
  );
}
