import { useEffect, useMemo, useState } from 'react';
import { LogOut } from 'react-feather';
import {
  fetchSelectableUsers,
  fetchSessions,
  forceLogoutSession,
} from '@/modules/admin/api/adminApi';
import { ConfirmDialog } from '@/modules/admin/components/ConfirmDialog';
import { useAdminToast } from '@/modules/admin/components/AdminToast';
import {
  AdminEmpty,
  AdminError,
  AdminLoading,
  AdminPageHeader,
} from '@/modules/admin/components/PageState';
import type { ActiveSession } from '@/modules/admin/types';
import {
  formatDateTime,
  formatRelativeTime,
} from '@/modules/admin/utils/format';
import { useAuth } from '@/shared/context/AuthContext';
import { shortPersonName } from '@/shared/utils/personDisplayName';

export function SessionManagementPage() {
  const { person } = useAuth();
  const { pushToast } = useAdminToast();
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [userFilter, setUserFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [target, setTarget] = useState<ActiveSession | null>(null);

  const actorName = person
    ? shortPersonName(person, person.fullName)
    : 'Admin';

  const load = () => {
    setLoading(true);
    setError('');
    void Promise.all([fetchSessions(), fetchSelectableUsers()])
      .then(([sess, us]) => {
        setSessions(sess);
        if (us.length > 0) {
          setUsers(us);
          return;
        }
        const fromSessions = new Map<string, string>();
        for (const s of sess) {
          fromSessions.set(s.userId, s.userName);
        }
        setUsers(
          [...fromSessions.entries()].map(([id, name]) => ({ id, name })),
        );
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Gagal memuat sesi'),
      )
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = useMemo(() => {
    if (!userFilter) return sessions;
    return sessions.filter((s) => s.userId === userFilter);
  }, [sessions, userFilter]);

  if (loading) return <AdminLoading label="Memuat sesi aktif…" />;
  if (error) return <AdminError message={error} onRetry={load} />;

  return (
    <div>
      <AdminPageHeader
        title="Session Management"
        description="Pantau sesi aktif anggota keluarga dan paksa logout bila diperlukan."
        actions={
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="rounded-xl border-ink-200 text-sm focus:border-admin-500 focus:ring-admin-500"
          >
            <option value="">Semua user</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        }
      />

      {filtered.length === 0 ? (
        <AdminEmpty
          title="Tidak ada sesi aktif"
          description="Tidak ada sesi yang cocok dengan filter saat ini."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-ink-200/80 bg-white/90 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-ink-50/80 text-xs uppercase tracking-wider text-ink-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Device / Browser</th>
                  <th className="px-4 py-3 font-semibold">IP</th>
                  <th className="px-4 py-3 font-semibold">Login</th>
                  <th className="px-4 py-3 font-semibold">Aktivitas terakhir</th>
                  <th className="px-4 py-3 font-semibold" />
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {filtered.map((sess) => (
                  <tr key={sess.id} className="hover:bg-admin-50/30">
                    <td className="px-4 py-3">
                      <div className="font-medium text-ink-800">
                        {sess.userName}
                      </div>
                      {sess.isCurrent && (
                        <span className="mt-1 inline-flex rounded-full bg-admin-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-admin-700">
                          Sesi ini
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-600">
                      {sess.device}
                      <span className="block text-xs text-ink-400">
                        {sess.browser}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-500">
                      {sess.ipAddress ?? '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-ink-500">
                      {formatDateTime(sess.loggedInAt)}
                    </td>
                    <td className="px-4 py-3 text-ink-500">
                      {formatRelativeTime(sess.lastActiveAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        disabled={sess.isCurrent}
                        onClick={() => setTarget(sess)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <LogOut size={14} />
                        Force Logout
                      </button>
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
        title="Force logout user?"
        description={
          target ? (
            <>
              Sesi <strong>{target.userName}</strong> di{' '}
              <strong>{target.device}</strong> akan diakhiri segera.
            </>
          ) : (
            ''
          )
        }
        confirmLabel="Force Logout"
        onClose={() => setTarget(null)}
        onConfirm={async () => {
          if (!target) return;
          await forceLogoutSession(target.id, actorName);
          setSessions((list) => list.filter((s) => s.id !== target.id));
          pushToast('success', `Sesi ${target.userName} diakhiri.`);
        }}
      />
    </div>
  );
}
