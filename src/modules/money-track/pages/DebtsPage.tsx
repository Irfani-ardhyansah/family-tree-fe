import { useMemo, useState } from 'react';
import { Edit2, Plus, Trash2 } from 'react-feather';
import { Link } from 'react-router-dom';
import { deleteMoneyDebt } from '@/modules/money-track/api/moneyApi';
import { DataSourceBanner } from '@/modules/money-track/components/DataSourceBanner';
import {
  FilterChip,
  MoneyCard,
  PageHeader,
} from '@/modules/money-track/components/PageChrome';
import { useMoneyTrackUi } from '@/modules/money-track/context/MoneyTrackUiContext';
import { formatIdr } from '@/modules/money-track/types';
import { ApiClientError } from '@/shared/lib/apiClient';
import { moneyPaths } from '@/shared/routes';

type StatusFilter = 'all' | 'open' | 'partial' | 'paid';
type DirectionFilter = 'all' | 'utang' | 'piutang';

function statusTone(status: string) {
  if (status === 'paid') return 'bg-money-brown-soft text-money-brown-deep';
  if (status === 'partial') return 'bg-money-amber-soft text-money-amber';
  return 'bg-money-rose-soft text-money-rose';
}

function statusLabel(status: string) {
  if (status === 'paid') return 'Lunas';
  if (status === 'partial') return 'Cicilan';
  return 'Belum lunas';
}

