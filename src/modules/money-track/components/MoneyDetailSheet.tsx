import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchMoneyActivity,
  mapActivityToUiTx,
  type MoneyUiDebt,
  type MoneyUiTx,
} from '@/modules/money-track/api/moneyApi';
import { MoneyListSkeleton } from '@/modules/money-track/components/MoneySkeleton';
import {
  MoneyModalShell,
  MoneyPrimaryButton,
} from '@/modules/money-track/components/modals/MoneyModalShell';
import { useMoneyTrackUi } from '@/modules/money-track/context/MoneyTrackUiContext';
import { categoryKeyFromTx } from '@/modules/money-track/lib/reportingCalc';
import { formatIdr } from '@/modules/money-track/types';
import { ApiClientError } from '@/shared/lib/apiClient';
import { moneyPaths } from '@/shared/routes';

const PAGE_SIZE = 50;

export type MoneyActivityDetailRequest = {
  mode: 'activity';
  title: string;
  subtitle: string;
  from: string;
  to: string;
  personId?: string;
  kind?: 'income' | 'expense';
  categoryId?: string;
  uncategorized?: boolean;
  /** Cocokkan baris dummy / saringan kategori yang dikecualikan. */
  categoryKey?: string;
  pocketId?: string;
  pocketLabel?: string;
  excludeCategoryKeys?: string[];
};

export type MoneyDebtDetailRequest = {
  mode: 'debts';
  title: string;
  subtitle: string;
};

export type MoneyDetailRequest =
  | MoneyActivityDetailRequest
  | MoneyDebtDetailRequest;

function isExcluded(row: MoneyUiTx, keys: ReadonlySet<string>): boolean {
  if (keys.size === 0) return false;
  if (row.categoryId && keys.has(row.categoryId)) return true;
  if (keys.has(categoryKeyFromTx(row))) return true;
  if (row.category && keys.has(row.category)) return true;
  return false;
}

function matchesActivity(
  row: MoneyUiTx,
  request: MoneyActivityDetailRequest,
  exclude: ReadonlySet<string>,
): boolean {
  if (request.personId && row.personId !== request.personId) return false;
  if (row.dateIso < request.from || row.dateIso > request.to) return false;
  if (request.kind && row.kind !== request.kind) return false;
  if (!request.kind && row.kind !== 'income' && row.kind !== 'expense') {
    return false;
  }
  if (request.uncategorized) {
    if (row.categoryId != null) return false;
    if (
      request.categoryKey &&
      request.categoryKey !== 'uncategorized' &&
      categoryKeyFromTx(row) !== request.categoryKey
    ) {
      return false;
    }
  } else if (request.categoryKey) {
    if (categoryKeyFromTx(row) !== request.categoryKey) return false;
  }
  if (request.pocketId) {
    if (row.pocketId !== request.pocketId && row.toPocketId !== request.pocketId) {
      return false;
    }
  } else if (request.pocketLabel) {
    if (row.pocket !== request.pocketLabel) return false;
  }
  if (isExcluded(row, exclude)) return false;
  return true;
}

function amountClass(kind: string): string {
  if (kind === 'income') return 'text-money-brown-deep';
  if (kind === 'expense') return 'text-money-rose';
  return 'text-money-ink';
}

function kindMark(kind: string): string {
  if (kind === 'income') return '↑';
  if (kind === 'expense') return '↓';
  return '•';
}

function kindIconClass(kind: string): string {
  if (kind === 'income') return 'bg-money-brown-soft text-money-brown-deep';
  if (kind === 'expense') return 'bg-money-rose-soft text-money-rose';
  return 'bg-money-soft text-money-muted';
}

