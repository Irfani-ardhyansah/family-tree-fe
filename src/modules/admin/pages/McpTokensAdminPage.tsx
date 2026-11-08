import { useCallback, useEffect, useMemo, useState } from 'react';
import { Key, RefreshCw, ShieldOff } from 'react-feather';
import {
  listAdminMcpTokens,
  revokeAdminMcpToken,
} from '@/shared/lib/mcpTokenApi';
import type {
  AdminMcpTokenItem,
  McpTokenStatusFilter,
  McpUnlockModule,
} from '@/shared/types/mcpToken';
import { ConfirmDialog } from '@/modules/admin/components/ConfirmDialog';
import { useAdminToast } from '@/modules/admin/components/AdminToast';
import {
  AdminEmpty,
  AdminError,
  AdminLoading,
  AdminPageHeader,
} from '@/modules/admin/components/PageState';
import { formatDateTime, formatRelativeTime } from '@/modules/admin/utils/format';

const MODULE_LABEL: Record<McpUnlockModule, string> = {
  money: 'Money',
  core: 'Core',
  household: 'Household',
};

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return 'Terjadi kesalahan. Coba lagi.';
}

function AccessBadges({ unlocks }: { unlocks: McpUnlockModule[] }) {
  if (unlocks.length === 0) {
    return <span className="text-xs text-ink-400">Tanpa modul</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {unlocks.map((moduleId) => (
        <span
          key={moduleId}
          className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
        >
          {MODULE_LABEL[moduleId]}
        </span>
      ))}
    </div>
  );
}

export function McpTokensAdminPage() {
  const { pushToast } = useAdminToast();
  const [items, setItems] = useState<AdminMcpTokenItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<McpTokenStatusFilter>('active');
  const [personId, setPersonId] = useState<number | ''>('');
  const [target, setTarget] = useState<AdminMcpTokenItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listAdminMcpTokens({ status: 'all' });
      setItems(data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const personOptions = useMemo(() => {
    const map = new Map<number, string>();
    for (const item of items) {
      if (!map.has(item.personId)) {
        map.set(item.personId, item.personName || `Person ${item.personId}`);
      }
    }
    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'id'));
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (personId !== '' && item.personId !== personId) return false;
      if (status === 'active') return item.isActive;
      if (status === 'revoked') return !item.isActive;
      return true;
    });
  }, [items, personId, status]);

  const activeCount = useMemo(
    () => items.filter((item) => item.isActive).length,
    [items],
  );

  const handleRevoke = async () => {
    if (!target) return;
    const updated = await revokeAdminMcpToken(target.id);
    setItems((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item)),
    );
    pushToast('success', `Token "${updated.label}" milik ${updated.personName} dicabut.`);
  };

  if (loading) return <AdminLoading label="Memuat token MCP…" />;
  if (error) return <AdminError message={error} onRetry={() => void load()} />;

  return (
    <div>
      <AdminPageHeader
        title="Token MCP"
        description="Pantau token akses agent Nouride/MCP anggota keluarga dan cabut paksa bila perlu."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={personId}
              onChange={(e) =>
                setPersonId(e.target.value === '' ? '' : Number(e.target.value))
              }
              className="rounded-xl border-ink-200 text-sm focus:border-admin-500 focus:ring-admin-500"
            >
              <option value="">Semua person</option>
              {personOptions.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as McpTokenStatusFilter)}
              className="rounded-xl border-ink-200 text-sm focus:border-admin-500 focus:ring-admin-500"
            >
              <option value="active">Aktif</option>
              <option value="revoked">Dicabut</option>
              <option value="all">Semua</option>
            </select>
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200 px-3 py-2 text-sm font-semibold text-ink-600 transition hover:bg-ink-50 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800"
            >
              <RefreshCw size={14} />
              Muat ulang
            </button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-ink-500">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-admin-50 px-2.5 py-1 font-semibold text-admin-700 dark:bg-admin-600/20 dark:text-admin-300">
          <Key size={13} />
          {activeCount} token aktif
        </span>
        <span>{items.length} total baris dimuat (maks. 200 dari server).</span>
      </div>

      {filtered.length === 0 ? (
        <AdminEmpty
          title="Tidak ada token MCP"
          description={
            items.length === 0
              ? 'Belum ada anggota keluarga yang membuat token untuk agent Nouride.'
              : 'Tidak ada token yang cocok dengan filter saat ini.'
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-ink-200/80 bg-white/90 shadow-sm dark:border-ink-700 dark:bg-ink-900/60">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-ink-50/80 text-xs uppercase tracking-wider text-ink-400 dark:bg-ink-800/60">
                <tr>
                  <th className="px-4 py-3 font-semibold">Person</th>
                  <th className="px-4 py-3 font-semibold">Token</th>
                  <th className="px-4 py-3 font-semibold">Akses</th>
                  <th className="px-4 py-3 font-semibold">Dibuat</th>
                  <th className="px-4 py-3 font-semibold">Terakhir dipakai</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold" />
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-admin-50/30 dark:hover:bg-admin-600/10"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-ink-800 dark:text-ink-100">
                        {item.personName || `Person ${item.personId}`}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-ink-700 dark:text-ink-200">
                        {item.label}
                      </div>
                      <div className="mt-0.5 break-all font-mono text-[11px] text-ink-400">
                        {item.tokenHint}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <AccessBadges unlocks={item.unlocks} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-ink-500">
                      {formatDateTime(item.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-ink-500">
                      {item.lastUsedAt ? (
                        <span title={formatDateTime(item.lastUsedAt)}>
                          {formatRelativeTime(item.lastUsedAt)}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {item.isActive ? (
                        <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex flex-col">
                          <span className="inline-flex w-fit rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-500 dark:bg-ink-800 dark:text-ink-300">
                            Dicabut
                          </span>
                          {item.revokedAt ? (
                            <span
                              className="mt-0.5 text-[10px] text-ink-400"
                              title={formatDateTime(item.revokedAt)}
                            >
                              {formatRelativeTime(item.revokedAt)}
                            </span>
                          ) : null}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {item.isActive ? (
                        <button
                          type="button"
                          onClick={() => setTarget(item)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-950/40"
                        >
                          <ShieldOff size={13} />
                          Cabut paksa
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={target != null}
        title="Cabut paksa token MCP?"
        description={
          target ? (
            <>
              Cabut token <strong>{target.label}</strong> milik{' '}
              <strong>{target.personName}</strong>? Token langsung berhenti
              bekerja. Agent Nouride yang memakainya akan kehilangan akses.
            </>
          ) : (
            ''
          )
        }
        confirmLabel="Cabut token"
        tone="danger"
        onClose={() => setTarget(null)}
        onConfirm={handleRevoke}
      />
    </div>
  );
}
