import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DataSourceBanner } from '@/modules/money-track/components/DataSourceBanner';
import {
  MoneyCard,
  PageHeader,
} from '@/modules/money-track/components/PageChrome';
import {
  FieldInput,
  FieldLabel,
  MoneyAmountInput,
} from '@/modules/money-track/components/modals/MoneyFormFields';
import { parseIdrDigits } from '@/modules/money-track/components/modals/modalTypes';
import { useMoneyTrackUi } from '@/modules/money-track/context/MoneyTrackUiContext';
import {
  dateFromFormInput,
  todayDateOnlyIso,
} from '@/modules/money-track/lib/dateOnly';
import { formatIdr } from '@/modules/money-track/types';
import { moneyPaths } from '@/shared/routes';
import { ApiClientError } from '@/shared/lib/apiClient';

function todayIso() {
  return todayDateOnlyIso();
}

export function OpeningBalancesPage() {
  const navigate = useNavigate();
  const {
    scope,
    scopeLabel,
    dataSource,
    submitOpeningBalances,
    needsOpeningBalancesUi,
    pendingOpeningPockets,
  } = useMoneyTrackUi();

  const pockets = useMemo(() => {
    return pendingOpeningPockets.filter((p) => {
      if (scope === 'all') return true;
      return p.personId === scope;
    });
  }, [pendingOpeningPockets, scope]);

  const [date, setDate] = useState(todayIso);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pocketIdsKey = pockets.map((p) => p.id).join('|');

  useEffect(() => {
    setAmounts((prev) => {
      const next: Record<string, string> = {};
      for (const p of pockets) {
        next[p.id] = prev[p.id] ?? '';
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pocketIdsKey
  }, [pocketIdsKey]);

  const filledCount = pockets.filter(
    (p) => (amounts[p.id] ?? '').replace(/\D/g, '').length > 0,
  ).length;
  const total = pockets.reduce(
    (sum, p) => sum + parseIdrDigits(amounts[p.id] ?? ''),
    0,
  );

  const handleSave = async () => {
    if (pockets.length === 0) return;
    if (!date) {
      setError('Tanggal mulai pencatatan wajib diisi.');
      return;
    }

    const lines = pockets.map((p) => {
      const amount = parseIdrDigits(amounts[p.id] ?? '');
      return `• ${p.name} (${p.accountName}) — ${formatIdr(amount)}`;
    });
    const confirmed = window.confirm(
      [
        `Yakin simpan saldo awal untuk ${pockets.length} kantong?`,
        '',
        'Cek lagi sebelum lanjut — proses ini sekali per kantong dan tidak bisa diulang dari halaman ini.',
        '',
        `Tanggal: ${date}`,
        ...lines,
        '',
        'Lanjutkan simpan?',
      ].join('\n'),
    );
    if (!confirmed) return;

    const formDateIso = dateFromFormInput(date);
    setSaving(true);
    setError(null);
    try {
      await submitOpeningBalances({
        date: formDateIso,
        items: pockets.map((p) => ({
          pocketId: p.id,
          amount: parseIdrDigits(amounts[p.id] ?? ''),
        })),
      });
      navigate(moneyPaths.pockets);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Gagal menyimpan saldo awal.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <DataSourceBanner />
      <PageHeader
        title="Saldo Awal"
        description={`Isi saldo riil untuk kantong yang belum punya opening balance (${scopeLabel}).`}
        actions={
          <Link
            to={moneyPaths.pockets}
            className="rounded-full border border-money-border bg-money-surface px-3.5 py-2 text-[13px] font-bold text-money-muted hover:bg-money-soft"
          >
            Ke Kantong
          </Link>
        }
      />

      {needsOpeningBalancesUi ? (
        <div className="mb-4 rounded-[10px] border border-money-amber/35 bg-money-amber-soft px-4 py-2.5 text-[12.5px] text-[#7a561f]">
          Hanya kantong yang belum diisi yang tampil di sini. Setelah semua
          tersimpan, menu Saldo Awal akan hilang. Pocket baru nanti muncul lagi
          di list ini.
        </div>
      ) : null}

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MoneyCard className="px-5 py-4">
          <div className="text-[11px] font-bold uppercase tracking-wide text-money-faint">
            Belum diisi
          </div>
          <div className="mt-1 font-money-mono text-xl font-extrabold">
            {pockets.length}
          </div>
        </MoneyCard>
        <MoneyCard className="px-5 py-4">
          <div className="text-[11px] font-bold uppercase tracking-wide text-money-faint">
            Ada nominal
          </div>
          <div className="mt-1 font-money-mono text-xl font-extrabold">
            {filledCount}
          </div>
        </MoneyCard>
        <MoneyCard className="px-5 py-4">
          <div className="text-[11px] font-bold uppercase tracking-wide text-money-faint">
            Total
          </div>
          <div className="mt-1 font-money-mono text-xl font-extrabold">
            {formatIdr(total)}
          </div>
        </MoneyCard>
      </div>

      {pockets.length === 0 ? (
        <MoneyCard className="px-5 py-10 text-center text-sm text-money-faint">
          {pendingOpeningPockets.length === 0 ? (
            <>
              Semua kantong sudah punya saldo awal. Menu Saldo Awal akan
              disembunyikan. Kalau nanti ada pocket baru, menu ini muncul lagi.
            </>
          ) : (
            <>
              Tidak ada kantong pending di scope ini. Ganti filter orang, atau
              tambah pocket di{' '}
              <Link
                to={moneyPaths.pockets}
                className="font-bold text-money-brown-deep underline"
              >
                Kantong
              </Link>
              .
            </>
          )}
        </MoneyCard>
      ) : (
        <>
          <MoneyCard className="mb-4 px-5 py-4">
            <FieldLabel>Tanggal mulai pencatatan</FieldLabel>
            <FieldInput type="date" value={date} onChange={setDate} />
            <p className="mt-1.5 text-[12px] text-money-faint">
              Tanggal dipakai untuk transaksi opening balance.
              {dataSource === 'dummy'
                ? ' (mode dummy — hanya update saldo lokal)'
                : ''}
            </p>
          </MoneyCard>

          <MoneyCard className="overflow-hidden">
            <div className="divide-y divide-money-border">
              {pockets.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="truncate text-[13.5px] font-bold text-money-ink">
                      {p.name}
                    </div>
                    <div className="truncate text-[12px] text-money-faint">
                      {p.personName} · {p.accountName}
                    </div>
                  </div>
                  <div className="w-full sm:w-48">
                    <MoneyAmountInput
                      value={amounts[p.id] ?? ''}
                      onChange={(digits) =>
                        setAmounts((prev) => ({ ...prev, [p.id]: digits }))
                      }
                      placeholder="0"
                    />
                  </div>
                </div>
              ))}
            </div>
          </MoneyCard>
        </>
      )}

      {error ? (
        <div className="mt-4 rounded-[10px] border border-money-rose/30 bg-money-rose-soft px-4 py-2.5 text-[12.5px] font-semibold text-money-rose">
          {error}
        </div>
      ) : null}

      {pockets.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
            className="rounded-full bg-money-brown px-5 py-2.5 text-[13px] font-bold text-white hover:bg-money-brown-deep disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Menyimpan…' : 'Simpan Saldo Awal'}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => navigate(moneyPaths.home)}
            className="rounded-full border border-money-border bg-money-surface px-4 py-2.5 text-[13px] font-bold text-money-muted hover:bg-money-soft"
          >
            Nanti saja
          </button>
        </div>
      ) : null}
    </div>
  );
}