function ActivityRows({ rows }: { rows: MoneyUiTx[] }) {
  return (
    <ul>
      {rows.map((row) => (
        <li
          key={row.id}
          className="flex items-center gap-2.5 border-t border-money-border py-2.5 first:border-t-0 first:pt-0"
        >
          <div
            className={[
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[12px] font-bold',
              kindIconClass(row.kind),
            ].join(' ')}
          >
            {kindMark(row.kind)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold">
              {row.title || row.category}
            </div>
            <div className="truncate text-[11px] text-money-faint">
              {row.dateLabel} · {row.category} · {row.pocket}
            </div>
          </div>
          <div
            className={[
              'font-money-mono shrink-0 text-[13.5px] font-bold',
              amountClass(row.kind),
            ].join(' ')}
          >
            {row.kind === 'income'
              ? `+${formatIdr(row.amount)}`
              : row.kind === 'expense'
                ? `−${formatIdr(row.amount)}`
                : formatIdr(row.amount)}
          </div>
        </li>
      ))}
    </ul>
  );
}

function DebtRows({
  rows,
  onClose,
}: {
  rows: MoneyUiDebt[];
  onClose: () => void;
}) {
  const groups = [
    {
      key: 'utang' as const,
      label: 'Utang',
      tone: 'text-money-rose',
      sign: '−',
    },
    {
      key: 'piutang' as const,
      label: 'Piutang',
      tone: 'text-money-brown-deep',
      sign: '+',
    },
  ];

  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const items = rows.filter((row) => row.direction === group.key);
        const total = items.reduce((sum, row) => sum + row.remaining, 0);
        return (
          <section key={group.key}>
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <h3 className="text-[13px] font-bold">{group.label}</h3>
              <span className={`font-money-mono text-[13px] font-extrabold ${group.tone}`}>
                {group.sign}
                {formatIdr(total)}
              </span>
            </div>
            {items.length === 0 ? (
              <p className="text-[12.5px] text-money-faint">
                Tidak ada {group.label.toLowerCase()} terbuka.
              </p>
            ) : (
              <ul>
                {items.map((row) => (
                  <li
                    key={row.id}
                    className="border-t border-money-border first:border-t-0"
                  >
                    <Link
                      to={moneyPaths.debtDetail(row.id)}
                      onClick={onClose}
                      className="flex items-center gap-2.5 py-2.5 hover:opacity-80"
                    >
                      <div
                        className={[
                          'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold',
                          group.key === 'utang'
                            ? 'bg-money-rose-soft text-money-rose'
                            : 'bg-money-brown-soft text-money-brown-deep',
                        ].join(' ')}
                      >
                        {group.key === 'utang' ? '↓' : '↑'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-semibold">
                          {row.counterparty}
                        </div>
                        <div className="truncate text-[11px] text-money-faint">
                          {row.person}
                          {row.dueLabel ? ` · jatuh tempo ${row.dueLabel}` : ''}
                          {row.status === 'partial' ? ' · cicilan' : ''}
                        </div>
                      </div>
                      <div
                        className={`font-money-mono shrink-0 text-[13.5px] font-bold ${group.tone}`}
                      >
                        {group.sign}
                        {formatIdr(row.remaining)}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

export function MoneyDetailSheet({
  request,
  onClose,
}: {
  request: MoneyDetailRequest;
  onClose: () => void;
}) {
  const { dataSource, transactions, debts, scope, activityTick } =
    useMoneyTrackUi();
  const [rows, setRows] = useState<MoneyUiTx[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(request.mode === 'activity');
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exclude = useMemo(
    () =>
      new Set(
        request.mode === 'activity' ? (request.excludeCategoryKeys ?? []) : [],
      ),
    [request],
  );

  const openDebts = useMemo(() => {
    if (request.mode !== 'debts') return [];
    return debts
      .filter((row) => {
        if (scope !== 'all' && row.personId !== scope) return false;
        return row.status !== 'paid';
      })
      .sort((a, b) => b.remaining - a.remaining);
  }, [request.mode, debts, scope]);

  useEffect(() => {
    if (request.mode !== 'activity') return;
    let cancelled = false;

    if (dataSource !== 'api') {
      const filtered = transactions
        .filter((row) => matchesActivity(row, request, exclude))
        .sort((a, b) => b.dateIso.localeCompare(a.dateIso) || a.title.localeCompare(b.title));
      setRows(filtered);
      setTotal(filtered.length);
      setPage(1);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setPage(1);
    void (async () => {
      try {
        const result = await fetchMoneyActivity({
          personId: request.personId,
          pocketId: request.pocketId,
          categoryId: request.uncategorized ? undefined : request.categoryId,
          kind: request.kind,
          from: request.from,
          to: request.to,
          uncategorized: request.uncategorized,
          page: 1,
          pageSize: PAGE_SIZE,
        });
        if (cancelled) return;
        const mapped = result.items
          .map(mapActivityToUiTx)
          .filter((row) => matchesActivity(row, request, exclude));
        setRows(mapped);
        setTotal(result.total);
      } catch (err) {
        if (cancelled) return;
        setRows([]);
        setTotal(0);
        setError(
          err instanceof ApiClientError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Gagal memuat rincian.',
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [request, dataSource, transactions, exclude, activityTick]);

  const hasMore =
    request.mode === 'activity' &&
    dataSource === 'api' &&
    page * PAGE_SIZE < total;

  const listedSum = rows.reduce((sum, row) => sum + row.amount, 0);

  const loadMore = async () => {
    if (request.mode !== 'activity' || loadingMore || !hasMore) return;
    const next = page + 1;
    setLoadingMore(true);
    setError(null);
    try {
      const result = await fetchMoneyActivity({
        personId: request.personId,
        pocketId: request.pocketId,
        categoryId: request.uncategorized ? undefined : request.categoryId,
        kind: request.kind,
        from: request.from,
        to: request.to,
        uncategorized: request.uncategorized,
        page: next,
        pageSize: PAGE_SIZE,
      });
      const mapped = result.items
        .map(mapActivityToUiTx)
        .filter((row) => matchesActivity(row, request, exclude));
      setRows((prev) => {
        const seen = new Set(prev.map((row) => row.id));
        return [...prev, ...mapped.filter((row) => !seen.has(row.id))];
      });
      setTotal(result.total);
      setPage(next);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Gagal memuat rincian.',
      );
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <MoneyModalShell
      title={request.title}
      subtitle={request.subtitle}
      onClose={onClose}
      wide
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {request.mode === 'activity' && request.pocketId ? (
            <Link
              to={`${moneyPaths.transactions}?pocket=${encodeURIComponent(request.pocketId)}`}
              onClick={onClose}
              className="text-center text-[13px] font-bold text-money-brown-deep hover:underline sm:text-left"
            >
              Lihat di Transaksi →
            </Link>
          ) : request.mode === 'debts' ? (
            <Link
              to={moneyPaths.debts}
              onClick={onClose}
              className="text-center text-[13px] font-bold text-money-brown-deep hover:underline sm:text-left"
            >
              Buka halaman Utang Piutang →
            </Link>
          ) : (
            <span />
          )}
          <MoneyPrimaryButton onClick={onClose}>Tutup</MoneyPrimaryButton>
        </div>
      }
    >
      {request.mode === 'debts' ? (
        openDebts.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-money-faint">
            Tidak ada utang atau piutang terbuka.
          </p>
        ) : (
          <DebtRows rows={openDebts} onClose={onClose} />
        )
      ) : (
        <div>
          {error ? (
            <div className="mb-3 rounded-[10px] border border-money-rose/30 bg-money-rose-soft px-3 py-2 text-[12.5px] font-semibold text-money-rose">
              {error}
            </div>
          ) : null}

          {loading ? (
            <MoneyListSkeleton rows={6} />
          ) : rows.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-money-faint">
              Tidak ada transaksi untuk filter ini.
            </p>
          ) : (
            <>
              <div className="mb-2 flex items-baseline justify-between gap-2 text-[11px] font-semibold text-money-faint">
                <span>
                  {rows.length}
                  {hasMore ? ` dari ${total}` : ''} transaksi
                </span>
                <span className="font-money-mono">
                  {hasMore ? 'termuat ' : ''}
                  {formatIdr(listedSum)}
                </span>
              </div>
              <ActivityRows rows={rows} />
              {hasMore ? (
                <button
                  type="button"
                  onClick={() => void loadMore()}
                  disabled={loadingMore}
                  className="mt-3 w-full rounded-[10px] bg-money-soft px-3 py-2 text-[13px] font-bold text-money-ink hover:bg-money-brown-soft disabled:opacity-50"
                >
                  {loadingMore ? 'Memuat…' : 'Muat lagi'}
                </button>
              ) : null}
            </>
          )}
        </div>
      )}
    </MoneyModalShell>
  );
}
