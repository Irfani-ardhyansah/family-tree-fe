import { useEffect, useRef, useState } from 'react';
import { Download } from 'react-feather';
import {
  fetchBackups,
  pollBackupUntilDone,
  triggerBackup,
} from '@/modules/admin/api/adminApi';
import { useAdminToast } from '@/modules/admin/components/AdminToast';
import {
  AdminEmpty,
  AdminError,
  AdminLoading,
  AdminPageHeader,
} from '@/modules/admin/components/PageState';
import type { BackupJob } from '@/modules/admin/types';
import { formatDateTime } from '@/modules/admin/utils/format';
import { MODULE_CATALOG, type AppModuleId } from '@/shared/data/moduleCatalog';

const STATUS_STYLE = {
  success: 'bg-admin-50 text-admin-800',
  failed: 'bg-rose-50 text-rose-700',
  running: 'bg-amber-50 text-amber-800',
} as const;

export function BackupExportPage() {
  const { pushToast } = useAdminToast();
  const [jobs, setJobs] = useState<BackupJob[]>([]);
  const [selected, setSelected] = useState<AppModuleId[]>(['roots']);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const pollIdsRef = useRef(new Set<string>());

  const upsertJob = (job: BackupJob) => {
    setJobs((list) => {
      const idx = list.findIndex((j) => j.id === job.id);
      if (idx === -1) return [job, ...list];
      const next = [...list];
      next[idx] = job;
      return next;
    });
  };

  const watchJob = async (id: string) => {
    if (pollIdsRef.current.has(id)) return;
    pollIdsRef.current.add(id);
    try {
      const done = await pollBackupUntilDone(id);
      upsertJob(done);
      if (done.status === 'success') {
        pushToast('success', 'Backup selesai.');
      } else if (done.status === 'failed') {
        pushToast('error', done.errorMessage || 'Backup gagal.');
      }
    } catch (err) {
      pushToast(
        'error',
        err instanceof Error ? err.message : 'Gagal memantau status backup.',
      );
    } finally {
      pollIdsRef.current.delete(id);
    }
  };

  const load = () => {
    setLoading(true);
    setError('');
    void fetchBackups()
      .then((list) => {
        setJobs(list);
        for (const job of list) {
          if (job.status === 'running') void watchJob(job.id);
        }
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Gagal memuat backup'),
      )
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggle = (id: AppModuleId) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleTrigger = async () => {
    setFormError('');
    setRunning(true);
    try {
      const job = await triggerBackup(selected);
      upsertJob(job);
      if (job.status === 'running') {
        pushToast('success', 'Backup dimulai. Menunggu selesai…');
        void watchJob(job.id);
      } else if (job.status === 'success') {
        pushToast('success', 'Backup berhasil dibuat.');
      } else {
        pushToast('error', job.errorMessage || 'Backup gagal.');
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal trigger backup.');
    } finally {
      setRunning(false);
    }
  };

  if (loading) return <AdminLoading label="Memuat riwayat backup…" />;
  if (error) return <AdminError message={error} onRetry={load} />;

  return (
    <div>
      <AdminPageHeader
        title="Backup & Export"
        description="Trigger backup manual per modul. Job berjalan async — status akan ter-update otomatis. Money/Household masih placeholder kosong di BE."
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="rounded-2xl border border-ink-200/80 bg-white/90 p-5 shadow-sm lg:col-span-2">
          <h2 className="font-admin-display text-lg font-semibold text-ink-900">
            Trigger backup
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            Pilih modul yang ingin diarsipkan sekarang.
          </p>
          <ul className="mt-4 space-y-2">
            {MODULE_CATALOG.map((mod) => {
              const checked = selected.includes(mod.id);
              const placeholder =
                mod.id === 'money' || mod.id === 'household';
              return (
                <li key={mod.id}>
                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 transition ${
                      checked
                        ? 'border-admin-300 bg-admin-50/60'
                        : 'border-ink-200 hover:bg-ink-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(mod.id)}
                      className="rounded border-ink-300 text-admin-600 focus:ring-admin-500"
                    />
                    <mod.Icon size={16} className="text-ink-500" />
                    <span className="text-sm font-semibold text-ink-800">
                      {mod.title}
                    </span>
                    {placeholder && (
                      <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide text-ink-400">
                        placeholder
                      </span>
                    )}
                  </label>
                </li>
              );
            })}
          </ul>

          {formError && (
            <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {formError}
            </p>
          )}

          <button
            type="button"
            disabled={running || selected.length === 0}
            onClick={() => void handleTrigger()}
            className="mt-5 w-full rounded-xl bg-admin-600 px-4 py-3 text-sm font-semibold text-white hover:bg-admin-700 disabled:opacity-60"
          >
            {running ? 'Memulai…' : 'Trigger Backup Sekarang'}
          </button>
        </section>

        <section className="lg:col-span-3">
          <h2 className="mb-3 font-admin-display text-lg font-semibold text-ink-900">
            Riwayat backup
          </h2>
          {jobs.length === 0 ? (
            <AdminEmpty title="Belum ada backup" />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-ink-200/80 bg-white/90 shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-ink-50/80 text-xs uppercase tracking-wider text-ink-400">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Waktu</th>
                      <th className="px-4 py-3 font-semibold">Modul</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {jobs.map((job) => (
                      <tr key={job.id} className="hover:bg-admin-50/30">
                        <td className="whitespace-nowrap px-4 py-3 text-ink-500">
                          {formatDateTime(job.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-ink-700">
                          {job.moduleIds.join(', ')}
                          {job.errorMessage && (
                            <span className="mt-0.5 block text-xs text-rose-500">
                              {job.errorMessage}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              STATUS_STYLE[job.status] ?? STATUS_STYLE.running
                            }`}
                          >
                            {job.status === 'running' ? 'running…' : job.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {job.status === 'success' && job.downloadUrl ? (
                            <a
                              href={job.downloadUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-admin-700 hover:bg-admin-50"
                            >
                              <Download size={14} />
                              Unduh
                            </a>
                          ) : (
                            <span className="text-xs text-ink-300">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
