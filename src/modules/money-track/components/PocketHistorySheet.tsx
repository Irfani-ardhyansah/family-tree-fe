import { useEffect, useMemo, useState } from 'react';
import { Edit2 } from 'react-feather';
import { Link } from 'react-router-dom';
import {
  fetchMoneyActivity,
  mapActivityToUiTx,
  type MoneyUiTx,
} from '@/modules/money-track/api/moneyApi';
import {
  FilterChip,
  MoneyCard,
} from '@/modules/money-track/components/PageChrome';
import { MoneyListSkeleton } from '@/modules/money-track/components/MoneySkeleton';
import {
  MoneyModalShell,
  MoneyPrimaryButton,
} from '@/modules/money-track/components/modals/MoneyModalShell';
import { useMoneyTrackUi } from '@/modules/money-track/context/MoneyTrackUiContext';
import { formatIdr, type MoneyPocketCategory } from '@/modules/money-track/types';
import { moneyPaths } from '@/shared/routes';
import { ApiClientError } from '@/shared/lib/apiClient';

export type PocketHistoryTarget = {
  pocketId: string;
  pocketName: string;
  pocketCategory: MoneyPocketCategory;
  accountName: string;
  personName: string;
  balance: number;
};

type KindFilter = 'all' | 'income' | 'expense';

const PAGE_SIZE = 20;

function pocketTone(category: MoneyPocketCategory) {
  if (category === 'transaksi') return 'bg-money-blue-soft text-money-blue';
  if (category === 'tabungan') return 'bg-money-amber-soft text-money-amber';
  if (category === 'investasi') return 'bg-money-violet-soft text-money-violet';
  return 'bg-money-soft text-money-muted';
}

function kindTone(kind: string) {
  if (kind === 'income') return 'bg-money-brown-soft text-money-brown-deep';
  if (kind === 'transfer') return 'bg-money-violet-soft text-money-violet';
  if (kind === 'cash_withdrawal') return 'bg-money-amber-soft text-money-amber';
  return 'bg-money-rose-soft text-money-rose';
}

function kindLabel(kind: string) {
  if (kind === 'income') return 'Masuk';
  if (kind === 'expense') return 'Keluar';
  if (kind === 'transfer') return 'Transfer';
  return 'Tarik tunai';
}

function currentMonthRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
  return {
    from: `${year}-${month}-01`,
    to: `${year}-${month}-${String(lastDay).padStart(2, '0')}`,
    label: new Intl.DateTimeFormat('id-ID', {
      month: 'long',
      year: 'numeric',
    }).format(now),
  };
}

function matchesPocket(row: MoneyUiTx, pocketId: string) {
  return row.pocketId === pocketId || row.toPocketId === pocketId;
}

function filterRows(
  rows: MoneyUiTx[],
  pocketId: string,
  kind: KindFilter,
  limit: number,
) {
  return rows
    .filter((row) => {
      if (!matchesPocket(row, pocketId)) return false;
      if (kind === 'income' && row.kind !== 'income') return false;
      if (kind === 'expense' && row.kind !== 'expense') return false;
      return true;
    })
    .sort((a, b) => b.dateIso.localeCompare(a.dateIso))
    .slice(0, limit);
}

function sumMonth(rows: MoneyUiTx[], pocketId: string, from: string, to: string) {
  let income = 0;
  let expense = 0;
  for (const row of rows) {
    if (!matchesPocket(row, pocketId)) continue;
    if (row.dateIso < from || row.dateIso > to) continue;
    if (row.kind === 'income') income += row.amount;
    else if (row.kind === 'expense') expense += row.amount;
  }
  return { income, expense };
}

type PocketHistorySheetProps = {
  target: PocketHistoryTarget;
  onClose: () => void;
};

