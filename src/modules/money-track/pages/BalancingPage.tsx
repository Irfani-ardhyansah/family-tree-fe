import { useEffect, useMemo, useState } from 'react';
import { DataSourceBanner } from '@/modules/money-track/components/DataSourceBanner';
import {
  MoneyCard,
  PageHeader,
} from '@/modules/money-track/components/PageChrome';
import {
  formatInputIdr,
  sanitizeIdrDigits,
} from '@/modules/money-track/components/modals/modalTypes';
import { useMoneyTrackUi } from '@/modules/money-track/context/MoneyTrackUiContext';
import { formatIdr } from '@/modules/money-track/types';

export function BalancingPage() {
  const { scope, scopeLabel, balancing, openModal } = useMoneyTrackUi();
  const [actuals, setActuals] = useState<Record<string, string>>({});

  useEffect(() => {
    const init: Record<string, string> = {};
    for (const row of balancing) {
      init[row.id] = String(row.actual);
    }
    setActuals(init);
  }, [balancing]);

  const rows = useMemo(() => {
    return balancing.filter((row) => {
      if (scope === 'all') return true;
      if (row.personId === null) return true;
      return row.personId === scope;
    });
  }, [scope, balancing]);

  const computed = rows.map((row) => {
    const actualRaw = actuals[row.id] ?? String(row.recorded);
    const actual = Number(String(actualRaw).replace(/\D/g, '')) || 0;
    const diff = actual - row.recorded;
    return { ...row, actual, diff };
  });

  const mismatchCount = computed.filter((r) => r.diff !== 0).length;
  const totalAbsDiff = computed.reduce((s, r) => s + Math.abs(r.diff), 0);

  return (
    <div>
      <DataSourceBanner />
      <PageHeader
        title="Balancing"
        description={`Cocokkan saldo tercatat vs saldo riil untuk ${scopeLabel}.`}
        actions={
          <button
            type="button"
            className="rounded-full border border-money-border bg-money-surface px-3.5 py-2 text-[13px] font-bold text-money-muted hover:bg-money-soft"
            onClick={() => {
              const init: Record<string, string> = {};
              for (const row of balancing) {
                init[row.id] = String(row.recorded);
              }
              setActuals(init);
            }}
          >
            Reset ke tercatat
          </button>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MoneyCard className="px-5 py-4">
          <div className="text-[11px] font-bold uppercase tracking-wide text-money-faint">
            Pocket dicek
          </div>
          <div className="mt-1 font-money-mono text-xl font-extrabold">
            {computed.length}
          </div>
        </MoneyCard>
        <MoneyCard className="px-5 py-4">
          <div className="text-[11px] font-bold uppercase tracking-wide text-money-faint">
            Tidak sinkron
          </div>
          <div
            className={[
              'mt-1 font-money-mono text-xl font-extrabold',
              mismatchCount > 0 ? 'text-money-amber' : 'text-money-brown-deep',
            ].join(' ')}
          >
            {mismatchCount}
          </div>
        </MoneyCard>
        <MoneyCard className="px-5 py-4">
          <div className="text-[11px] font-bold uppercase tracking-wide text-money-faint">
            Total |selisih|
          </div>
          <div className="mt-1 font-money-mono text-xl font-extrabold">
            {formatIdr(totalAbsDiff)}
          </div>
        </MoneyCard>
      </div>

      {computed.length === 0 ? (
        <MoneyCard className="px-5 py-10 text-center text-sm text-money-faint">
          Belum ada pocket untuk di-balancing pada sumber data ini.
        </MoneyCard>
      ) : (
        <>
          {mismatchCount > 0 ? (
            <div className="mb-4 rounded-[10px] border border-[#edd9ad] bg-money-amber-soft px-4 py-3 text-[13px] text-[#7a561f]">
              Ada selisih di {mismatchCount} kantong. Perbaiki transaksi yang
              tertinggal, atau buat <b>adjustment</b> dengan catatan wajib.
            </div>
          ) : (
            <div className="mb-4 rounded-[10px] border border-[#cfd8e2] bg-money-brown-soft px-4 py-3 text-[13px] text-money-brown-deep">
              Semua kantong di tampilan ini sinkron dengan saldo riil.
            </div>
          )}

          <MoneyCard className="overflow-hidden">
            <div className="hidden grid-cols-[1.3fr_1fr_1fr_1fr_160px] gap-3 border-b border-money-border bg-money-soft/70 px-5 py-2.5 text-[11px] font-bold uppercase tracking-wide text-money-faint lg:grid">
              <span>Kantong</span>
              <span className="text-right">Tercatat</span>
              <span className="text-right">Saldo riil</span>
              <span className="text-right">Selisih</span>
              <span className="text-right">Aksi</span>
            </div>

            {computed.map((row) => {
              const hasDiff = row.diff !== 0;
              return (
                <div
                  key={row.id}
                  className="grid grid-cols-1 gap-3 border-t border-money-border px-5 py-4 first:border-t-0 lg:grid-cols-[1.3fr_1fr_1fr_1fr_160px] lg:items-center"
                >
                  <div>
                    <div className="text-[14px] font-bold">
                      {row.pocketName}
                      {hasDiff ? (
                        <span className="ml-2 rounded bg-money-amber-soft px-1.5 py-0.5 text-[10px] font-bold text-money-amber">
                          Selisih
                        </span>
                      ) : (
                        <span className="ml-2 rounded bg-money-brown-soft px-1.5 py-0.5 text-[10px] font-bold text-money-brown-deep">
                          OK
                        </span>
                      )}
                    </div>
                    <div className="text-[12px] text-money-faint">
                      {row.person} · {row.accountName}
                    </div>
                  </div>

                  <div className="lg:text-right">
                    <div className="text-[11px] font-bold uppercase text-money-faint lg:hidden">
                      Tercatat
                    </div>
                    <div className="font-money-mono text-[13.5px] font-bold">
                      {formatIdr(row.recorded)}
                    </div>
                  </div>

                  <div className="lg:text-right">
                    <div className="text-[11px] font-bold uppercase text-money-faint lg:hidden">
                      Saldo riil
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatInputIdr(actuals[row.id] ?? '')}
                      placeholder="0"
                      onChange={(e) => {
                        const digits = sanitizeIdrDigits(e.target.value);
                        setActuals((prev) => ({ ...prev, [row.id]: digits }));
                      }}
                      className={[
                        'font-money-mono w-full rounded-lg border px-2.5 py-1.5 text-[13.5px] font-bold outline-none placeholder:font-medium placeholder:text-money-faint lg:text-right',
                        hasDiff
                          ? 'border-money-amber bg-money-amber-soft/40 focus:border-money-amber'
                          : 'border-money-border bg-money-soft focus:border-money-brown',
                      ].join(' ')}
                    />
                  </div>

                  <div className="lg:text-right">
                    <div className="text-[11px] font-bold uppercase text-money-faint lg:hidden">
                      Selisih
                    </div>
                    <div
                      className={[
                        'font-money-mono text-[13.5px] font-extrabold',
                        row.diff === 0 && 'text-money-brown-deep',
                        row.diff > 0 && 'text-money-blue',
                        row.diff < 0 && 'text-money-rose',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {row.diff === 0
                        ? 'Rp 0'
                        : `${row.diff > 0 ? '+' : ''}${formatIdr(row.diff)}`}
                    </div>
                  </div>

                  <div className="flex justify-start gap-2 lg:justify-end">
                    {hasDiff ? (
                      <button
                        type="button"
                        onClick={() =>
                          openModal('adjustment', {
                            pocketId: row.id,
                            pocketName: `${row.pocketName} · ${row.accountName}`,
                            recorded: row.recorded,
                            actual: row.actual,
                          })
                        }
                        className="rounded-full bg-money-brown px-3 py-1.5 text-[12px] font-bold text-white hover:bg-money-brown-deep"
                      >
                        Buat adjustment
                      </button>
                    ) : (
                      <span className="text-[12px] font-semibold text-money-faint">
                        —
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </MoneyCard>
        </>
      )}
    </div>
  );
}
