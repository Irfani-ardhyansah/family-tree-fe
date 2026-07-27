import { useEffect, useState } from 'react';
import {
  fetchBroadcasts,
  fetchSelectableUsers,
  sendBroadcast,
} from '@/modules/admin/api/adminApi';
import { useAdminToast } from '@/modules/admin/components/AdminToast';
import {
  AdminEmpty,
  AdminError,
  AdminLoading,
  AdminPageHeader,
} from '@/modules/admin/components/PageState';
import type { BroadcastMessage } from '@/modules/admin/types';
import { formatDateTime } from '@/modules/admin/utils/format';
import { RichTextEditor } from '@/shared/components/ui/RichTextEditor';

const STATUS_STYLE = {
  sent: 'bg-admin-50 text-admin-800',
  scheduled: 'bg-amber-50 text-amber-800',
  failed: 'bg-rose-50 text-rose-700',
} as const;

export function BroadcastPage() {
  const { pushToast } = useAdminToast();
  const [items, setItems] = useState<BroadcastMessage[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState<'all' | 'selected'>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    void Promise.all([fetchBroadcasts(), fetchSelectableUsers()])
      .then(([list, us]) => {
        setItems(list);
        setUsers(us);
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Gagal memuat broadcast'),
      )
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggleUser = (id: string) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSend = async () => {
    setFormError('');
    setSending(true);
    try {
      const created = await sendBroadcast({
        title,
        body,
        target,
        targetUserIds: target === 'selected' ? selectedUsers : [],
        scheduledAt: scheduleEnabled && scheduledAt ? scheduledAt : null,
      });
      setItems((list) => [created, ...list]);
      setTitle('');
      setBody('');
      setSelectedUsers([]);
      setScheduleEnabled(false);
      setScheduledAt('');
      pushToast(
        'success',
        created.status === 'scheduled'
          ? 'Broadcast dijadwalkan.'
          : 'Broadcast terkirim.',
      );
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal mengirim.');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <AdminLoading label="Memuat broadcast…" />;
  if (error) return <AdminError message={error} onRetry={load} />;

  return (
    <div>
      <AdminPageHeader
        title="Broadcast"
        description="Kirim pengumuman ke seluruh anggota atau penerima terpilih."
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="rounded-2xl border border-ink-200/80 bg-white/90 p-5 shadow-sm lg:col-span-3">
          <h2 className="font-admin-display text-lg font-semibold text-ink-900">
            Pesan baru
          </h2>
          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                Judul
              </span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1.5 w-full rounded-xl border-ink-200 text-sm focus:border-admin-500 focus:ring-admin-500"
                placeholder="Judul pengumuman"
              />
            </label>

            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                Isi pesan
              </span>
              <div className="mt-1.5">
                <RichTextEditor
                  value={body}
                  onChange={setBody}
                  placeholder="Tulis isi pengumuman…"
                />
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                Target
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {(
                  [
                    ['all', 'Semua user'],
                    ['selected', 'Pilih user'],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTarget(value)}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                      target === value
                        ? 'bg-ink-900 text-white'
                        : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {target === 'selected' && (
                <div className="mt-3 flex max-h-40 flex-wrap gap-2 overflow-y-auto rounded-xl border border-ink-100 bg-ink-50/60 p-3">
                  {users.map((u) => {
                    const active = selectedUsers.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => toggleUser(u.id)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                          active
                            ? 'bg-admin-600 text-white'
                            : 'bg-white text-ink-600 ring-1 ring-ink-200'
                        }`}
                      >
                        {u.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <label className="flex items-center gap-2 text-sm text-ink-600">
              <input
                type="checkbox"
                checked={scheduleEnabled}
                onChange={(e) => setScheduleEnabled(e.target.checked)}
                className="rounded border-ink-300 text-admin-600 focus:ring-admin-500"
              />
              Jadwalkan pengiriman
            </label>
            {scheduleEnabled && (
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full rounded-xl border-ink-200 text-sm focus:border-admin-500 focus:ring-admin-500"
              />
            )}

            {formError && (
              <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {formError}
              </p>
            )}

            <button
              type="button"
              disabled={sending}
              onClick={() => void handleSend()}
              className="w-full rounded-xl bg-admin-600 px-4 py-3 text-sm font-semibold text-white hover:bg-admin-700 disabled:opacity-60 sm:w-auto"
            >
              {sending
                ? 'Mengirim…'
                : scheduleEnabled
                  ? 'Jadwalkan'
                  : 'Kirim sekarang'}
            </button>
          </div>
        </section>

        <section className="lg:col-span-2">
          <h2 className="mb-3 font-admin-display text-lg font-semibold text-ink-900">
            Riwayat
          </h2>
          {items.length === 0 ? (
            <AdminEmpty title="Belum ada broadcast" />
          ) : (
            <ul className="space-y-2.5">
              {items.map((msg) => (
                <li
                  key={msg.id}
                  className="rounded-2xl border border-ink-200/80 bg-white/90 p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-ink-900">{msg.title}</p>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_STYLE[msg.status]}`}
                    >
                      {msg.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-ink-400">
                    {msg.targetLabel} ·{' '}
                    {msg.sentAt
                      ? formatDateTime(msg.sentAt)
                      : msg.scheduledAt
                        ? `Jadwal ${formatDateTime(msg.scheduledAt)}`
                        : formatDateTime(msg.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
