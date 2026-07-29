import { useMemo, useState } from 'react';
import { Edit2, Plus, RotateCcw, Trash2 } from 'react-feather';
import { DataSourceBanner } from '@/modules/money-track/components/DataSourceBanner';
import {
  MoneyCard,
  PageHeader,
} from '@/modules/money-track/components/PageChrome';
import { useMoneyTrackUi } from '@/modules/money-track/context/MoneyTrackUiContext';
import { archiveMoneyPocket } from '@/modules/money-track/api/moneyApi';
import { formatIdr, type MoneyPocketCategory } from '@/modules/money-track/types';
import { ApiClientError } from '@/shared/lib/apiClient';

function pocketTone(category: MoneyPocketCategory) {
  if (category === 'transaksi') return 'bg-money-blue-soft text-money-blue';
  if (category === 'tabungan') return 'bg-money-amber-soft text-money-amber';
  if (category === 'investasi') return 'bg-money-violet-soft text-money-violet';
  return 'bg-money-soft text-money-muted';
}

export function PocketsPage() {
  const {
    scope,
    scopeLabel,
    accounts,
    archivedPockets,
    openModal,
    restorePocket,
    removePocket,
    dataSource,
    refreshApi,
  } = useMoneyTrackUi();
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      if (scope === 'all') return true;
      if (acc.personId === null) return true;
      return acc.personId === scope;
    });
  }, [scope, accounts]);

  const filteredArchived = useMemo(() => {
    return archivedPockets.filter((pocket) => {
      if (scope === 'all') return true;
      if (pocket.personId === null) return true;
      return pocket.personId === scope;
    });
  }, [scope, archivedPockets]);

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

  const handleRestore = async (pocketId: string) => {
    setRestoringId(pocketId);
    setRestoreError(null);
    try {
      await restorePocket(pocketId);
    } catch (err) {
      setRestoreError(
        err instanceof ApiClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Gagal memulihkan pocket.',
      );
    } finally {
      setRestoringId(null);
    }
  };

  const handleDeletePocket = async (
    accountId: string,
    pocketId: string,
    pocketName: string,
  ) => {
    if (
      !window.confirm(
        `Hapus pocket "${pocketName}"? Pocket akan di-archive dan bisa dipulihkan nanti.`,
      )
    ) {
      return;
    }
    setDeletingId(pocketId);
    setDeleteError(null);
    try {
      if (dataSource === 'api') {
        await archiveMoneyPocket(pocketId);
        await refreshApi();
      } else {
        removePocket(accountId, pocketId);
      }
    } catch (err) {
      setDeleteError(
        err instanceof ApiClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Gagal menghapus pocket.',
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <DataSourceBanner />
      <PageHeader
        title="Kantong"
        description={`Account & pocket untuk ${scopeLabel}. Satu bank bisa punya banyak kantong.`}
        actions={
          <>
            <button
              type="button"
              onClick={() => openModal('pocket')}
              className="inline-flex items-center gap-1.5 rounded-full border border-money-border bg-money-surface px-3.5 py-2 text-[13px] font-bold text-money-ink hover:bg-money-soft"
            >
              <Plus size={15} />
              Tambah Pocket
            </button>
            <button
              type="button"
              onClick={() => openModal('account')}
              className="inline-flex items-center gap-1.5 rounded-full bg-money-brown px-3.5 py-2 text-[13px] font-bold text-white hover:bg-money-brown-deep"
            >
              <Plus size={15} />
              Tambah Account
            </button>
          </>
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
          {filteredArchived.length > 0
            ? ` · ${filteredArchived.length} archived`
            : ''}
        </div>
      </MoneyCard>

      {deleteError ? (
        <p className="mb-3 text-[12.5px] font-semibold text-red-600">
          {deleteError}
        </p>
      ) : null}

      {grouped.length === 0 ? (
        <MoneyCard className="px-5 py-10 text-center">
          <p className="text-sm text-money-faint">
            Belum ada account / pocket untuk sumber data ini.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => openModal('account')}
              className="inline-flex items-center gap-1.5 rounded-full bg-money-brown px-3.5 py-2 text-[13px] font-bold text-white hover:bg-money-brown-deep"
            >
              <Plus size={15} />
              Tambah Account
            </button>
            <button
              type="button"
              onClick={() => openModal('pocket')}
              className="inline-flex items-center gap-1.5 rounded-full border border-money-border px-3.5 py-2 text-[13px] font-bold text-money-ink hover:bg-money-soft"
            >
              <Plus size={15} />
              Tambah Pocket
            </button>
          </div>
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
                  const canAddPocket = acc.type !== 'cash';
                  const archivedForAccount = filteredArchived.filter(
                    (p) => p.accountId === acc.id,
                  );
                  return (
                    <MoneyCard key={acc.id} className="p-5">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-[15px] font-bold">{acc.name}</div>
                            <button
                              type="button"
                              title="Edit account"
                              onClick={() =>
                                openModal('account', {
                                  accountId: acc.id,
                                  accountName: acc.name,
                                  accountType: acc.type,
                                  personId: acc.personId ?? undefined,
                                  personName: acc.personName,
                                })
                              }
                              className="rounded-lg p-1 text-money-muted hover:bg-money-soft hover:text-money-ink"
                            >
                              <Edit2 size={14} />
                            </button>
                          </div>
                          <div className="text-[12px] capitalize text-money-faint">
                            {acc.type === 'ewallet' ? 'E-wallet' : acc.type}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-money-mono text-[14px] font-extrabold">
                            {formatIdr(accTotal)}
                          </div>
                          {canAddPocket ? (
                            <button
                              type="button"
                              onClick={() =>
                                openModal('pocket', {
                                  accountId: acc.id,
                                  accountName: acc.name,
                                })
                              }
                              className="mt-1 text-[11.5px] font-bold text-money-brown-deep hover:underline"
                            >
                              + Pocket
                            </button>
                          ) : (
                            <div className="mt-1 text-[10.5px] text-money-faint">
                              Cash (sistem)
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-0">
                        {acc.pockets.length === 0 ? (
                          <p className="border-t border-money-border py-3 text-[12.5px] text-money-faint">
                            {archivedForAccount.length > 0 ? (
                              <>
                                Tidak ada pocket aktif ·{' '}
                                {archivedForAccount.length} di-archive (lihat
                                section bawah untuk pulihkan).
                              </>
                            ) : (
                              <>
                                Belum ada pocket.{' '}
                                {canAddPocket ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openModal('pocket', {
                                        accountId: acc.id,
                                        accountName: acc.name,
                                      })
                                    }
                                    className="font-bold text-money-brown-deep underline"
                                  >
                                    Tambah sekarang
                                  </button>
                                ) : null}
                              </>
                            )}
                          </p>
                        ) : (
                          acc.pockets.map((pocket) => (
                            <div
                              key={pocket.id}
                              className="flex items-center gap-2.5 border-t border-money-border py-2.5 first:border-t-0 first:pt-0"
                            >
                              <div
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ${pocketTone(pocket.category)}`}
                              >
                                {pocket.joint
                                  ? '👨‍👩‍👧'
                                  : pocket.category.slice(0, 1).toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="text-[13px] font-semibold">
                                    {pocket.name}
                                  </span>
                                  {pocket.joint ? (
                                    <span className="rounded bg-money-violet-soft px-1.5 py-0.5 text-[10px] font-bold text-money-violet">
                                      Joint
                                    </span>
                                  ) : null}
                                  {pocket.isSystem ? (
                                    <span className="rounded bg-money-soft px-1.5 py-0.5 text-[10px] font-bold text-money-muted">
                                      Sistem
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
                              <div className="flex items-center gap-0.5">
                                <div className="font-money-mono text-[13px] font-bold">
                                  {formatIdr(pocket.balance)}
                                </div>
                                <button
                                  type="button"
                                  title="Edit pocket"
                                  onClick={() =>
                                    openModal('pocket', {
                                      accountId: acc.id,
                                      accountName: acc.name,
                                      pocketId: pocket.id,
                                      pocketName: pocket.name,
                                      pocketCategory: pocket.category,
                                      pocketGoalAmount: pocket.goalAmount ?? null,
                                      pocketIsSystem: pocket.isSystem ?? false,
                                      pocketCanDelete: pocket.canDelete,
                                    })
                                  }
                                  className="rounded-lg p-1.5 text-money-muted hover:bg-money-soft hover:text-money-ink"
                                >
                                  <Edit2 size={14} />
                                </button>
                                {pocket.canDelete ? (
                                  <button
                                    type="button"
                                    title="Hapus pocket"
                                    disabled={deletingId === pocket.id}
                                    onClick={() =>
                                      void handleDeletePocket(
                                        acc.id,
                                        pocket.id,
                                        pocket.name,
                                      )
                                    }
                                    className="rounded-lg p-1.5 text-money-muted hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-45"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </MoneyCard>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredArchived.length > 0 ? (
        <div className="mt-8">
          <div className="mb-2.5 flex items-center gap-2">
            <h2 className="text-[15px] font-extrabold">Pocket di-archive</h2>
            <span className="rounded-full bg-money-soft px-2 py-0.5 text-[11px] font-bold text-money-muted">
              {filteredArchived.length}
            </span>
          </div>
          {restoreError ? (
            <p className="mb-2 text-[12.5px] font-semibold text-red-600">
              {restoreError}
            </p>
          ) : null}
          <MoneyCard className="divide-y divide-money-border overflow-hidden p-0">
            {filteredArchived.map((pocket) => (
              <div
                key={pocket.id}
                className="flex items-center gap-3 px-5 py-3.5"
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold opacity-70 ${pocketTone(pocket.category)}`}
                >
                  {pocket.category.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold text-money-muted">
                    {pocket.name}
                  </div>
                  <div className="text-[11.5px] text-money-faint">
                    {pocket.accountName} · {pocket.personName}
                  </div>
                </div>
                <div className="font-money-mono text-[12.5px] font-bold text-money-muted">
                  {formatIdr(pocket.balance)}
                </div>
                <button
                  type="button"
                  disabled={restoringId === pocket.id}
                  onClick={() => void handleRestore(pocket.id)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-money-border bg-money-surface px-3 py-1.5 text-[12px] font-bold text-money-ink hover:bg-money-soft disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <RotateCcw size={13} />
                  {restoringId === pocket.id ? 'Memulihkan…' : 'Pulihkan'}
                </button>
              </div>
            ))}
          </MoneyCard>
        </div>
      ) : null}
    </div>
  );
}