export function PocketHistorySheet({ target, onClose }: PocketHistorySheetProps) {
  const {
    dataSource,
    transactions,
    activityTick,
    openModal,
    scope,
  } = useMoneyTrackUi();

  const [kind, setKind] = useState<KindFilter>('all');
  const [rows, setRows] = useState<MoneyUiTx[]>([]);
  const [total, setTotal] = useState(0);
  const [monthSummary, setMonthSummary] = useState({ income: 0, expense: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const month = useMemo(() => currentMonthRange(), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      if (dataSource !== 'api') {
        const scoped = transactions.filter((row) => {
          if (scope !== 'all' && row.personId !== scope) return false;
          return true;
        });
        const filtered = filterRows(scoped, target.pocketId, kind, PAGE_SIZE);
        const summary = sumMonth(
          scoped,
          target.pocketId,
          month.from,
          month.to,
        );
        if (!cancelled) {
          setRows(filtered);
          setTotal(filtered.length);
          setMonthSummary(summary);
          setLoading(false);
        }
        return;
      }

      try {
        const [listResult, monthResult] = await Promise.all([
          fetchMoneyActivity({
            pocketId: target.pocketId,
            personId: scope !== 'all' ? scope : undefined,
            kind: kind === 'all' ? 'all' : kind,
            page: 1,
            pageSize: PAGE_SIZE,
          }),
          fetchMoneyActivity({
            pocketId: target.pocketId,
            personId: scope !== 'all' ? scope : undefined,
            from: month.from,
            to: month.to,
            page: 1,
            pageSize: 200,
          }),
        ]);
        if (cancelled) return;
        setRows(listResult.items.map(mapActivityToUiTx));
        setTotal(listResult.total);
        setMonthSummary(
          sumMonth(
            monthResult.items.map(mapActivityToUiTx),
            target.pocketId,
            month.from,
            month.to,
          ),
        );
      } catch (err) {
        if (!cancelled) {
          setRows([]);
          setTotal(0);
          setMonthSummary({ income: 0, expense: 0 });
          setError(
            err instanceof ApiClientError
              ? err.message
              : 'Gagal memuat riwayat kantong.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [
    dataSource,
    transactions,
    target.pocketId,
    kind,
    scope,
    activityTick,
    reloadToken,
    month.from,
    month.to,
  ]);

  const handleEdit = (row: MoneyUiTx) => {
    onClose();
    if (row.kind === 'income' || row.kind === 'expense') {
      openModal('transaction', {
        transactionId: row.id,
        txType: row.kind,
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
      activityKind: row.kind,
      activityTitle: row.title,
      txAmount: row.amount,
      txNote: row.title,
      txDateIso: row.dateIso,
      pocketId: row.pocketId,
      pocketName: row.pocket,
      fromPocketId: row.pocketId || undefined,
      toPocketId: row.toPocketId || undefined,
    });
  };

  return (
    <MoneyModalShell
      wide
      title={target.pocketName}
      subtitle={`${target.accountName} · ${target.personName}`}
      onClose={onClose}
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Link
            to={`${moneyPaths.transactions}?pocket=${encodeURIComponent(target.pocketId)}`}
            onClick={onClose}
            className="text-center text-[13px] font-bold text-money-brown-deep hover:underline sm:text-left"
          >
            Lihat semua di Transaksi →
          </Link>
          <MoneyPrimaryButton onClick={onClose}>Tutup</MoneyPrimaryButton>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ${pocketTone(target.pocketCategory)}`}
            >
              {target.pocketCategory.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wide text-money-faint">
                Saldo sekarang
              </div>
              <div className="font-money-mono text-lg font-extrabold">
                {formatIdr(target.balance)}
              </div>
            </div>
          </div>
          <div className="text-right text-[12px] text-money-muted">
            <div className="font-semibold text-money-ink">{month.label}</div>
            <div>
              Masuk{' '}
              <span className="font-money-mono font-bold text-money-brown-deep">
                +{formatIdr(monthSummary.income)}
              </span>
            </div>
            <div>
              Keluar{' '}
              <span className="font-money-mono font-bold text-money-rose">
                −{formatIdr(monthSummary.expense)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <FilterChip
            label="Semua"
            active={kind === 'all'}
            onClick={() => setKind('all')}
          />
          <FilterChip
            label="Masuk"
            active={kind === 'income'}
            onClick={() => setKind('income')}
          />
          <FilterChip
            label="Keluar"
            active={kind === 'expense'}
            onClick={() => setKind('expense')}
          />
        </div>

        {error ? (
          <div className="rounded-[10px] border border-money-rose/30 bg-money-rose-soft px-3 py-2.5 text-[12.5px] font-semibold text-money-rose">
            {error}
            <button
              type="button"
              onClick={() => setReloadToken((n) => n + 1)}
              className="ml-2 font-bold underline"
            >
              Coba lagi
            </button>
          </div>
        ) : null}

        <MoneyCard className="overflow-hidden">
          <div className="border-b border-money-border px-4 py-2.5 text-[12px] text-money-muted">
            {loading
              ? 'Memuat riwayat…'
              : total > PAGE_SIZE
                ? `${PAGE_SIZE} terbaru dari ${total} transaksi`
                : `${rows.length} transaksi`}
          </div>

          {loading ? (
            <MoneyListSkeleton rows={6} />
          ) : rows.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-[13px] text-money-faint">
                Belum ada transaksi di kantong ini.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openModal('transaction', {
                    pocketId: target.pocketId,
                    pocketName: target.pocketName,
                  });
                }}
                className="mt-3 text-[13px] font-bold text-money-brown-deep hover:underline"
              >
                Catat transaksi
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-money-border">
              {rows.map((row) => (
                <li
                  key={row.id}
                  className="flex items-start gap-2 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[12px] font-semibold text-money-muted">
                        {row.dateLabel}
                      </span>
                      <span
                        className={`inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-bold ${kindTone(row.kind)}`}
                      >
                        {kindLabel(row.kind)}
                      </span>
                    </div>
                    <div className="mt-0.5 truncate text-[13.5px] font-bold">
                      {row.title}
                    </div>
                    <div className="text-[12px] text-money-faint">
                      {row.category}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <div
                      className={[
                        'font-money-mono text-right text-[13px] font-extrabold',
                        row.kind === 'income' && 'text-money-brown-deep',
                        row.kind === 'expense' && 'text-money-rose',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {row.kind === 'income'
                        ? `+${formatIdr(row.amount)}`
                        : row.kind === 'expense'
                          ? `−${formatIdr(row.amount)}`
                          : formatIdr(row.amount)}
                    </div>
                    <button
                      type="button"
                      title="Edit"
                      onClick={() => handleEdit(row)}
                      className="rounded-lg p-1.5 text-money-muted hover:bg-money-soft hover:text-money-ink"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </MoneyCard>
      </div>
    </MoneyModalShell>
  );
}
