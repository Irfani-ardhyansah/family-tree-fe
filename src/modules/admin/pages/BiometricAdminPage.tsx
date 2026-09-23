import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  deleteAdminWebAuthnCredential,
  fetchAdminWebAuthnCredentials,
  updateAdminWebAuthnCredential,
  type AdminWebAuthnCredential,
} from '@/shared/lib/webauthnApi';
import { ApiClientError } from '@/shared/lib/apiClient';
import { ConfirmDialog } from '@/modules/admin/components/ConfirmDialog';
import { useAdminToast } from '@/modules/admin/components/AdminToast';
import {
  AdminEmpty,
  AdminError,
  AdminLoading,
  AdminPageHeader,
} from '@/modules/admin/components/PageState';
import { formatDateTime } from '@/modules/admin/utils/format';

const LABEL_MAX = 40;

function formatWhen(iso: string | null): string {
  if (!iso) return 'Belum pernah';
  return formatDateTime(iso);
}

export function BiometricAdminPage() {
  const { pushToast } = useAdminToast();
  const [items, setItems] = useState<AdminWebAuthnCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unavailable, setUnavailable] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminWebAuthnCredential | null>(
    null,
  );

  const load = () => {
    setLoading(true);
    setError('');
    setUnavailable(false);
    void fetchAdminWebAuthnCredentials()
      .then(setItems)
      .catch((err: unknown) => {
        if (err instanceof ApiClientError && err.code === 'NOT_FOUND') {
          setUnavailable(true);
          setItems([]);
          return;
        }
        setError(err instanceof Error ? err.message : 'Gagal memuat perangkat biometrik');
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const groups = useMemo(() => {
    const map = new Map<
      number,
      { personId: number; personName: string; items: AdminWebAuthnCredential[] }
    >();
    for (const item of items) {
      const group = map.get(item.personId) ?? {
        personId: item.personId,
        personName: item.personName,
        items: [],
      };
      group.items.push(item);
      map.set(item.personId, group);
    }
    return [...map.values()];
  }, [items]);

  const saveLabel = async (item: AdminWebAuthnCredential) => {
    const label = draft.trim().slice(0, LABEL_MAX);
    if (!label) {
      pushToast('error', 'Nama perangkat wajib diisi, 1–40 karakter.');
      return;
    }
    setBusyId(item.id);
    try {
      const updated = await updateAdminWebAuthnCredential(item.id, { label });
      setItems((list) => list.map((row) => (row.id === item.id ? { ...row, ...updated } : row)));
      setEditingId(null);
      pushToast('success', 'Nama perangkat diperbarui.');
    } catch (err) {
      pushToast('error', err instanceof Error ? err.message : 'Gagal mengubah nama perangkat.');
    } finally {
      setBusyId(null);
    }
  };

  const toggleEnabled = async (item: AdminWebAuthnCredential) => {
    setBusyId(item.id);
    try {
      const updated = await updateAdminWebAuthnCredential(item.id, {
        enabled: !item.enabled,
      });
      setItems((list) => list.map((row) => (row.id === item.id ? { ...row, ...updated } : row)));
      pushToast('success', updated.enabled ? 'Perangkat diaktifkan.' : 'Perangkat dinonaktifkan.');
    } catch (err) {
      pushToast('error', err instanceof Error ? err.message : 'Gagal mengubah status.');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <AdminLoading label="Memuat perangkat biometrik…" />;
  if (error) return <AdminError message={error} onRetry={load} />;

  return (
    <div>
      <AdminPageHeader
        title="Login biometrik"
        description="Perangkat yang sudah didaftarkan anggota. Mendaftarkan perangkat hanya bisa dilakukan di perangkat orang itu sendiri."
      />

      {unavailable || items.length === 0 ? (
        <AdminEmpty
          title={
            unavailable
              ? 'Login biometrik belum aktif di server.'
              : 'Belum ada perangkat biometrik terdaftar.'
          }
          description={
            unavailable
              ? 'Endpoint belum tersedia.'
              : 'Anggota yang belum mendaftar tidak ditampilkan di sini.'
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-ink-200/80 bg-white/90 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-ink-50/80 text-xs uppercase tracking-wider text-ink-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Nama</th>
                  <th className="px-4 py-3 font-semibold">Perangkat</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Daftar</th>
                  <th className="px-4 py-3 font-semibold">Terakhir dipakai</th>
                  <th className="px-4 py-3 font-semibold" />
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {groups.map((group) => (
                  <Fragment key={group.personId}>
                    <tr className="bg-ink-50/60">
                      <td
                        colSpan={6}
                        className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink-500"
                      >
                        {group.personName}
                      </td>
                    </tr>
                    {group.items.map((item) => {
                      const busy = busyId === item.id;
                      return (
                        <tr key={item.id} className="hover:bg-admin-50/30">
                          <td className="px-4 py-3 font-medium text-ink-800">
                            {item.personName}
                          </td>
                          <td className="px-4 py-3">
                            {editingId === item.id ? (
                              <input
                                value={draft}
                                maxLength={LABEL_MAX}
                                onChange={(e) => setDraft(e.target.value)}
                                className="w-full min-w-[10rem] rounded-xl border-ink-200 text-sm"
                              />
                            ) : (
                              item.label
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {item.enabled ? (
                              <span className="text-emerald-700">Aktif</span>
                            ) : (
                              <span className="text-rose-700">Nonaktif</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-ink-500">
                            {formatWhen(item.createdAt)}
                          </td>
                          <td className="px-4 py-3 text-ink-500">
                            {formatWhen(item.lastUsedAt)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2 whitespace-nowrap">
                              {editingId === item.id ? (
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => void saveLabel(item)}
                                  className="text-sm font-semibold text-admin-700 disabled:opacity-50"
                                >
                                  Simpan
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => {
                                    setEditingId(item.id);
                                    setDraft(item.label);
                                  }}
                                  className="text-sm font-semibold text-ink-600 disabled:opacity-50"
                                >
                                  Ubah nama
                                </button>
                              )}
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void toggleEnabled(item)}
                                className="text-sm font-semibold text-ink-600 disabled:opacity-50"
                              >
                                {item.enabled ? 'Nonaktifkan' : 'Aktifkan'}
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => setPendingDelete(item)}
                                className="text-sm font-semibold text-rose-600 disabled:opacity-50"
                              >
                                Hapus
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={pendingDelete != null}
        title="Hapus perangkat?"
        description="Perangkat ini dihapus. User harus mendaftar ulang di perangkatnya."
        confirmLabel="Hapus"
        tone="danger"
        onClose={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (!pendingDelete) return;
          await deleteAdminWebAuthnCredential(pendingDelete.id);
          setItems((list) => list.filter((row) => row.id !== pendingDelete.id));
          pushToast('success', 'Perangkat dihapus.');
        }}
      />
    </div>
  );
}
