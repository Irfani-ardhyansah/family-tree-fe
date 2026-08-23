import { useEffect, useRef, useState } from 'react';
import { Download } from 'react-feather';
import {
  createSqlBackup,
  downloadBackupFile,
  fetchBackups,
  importBackupFile,
  pollBackupUntilDone,
  triggerBackup,
} from '@/modules/admin/api/adminApi';
import { useAdminToast } from '@/modules/admin/components/AdminToast';
import { ConfirmDialog } from '@/modules/admin/components/ConfirmDialog';
import {
  AdminEmpty,
  AdminError,
  AdminLoading,
  AdminPageHeader,
} from '@/modules/admin/components/PageState';
import type { BackupJob } from '@/modules/admin/types';
import { formatDateTime } from '@/modules/admin/utils/format';
import { useAuth } from '@/shared/context/AuthContext';
import { MODULE_CATALOG, type AppModuleId } from '@/shared/data/moduleCatalog';

const STATUS_STYLE = {
  success: 'bg-admin-50 text-admin-800',
  failed: 'bg-rose-50 text-rose-700',
  running: 'bg-amber-50 text-amber-800',
} as const;

const IMPORT_ACCEPT =
  '.json,.sql,.sql.gz,.sql.zip,application/json,application/zip,application/gzip';

function isSqlImportFile(file: File) {
  const name = file.name.toLowerCase();
  return (
    name.endsWith('.sql') ||
    name.endsWith('.sql.gz') ||
    name.endsWith('.sql.zip') ||
    name.endsWith('.zip')
  );
}