export function DebtsPage() {
  const {
    scope,
    scopeLabel,
    debts,
    openModal,
    dataSource,
    refreshApi,
    bumpActivity,
    removeDebt,
  } = useMoneyTrackUi();
  const [status, setStatus] = useState<StatusFilter>('all');
  const [direction, setDirection] = useState<DirectionFilter>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const rows = useMemo(() => {
    return debts.filter((row) => {
      if (scope !== 'all' && row.personId !== scope) return false;
      if (status !== 'all' && row.status !== status) return false;
      if (direction !== 'all' && row.direction !== direction) return false;
      return true;
    });
  }, [scope, status, direction, debts]);

  const summary = useMemo(() => {
    let piutang = 0;
    let utang = 0;
    for (const row of rows) {
      if (row.status === 'paid') continue;
      if (row.direction === 'piutang') piutang += row.remaining;
      else utang += row.remaining;
    }
    return { piutang, utang };
  }, [rows]);

  return (
    <div>
      <DataSourceBanner />
      <PageHeader
        title="Utang Piutang"
        description={`Catatan utang & piutang ${scopeLabel}, termasuk cicilan.`}
        actions={
          <button
            type="button"
            onClick={() => openModal('debt')}
            className="inline-flex items-center gap-1.5 rounded-full bg-money-brown px-3.5 py-2 text-[13px] font-bold text-white hover:bg-money-brown-deep"
          >
            <Plus size={15} />
            Tambah Catatan
          </button>
        }
      />

      {actionError ? (
        <div className="mb-3 rounded-[10px] border border-money-rose/30 bg-money-rose-soft px-3 py-2 text-[12.5px] font-semibold text-money-rose">
          {actionError}
        </div>
      ) : null}

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <MoneyCard className="px-5 py-4">
          <div className="text-[11px] font-bold uppercase tracking-wide text-money-faint">
            Sisa piutang
          </div>
          <div className="mt-1 font-money-mono text-xl font-extrabold text-money-brown-deep">
            {formatIdr(summary.piutang)}
          </div>
        </MoneyCard>
        <MoneyCard className="px-5 py-4">
          <div className="text-[11px] font-bold uppercase tracking-wide text-money-faint">
            Sisa utang
          </div>
          <div className="mt-1 font-money-mono text-xl font-extrabold text-money-rose">
            {formatIdr(summary.utang)}
          </div>
        </MoneyCard>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {(
          [
            ['all', 'Semua arah'],
            ['piutang', 'Piutang'],
            ['utang', 'Utang'],
          ] as const
        ).map(([value, label]) => (
          <FilterChip
            key={value}
            label={label}
            active={direction === value}
            onClick={() => setDirection(value)}
          />
        ))}
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ['all', 'Semua status'],
            ['open', 'Belum lunas'],
            ['partial', 'Cicilan'],
            ['paid', 'Lunas'],
          ] as const
        ).map(([value, label]) => (
          <FilterChip
            key={value}
            label={label}
            active={status === value}
            onClick={() => setStatus(value)}
          />
        ))}
      </div>

      <div className="space-y-3">
        {rows.map((row) => {
          const paidPct =
            row.amount === 0
              ? 0
              : Math.round((row.paidTotal / row.amount) * 100);
          return (
            <MoneyCard key={row.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[15px] font-bold">{row.counterparty}</h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        row.direction === 'piutang'
                          ? 'bg-money-brown-soft text-money-brown-deep'
                          : 'bg-money-rose-soft text-money-rose'
                      }`}
                    >
                      {row.directionLabel}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${statusTone(row.status)}`}
                    >
                      {statusLabel(row.status)}
                    </span>
                    {row.dueSoon && row.status !== 'paid' ? (
                      <span className="rounded-full bg-money-amber-soft px-2 py-0.5 text-[11px] font-bold text-money-amber">
                        Jatuh tempo dekat
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-[12.5px] text-money-faint">
                    {row.person} · {row.dateLabel} → jatuh tempo {row.dueLabel}
                  </p>
                  {row.note ? (
                    <p className="mt-1 text-[12.5px] text-money-muted">{row.note}</p>
                  ) : null}
                </div>
                <div className="text-right">
                  <div className="font-money-mono text-[15px] font-extrabold">
                    {formatIdr(row.remaining)}
                  </div>
                  <div className="text-[11px] text-money-faint">
                    {row.remainingLabel} dari {formatIdr(row.amount)}
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <div className="mb-1 flex justify-between text-[11px] text-money-faint">
                  <span>Terbayar {formatIdr(row.paidTotal)}</span>
                  <span>{paidPct}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-money-soft">
                  <div
                    className="h-full rounded-full bg-money-brown"
                    style={{ width: `${Math.min(paidPct, 100)}%` }}
                  />
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {row.status !== 'paid' ? (
                  <button
                    type="button"
                    onClick={() =>
                      openModal('debtPayment', {
                        debtId: row.id,
                        debtLabel: row.counterparty,
                      })
                    }
                    className="rounded-full bg-money-brown px-3 py-1.5 text-[12px] font-bold text-white hover:bg-money-brown-deep"
                  >
                    Catat pembayaran
                  </button>
                ) : null}
                <Link
                  to={moneyPaths.debtDetail(row.id)}
                  className="rounded-full border border-money-border px-3 py-1.5 text-[12px] font-bold text-money-muted hover:bg-money-soft"
                >
                  Detail
                </Link>
                <button
                  type="button"
                  title="Edit"
                  disabled={busyId === row.id}
                  onClick={() =>
                    openModal('debt', {
                      debtId: row.id,
                      debtCounterparty: row.counterparty,
                      debtDirection: row.direction,
                      debtAmount: row.amount,
                      debtPersonId: row.personId,
                      debtDateIso: row.dateIso,
                      debtDueDateIso: row.dueDateIso,
                      debtNote: row.note,
                    })
                  }
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
                          `Hapus catatan "${row.counterparty}"? Riwayat pembayaran juga ikut terhapus.`,
                        )
                      ) {
                        return;
                      }
                      setBusyId(row.id);
                      setActionError(null);
                      try {
                        if (dataSource === 'api') {
                          await deleteMoneyDebt(row.id);
                          await refreshApi();
                          bumpActivity();
                        } else {
                          removeDebt(row.id);
                        }
                      } catch (err) {
                        setActionError(
                          err instanceof ApiClientError
                            ? err.message
                            : err instanceof Error
                              ? err.message
                              : 'Gagal menghapus catatan.',
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
            </MoneyCard>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <MoneyCard className="mt-3 px-5 py-10 text-center text-sm text-money-faint">
          Tidak ada catatan untuk filter / sumber data ini.
        </MoneyCard>
      ) : null}
    </div>
  );
}
