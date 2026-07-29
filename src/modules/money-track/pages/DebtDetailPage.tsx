import { useEffect, useRef, useState } from 'react';
import { ArrowLeft } from 'react-feather';
import { Link, useParams } from 'react-router-dom';
import {
  fetchMoneyDebtById,
  type MoneyDebtApi,
  type MoneyDebtPaymentApi,
} from '@/modules/money-track/api/moneyApi';
import { DataSourceBanner } from '@/modules/money-track/components/DataSourceBanner';
import {
  MoneyCard,
  PageHeader,
} from '@/modules/money-track/components/PageChrome';
import { useMoneyTrackUi } from '@/modules/money-track/context/MoneyTrackUiContext';
import { formatIdr } from '@/modules/money-track/types';
import { ApiClientError } from '@/shared/lib/apiClient';
import { moneyPaths } from '@/shared/routes';

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

function formatDateLabel(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

type DetailView = {
  id: string;
  counterparty: string;
  directionLabel: string;
  remainingLabel: string;
  person: string;
  amount: number;
  paidTotal: number;
  remaining: number;
  status: 'open' | 'partial' | 'paid';
  dateLabel: string;
  dueLabel: string;
  note: string | null;
  payments: Array<{
    id: string;
    amount: number;
    dateLabel: string;
    note: string | null;
  }>;
};

function mapApiDetail(
  row: MoneyDebtApi,
  personName: string,
): DetailView {
  const isPiutang = row.direction === 'piutang';
  const paidTotal = row.paidTotal ?? 0;
  const remaining = row.remaining ?? Math.max(0, row.amount - paidTotal);
  const payments = (row.payments ?? []).map((p: MoneyDebtPaymentApi) => ({
    id: String(p.id),
    amount: p.amount,
    dateLabel: formatDateLabel(p.date),
    note: p.note,
  }));

  return {
    id: String(row.id),
    counterparty: row.counterpartyName,
    directionLabel: row.directionLabel ?? (isPiutang ? 'Piutang' : 'Utang'),
    remainingLabel:
      row.remainingLabel ?? (isPiutang ? 'Sisa piutang' : 'Sisa utang'),
    person: personName,
    amount: row.amount,
    paidTotal,
    remaining,
    status: row.status,
    dateLabel: formatDateLabel(row.date),
    dueLabel: row.dueDate ? formatDateLabel(row.dueDate) : '—',
    note: row.note,
    payments,
  };
}

export function DebtDetailPage() {
  const { debtId = '' } = useParams<{ debtId: string }>();
  const { dataSource, debts, data, openModal, activeModal } = useMoneyTrackUi();
  const [detail, setDetail] = useState<DetailView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const prevModalRef = useRef(activeModal);

  useEffect(() => {
    if (prevModalRef.current != null && activeModal == null) {
      setReloadToken((n) => n + 1);
    }
    prevModalRef.current = activeModal;
  }, [activeModal]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      if (!debtId) {
        setDetail(null);
        setError('Debt tidak ditemukan.');
        setLoading(false);
        return;
      }

      if (dataSource === 'dummy') {
        const row = debts.find((d) => String(d.id) === String(debtId));
        if (!row) {
          if (!cancelled) {
            setDetail(null);
            setError('Debt tidak ditemukan di data dummy.');
            setLoading(false);
          }
          return;
        }
        if (!cancelled) {
          setDetail({
            id: row.id,
            counterparty: row.counterparty,
            directionLabel: row.directionLabel,
            remainingLabel: row.remainingLabel,
            person: row.person,
            amount: row.amount,
            paidTotal: row.paidTotal,
            remaining: row.remaining,
            status: row.status,
            dateLabel: row.dateLabel,
            dueLabel: row.dueLabel,
            note: row.note,
            payments:
              row.paidTotal > 0
                ? [
                    {
                      id: `pay-${row.id}`,
                      amount: row.paidTotal,
                      dateLabel: row.dateLabel,
                      note: 'Ringkasan pembayaran (dummy)',
                    },
                  ]
                : [],
          });
          setLoading(false);
        }
        return;
      }

      try {
        const api = await fetchMoneyDebtById(debtId);
        const personName =
          data.persons.find((p) => p.id === String(api.personId))?.name ?? '—';
        if (!cancelled) {
          setDetail(mapApiDetail(api, personName));
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setDetail(null);
          setError(
            err instanceof ApiClientError
              ? err.message
              : 'Gagal memuat detail debt.',
          );
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [debtId, dataSource, debts, data.persons, reloadToken]);

  const paidPct =
    !detail || detail.amount === 0
      ? 0
      : Math.round((detail.paidTotal / detail.amount) * 100);

  return (
    <div>
      <DataSourceBanner />
      <div className="mb-4">
        <Link
          to={moneyPaths.debts}
          className="inline-flex items-center gap-1.5 text-[13px] font-bold text-money-muted hover:text-money-ink"
        >
          <ArrowLeft size={15} />
          Kembali ke daftar
        </Link>
      </div>

      <PageHeader
        title={detail?.counterparty ?? 'Detail debt'}
        description={
          detail
            ? `${detail.directionLabel} · ${detail.person}`
            : 'Riwayat & sisa pembayaran'
        }
        actions={
          detail && detail.status !== 'paid' ? (
            <button
              type="button"
              onClick={() =>
                openModal('debtPayment', {
                  debtId: detail.id,
                  debtLabel: detail.counterparty,
                })
              }
              className="inline-flex items-center gap-1.5 rounded-full bg-money-brown px-3.5 py-2 text-[13px] font-bold text-white hover:bg-money-brown-deep"
            >
              Catat pembayaran
            </button>
          ) : null
        }
      />

      {loading ? (
        <MoneyCard className="px-5 py-10 text-center text-sm text-money-faint">
          Memuat detail…
        </MoneyCard>
      ) : null}

      {!loading && error ? (
        <MoneyCard className="px-5 py-10 text-center text-sm text-money-rose">
          {error}
        </MoneyCard>
      ) : null}

      {!loading && detail ? (
        <div className="space-y-3.5">
          <MoneyCard className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      detail.directionLabel === 'Piutang'
                        ? 'bg-money-brown-soft text-money-brown-deep'
                        : 'bg-money-rose-soft text-money-rose'
                    }`}
                  >
                    {detail.directionLabel}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${statusTone(detail.status)}`}
                  >
                    {statusLabel(detail.status)}
                  </span>
                </div>
                <p className="mt-2 text-[12.5px] text-money-faint">
                  {detail.dateLabel} → jatuh tempo {detail.dueLabel}
                </p>
                {detail.note ? (
                  <p className="mt-1 text-[13px] text-money-muted">{detail.note}</p>
                ) : null}
              </div>
              <div className="text-right">
                <div className="text-[11px] font-bold uppercase text-money-faint">
                  {detail.remainingLabel}
                </div>
                <div className="font-money-mono text-xl font-extrabold text-money-ink">
                  {formatIdr(detail.remaining)}
                </div>
                <div className="mt-0.5 text-[11px] text-money-faint">
                  dari {formatIdr(detail.amount)}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-1 flex justify-between text-[11px] text-money-faint">
                <span>Terbayar {formatIdr(detail.paidTotal)}</span>
                <span>{paidPct}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-money-soft">
                <div
                  className="h-full rounded-full bg-money-brown"
                  style={{ width: `${Math.min(paidPct, 100)}%` }}
                />
              </div>
            </div>
          </MoneyCard>

          <MoneyCard className="overflow-hidden">
            <div className="border-b border-money-border px-5 py-3 text-[13px] font-bold">
              Riwayat pembayaran
            </div>
            {detail.payments.length === 0 ? (
              <div className="px-5 py-8 text-center text-[13px] text-money-faint">
                Belum ada pembayaran.
              </div>
            ) : (
              <ul className="divide-y divide-money-border">
                {detail.payments.map((pay) => (
                  <li
                    key={pay.id}
                    className="flex items-start justify-between gap-3 px-5 py-3.5"
                  >
                    <div>
                      <div className="text-[13px] font-bold text-money-ink">
                        {pay.dateLabel}
                      </div>
                      {pay.note ? (
                        <div className="mt-0.5 text-[12px] text-money-muted">
                          {pay.note}
                        </div>
                      ) : null}
                    </div>
                    <div className="font-money-mono text-[13px] font-extrabold text-money-brown-deep">
                      {formatIdr(pay.amount)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </MoneyCard>
        </div>
      ) : null}
    </div>
  );
}