export function BackupExportPage() {
  const { pushToast } = useAdminToast();
  const { logout } = useAuth();
  const [jobs, setJobs] = useState<BackupJob[]>([]);
  const [selected, setSelected] = useState<AppModuleId[]>(['roots']);
  const [loading, setLoading] = useState(true);
  const [runningJson, setRunningJson] = useState(false);
  const [runningSql, setRunningSql] = useState(false);
  const [importing, setImporting] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [pendingImport, setPendingImport] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
        pushToast(
          'success',
          done.format === 'sql'
            ? 'Export SQL selesai. Siap diunduh.'
            : 'Backup JSON selesai.',
        );
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

  const startJob = async (job: BackupJob, label: string) => {
    upsertJob(job);
    if (job.status === 'running') {
      pushToast('success', `${label} dimulai. Menunggu selesai…`);
      void watchJob(job.id);
    } else if (job.status === 'success') {
      pushToast('success', `${label} berhasil dibuat.`);
    } else {
      pushToast('error', job.errorMessage || `${label} gagal.`);
    }
  };

  const handleTriggerJson = async () => {
    setFormError('');
    setRunningJson(true);
    try {
      const job = await triggerBackup(selected);
      await startJob(job, 'Backup JSON');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal trigger backup.');
    } finally {
      setRunningJson(false);
    }
  };

  const handleTriggerSql = async () => {
    setFormError('');
    setRunningSql(true);
    try {
      const job = await createSqlBackup();
      await startJob(job, 'Export SQL');
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Gagal export SQL full DB.',
      );
    } finally {
      setRunningSql(false);
    }
  };

  const handleDownload = async (job: BackupJob) => {
    setDownloadingId(job.id);
    try {
      await downloadBackupFile(job);
      pushToast('success', 'Unduhan dimulai.');
    } catch (err) {
      pushToast(
        'error',
        err instanceof Error ? err.message : 'Gagal mengunduh backup.',
      );
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePickImport = (file: File | null) => {
    if (!file) return;
    setPendingImport(file);
  };

  const handleConfirmImport = async () => {
    if (!pendingImport) return;
    setImporting(true);
    try {
      const result = await importBackupFile(pendingImport);
      if (result.mode === 'sql') {
        pushToast(
          'success',
          'Import SQL berhasil. Sesi akan diakhiri — login ulang.',
        );
        await logout();
        window.location.assign('/');
        return;
      }
      pushToast('success', 'Import JSON berhasil (data family diganti).');
      load();
    } finally {
      setImporting(false);
      setPendingImport(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) return <AdminLoading label="Memuat riwayat backup…" />;
  if (error) return <AdminError message={error} onRetry={load} />;

  const pendingIsSql = pendingImport ? isSqlImportFile(pendingImport) : false;
  const busy = runningJson || runningSql || importing;

  return (
    <div>
      <AdminPageHeader
        title="Backup & Export"
        description="Export JSON per modul, export SQL full database, atau import file cadangan. Job async — status ter-update otomatis."
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl border border-ink-200/80 bg-white/90 p-5 shadow-sm">
            <h2 className="font-admin-display text-lg font-semibold text-ink-900">
              Export JSON (modul)
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              Pilih modul yang ingin diarsipkan sebagai file JSON.
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
              disabled={busy || selected.length === 0}
              onClick={() => void handleTriggerJson()}
              className="mt-5 w-full rounded-xl bg-admin-600 px-4 py-3 text-sm font-semibold text-white hover:bg-admin-700 disabled:opacity-60"
            >
              {runningJson ? 'Memulai…' : 'Export JSON'}
            </button>
          </section>

          <section className="rounded-2xl border border-ink-200/80 bg-white/90 p-5 shadow-sm">
            <h2 className="font-admin-display text-lg font-semibold text-ink-900">
              Export SQL (full DB)
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              Dump seluruh database sebagai <code>.sql.zip</code>. Cocok untuk
              restore server / disaster recovery.
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleTriggerSql()}
              className="mt-5 w-full rounded-xl border border-admin-300 bg-admin-50 px-4 py-3 text-sm font-semibold text-admin-800 hover:bg-admin-100 disabled:opacity-60"
            >
              {runningSql ? 'Memulai…' : 'Export SQL (full DB)'}
            </button>
          </section>

          <section className="rounded-2xl border border-ink-200/80 bg-white/90 p-5 shadow-sm">
            <h2 className="font-admin-display text-lg font-semibold text-ink-900">
              Import
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              JSON mengganti data family aktif. SQL menimpa{' '}
              <strong className="font-semibold text-ink-700">
                seluruh database
              </strong>
              .
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept={IMPORT_ACCEPT}
              className="mt-4 block w-full text-sm text-ink-600 file:mr-3 file:rounded-lg file:border-0 file:bg-ink-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-ink-800 hover:file:bg-ink-200"
              disabled={busy}
              onChange={(e) =>
                handlePickImport(e.target.files?.[0] ?? null)
              }
            />
            <p className="mt-2 text-xs text-ink-400">
              Format: <code>.json</code>, <code>.sql</code>,{' '}
              <code>.sql.gz</code>, <code>.sql.zip</code>
            </p>
          </section>
        </div>

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
                      <th className="px-4 py-3 font-semibold">Format</th>
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
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink-600">
                            {job.format === 'sql' ? '.sql.zip' : '.json'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-ink-700">
                          {job.format === 'sql'
                            ? 'Full database'
                            : job.moduleIds.join(', ') || '—'}
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
                          {job.status === 'success' ? (
                            <button
                              type="button"
                              disabled={downloadingId === job.id}
                              onClick={() => void handleDownload(job)}
                              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-admin-700 hover:bg-admin-50 disabled:opacity-60"
                            >
                              <Download size={14} />
                              {downloadingId === job.id
                                ? 'Mengunduh…'
                                : 'Unduh'}
                            </button>
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

      <ConfirmDialog
        isOpen={Boolean(pendingImport)}
        title={
          pendingIsSql
            ? 'Import SQL — overwrite seluruh DB?'
            : 'Import JSON — ganti data family?'
        }
        tone="danger"
        confirmLabel={pendingIsSql ? 'Overwrite database' : 'Import JSON'}
        description={
          pendingIsSql ? (
            <div className="space-y-2">
              <p>
                File <strong>{pendingImport?.name}</strong> akan menimpa{' '}
                <strong>seluruh database</strong> (semua family, token, money,
                dll.).
              </p>
              <p>Setelah sukses Anda akan di-logout dan harus login ulang.</p>
            </div>
          ) : (
            <p>
              File <strong>{pendingImport?.name}</strong> akan mengganti data
              family aktif (roots/core) sesuai isi backup JSON.
            </p>
          )
        }
        onClose={() => {
          if (importing) return;
          setPendingImport(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }}
        onConfirm={handleConfirmImport}
      />
    </div>
  );
}
