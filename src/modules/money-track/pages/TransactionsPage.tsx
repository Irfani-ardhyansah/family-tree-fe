import { useMemo, useState } from 'react';
import { Plus } from 'react-feather';
import { DataSourceBanner } from '@/modules/money-track/components/DataSourceBanner';
import {
  FilterChip,
  MoneyCard,
  PageHeader,
  PeriodPill,
} from '@/modules/money-track/components/PageChrome';
import { useMoneyTrackUi } from '@/modules/money-track/context/MoneyTrackUiContext';
import { formatIdr } from '@/modules/money-track/types';

type KindFilter = 'all' | 'income' | 'expense' | 'transfer' | 'cash_withdrawal';

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

export function TransactionsPage() {
  const { data, scope, scopeLabel, transactions, openModal } = useMoneyTrackUi();
  const [kind, setKind] = useState<KindFilter>('all');

  const rows = useMemo(() => {
    return transactions.filter((row) => {
      if (scope !== 'all' && row.personId !== scope) return false;
      if (kind !== 'all' && row.kind !== kind) return false;
      return true;
    });
  }, [scope, kind, transactions]);

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const row of rows) {
      if (row.kind === 'income') income += row.amount;
      if (row.kind === 'expense') expense += row.amount;
    }
    return { income, expense };
  }, [rows]);

  return (
    <div>
      <DataSourceBanner />
      <PageHeader
        title="Transaksi"
        description={`Riwayat aktivitas ${scopeLabel} — ${data.periodLabel}`}
        actions={
          <>
            <PeriodPill label={data.periodLabel} />
            <button
              type="button"
              onClick={() => openModal('transaction')}
              className="inline-flex items-center gap-1.5 rounded-full bg-money-brown px-3.5 py-2 text-[13px] font-bold text-white hover:bg-money-brown-deep"
            >
              <Plus size={15} />
              Catat
            </button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
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
            onClick={() => setKind(value)}
          />
        ))}
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MiniStat label="Ditampilkan" value={`${rows.length} item`} />
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
        <div className="hidden grid-cols-[110px_1.4fr_1fr_1fr_140px] gap-3 border-b border-money-border bg-money-soft/70 px-5 py-2.5 text-[11px] font-bold uppercase tracking-wide text-money-faint md:grid">
          <span>Tanggal</span>
          <span>Judul</span>
          <span>Kategori / Person</span>
          <span>Kantong</span>
          <span className="text-right">Nominal</span>
        </div>
        {rows.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-money-faint">
            Tidak ada transaksi untuk filter / sumber data ini.
          </div>
        ) : (
          rows.map((row) => (
            <div
              key={row.id}
              className="grid grid-cols-1 gap-2 border-t border-money-border px-5 py-3.5 first:border-t-0 md:grid-cols-[110px_1.4fr_1fr_1fr_140px] md:items-center md:gap-3"
            >
              <div className="text-[12.5px] font-semibold text-money-muted">
                {row.dateLabel}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[13.5px] font-bold">{row.title}</div>
                <div className="mt-1 md:hidden">
                  <span
                    className={`inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-bold ${kindTone(row.kind)}`}
                  >
                    {kindLabel(row.kind)}
                  </span>
                </div>
              </div>
              <div className="text-[12.5px] text-money-muted">
                <span className="font-semibold text-money-ink">{row.category}</span>
                <span className="text-money-faint"> · {row.person}</span>
              </div>
              <div className="truncate text-[12.5px] text-money-faint">
                {row.pocket}
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
            </div>
          ))
        )}
      </MoneyCard>
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
