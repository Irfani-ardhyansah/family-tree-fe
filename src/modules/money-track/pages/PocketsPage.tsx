import { useMemo } from 'react';
import { Plus } from 'react-feather';
import { DataSourceBanner } from '@/modules/money-track/components/DataSourceBanner';
import {
  MoneyCard,
  PageHeader,
} from '@/modules/money-track/components/PageChrome';
import { useMoneyTrackUi } from '@/modules/money-track/context/MoneyTrackUiContext';
import { formatIdr, type MoneyPocketCategory } from '@/modules/money-track/types';

function pocketTone(category: MoneyPocketCategory) {
  if (category === 'transaksi') return 'bg-money-blue-soft text-money-blue';
  if (category === 'tabungan') return 'bg-money-amber-soft text-money-amber';
  if (category === 'investasi') return 'bg-money-violet-soft text-money-violet';
  return 'bg-money-soft text-money-muted';
}

export function PocketsPage() {
  const { scope, scopeLabel, accounts, openModal } = useMoneyTrackUi();

  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      if (scope === 'all') return true;
      if (acc.personId === null) return true;
      return acc.personId === scope;
    });
  }, [scope, accounts]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filteredAccounts>();
    for (const acc of filteredAccounts) {
      const key = acc.personName;
      const list = map.get(key) ?? [];
      list.push(acc);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [filteredAccounts]);

  const totalBalance = filteredAccounts.reduce(
    (sum, acc) => sum + acc.pockets.reduce((s, p) => s + p.balance, 0),
    0,
  );

  return (
    <div>
      <DataSourceBanner />
      <PageHeader
        title="Kantong"
        description={`Account & pocket untuk ${scopeLabel}. Satu bank bisa punya banyak kantong.`}
        actions={
          <button
            type="button"
            onClick={() => openModal('account')}
            className="inline-flex items-center gap-1.5 rounded-full bg-money-brown px-3.5 py-2 text-[13px] font-bold text-white hover:bg-money-brown-deep"
          >
            <Plus size={15} />
            Tambah Account
          </button>
        }
      />

      <MoneyCard className="mb-4 flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wide text-money-faint">
            Total saldo tampilan
          </div>
          <div className="font-money-mono text-xl font-extrabold">
            {formatIdr(totalBalance)}
          </div>
        </div>
        <div className="text-[12.5px] text-money-muted">
          {filteredAccounts.length} account ·{' '}
          {filteredAccounts.reduce((n, a) => n + a.pockets.length, 0)} pocket
        </div>
      </MoneyCard>

      {grouped.length === 0 ? (
        <MoneyCard className="px-5 py-10 text-center text-sm text-money-faint">
          Belum ada account / pocket untuk sumber data ini.
        </MoneyCard>
      ) : (
      <div className="space-y-5">
        {grouped.map(([personName, personAccounts]) => (
          <div key={personName}>
            <div className="mb-2.5 flex items-center gap-2">
              <h2 className="text-[15px] font-extrabold">{personName}</h2>
              <span className="rounded-full bg-money-soft px-2 py-0.5 text-[11px] font-bold text-money-muted">
                {personAccounts.length} account
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
              {personAccounts.map((acc) => {
                const accTotal = acc.pockets.reduce((s, p) => s + p.balance, 0);
                return (
                  <MoneyCard key={acc.id} className="p-5">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[15px] font-bold">{acc.name}</div>
                        <div className="text-[12px] capitalize text-money-faint">
                          {acc.type === 'ewallet' ? 'E-wallet' : acc.type}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-money-mono text-[14px] font-extrabold">
                          {formatIdr(accTotal)}
                        </div>
                        <button
                          type="button"
                          className="mt-1 text-[11.5px] font-bold text-money-brown-deep"
                        >
                          + Pocket
                        </button>
                      </div>
                    </div>
                    <div className="space-y-0">
                      {acc.pockets.map((pocket) => (
                        <div
                          key={pocket.id}
                          className="flex items-center gap-2.5 border-t border-money-border py-2.5 first:border-t-0 first:pt-0"
                        >
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ${pocketTone(pocket.category)}`}
                          >
                            {pocket.joint ? '👨‍👩‍👧' : pocket.category.slice(0, 1).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[13px] font-semibold">
                              {pocket.name}
                              {pocket.joint ? (
                                <span className="ml-1.5 rounded bg-money-violet-soft px-1.5 py-0.5 text-[10px] font-bold text-money-violet">
                                  Joint
                                </span>
                              ) : null}
                            </div>
                            {'goalAmount' in pocket && pocket.goalAmount ? (
                              <div className="mt-1">
                                <div className="h-1 overflow-hidden rounded-full bg-money-soft">
                                  <div
                                    className="h-full rounded-full bg-money-violet"
                                    style={{
                                      width: `${Math.min(pocket.goalPct ?? 0, 100)}%`,
                                    }}
                                  />
                                </div>
                                <div className="mt-0.5 text-[10.5px] text-money-faint">
                                  Goal {formatIdr(pocket.goalAmount)} ·{' '}
                                  {pocket.goalPct}%
                                </div>
                              </div>
                            ) : (
                              <div className="text-[11px] capitalize text-money-faint">
                                {pocket.category}
                              </div>
                            )}
                          </div>
                          <div className="font-money-mono text-[13px] font-bold">
                            {formatIdr(pocket.balance)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </MoneyCard>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}