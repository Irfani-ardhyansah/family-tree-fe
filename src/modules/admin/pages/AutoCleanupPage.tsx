import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Archive,
  Clipboard,
  Clock,
  Database,
  FileText,
  HardDrive,
  Play,
  RefreshCw,
  Save,
  Trash2,
} from 'react-feather';
import {
  fetchCleanupSettings,
  previewCleanup,
  runCleanupNow,
  saveCleanupSettings,
} from '@/modules/admin/api/adminApi';
import { useAdminToast } from '@/modules/admin/components/AdminToast';
import { ConfirmDialog } from '@/modules/admin/components/ConfirmDialog';
import {
  AdminError,
  AdminLoading,
  AdminPageHeader,
} from '@/modules/admin/components/PageState';
import type {
  CleanupDeleted,
  CleanupSettings,
  CleanupTarget,
} from '@/modules/admin/types';
import { formatDateTime } from '@/modules/admin/utils/format';

const RETENTION_PRESETS: { days: number; label: string }[] = [
  { days: 7, label: '1 minggu' },
  { days: 14, label: '2 minggu' },
  { days: 30, label: '1 bulan' },
  { days: 90, label: '3 bulan' },
  { days: 180, label: '6 bulan' },
];

const TARGET_META: {
  id: CleanupTarget;
  label: string;
  description: string;
  kind: 'db' | 'file';
  Icon: typeof Clipboard;
}[] = [
  {
    id: 'appLogs',
    label: 'Log aktivitas (database)',
    description: 'Baris log audit & log aplikasi yang lebih lama dari batas usia.',
    kind: 'db',
    Icon: Clipboard,
  },
  {
    id: 'backupHistory',
    label: 'Riwayat backup (database)',
    description: 'Metadata job backup/export lama yang sudah tidak dipakai.',
    kind: 'db',
    Icon: Database,
  },
  {
    id: 'backupFiles',
    label: 'File backup & export',
    description: 'File .json dan .sql.zip hasil export yang menumpuk di server.',
    kind: 'file',
    Icon: Archive,
  },
  {
    id: 'logFiles',
    label: 'File log server',
    description: 'File *.log di direktori logs server.',
    kind: 'file',
    Icon: FileText,
  },
];

const EMPTY_DELETED: CleanupDeleted = {
  appLogs: 0,
  backupHistory: 0,
  backupFiles: 0,
  logFiles: 0,
  freedBytes: 0,
};

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024)),
  );
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

function cutoffLabel(retentionDays: number): string {
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(cutoff);
}

export function AutoCleanupPage() {
  const { pushToast } = useAdminToast();

  const [settings, setSettings] = useState<CleanupSettings | null>(null);
  const [preview, setPreview] = useState<CleanupDeleted>(EMPTY_DELETED);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [confirmRun, setConfirmRun] = useState(false);

  const [enabled, setEnabled] = useState(false);
  const [retentionDays, setRetentionDays] = useState(14);
  const [targets, setTargets] = useState<CleanupSettings['targets']>(
    EMPTY_DELETED_TARGETS(),
  );

  const load = () => {
    setLoading(true);
    setError('');
    void Promise.all([fetchCleanupSettings(), previewCleanup()])
      .then(([fetched, counts]) => {
        setSettings(fetched);
        setEnabled(fetched.enabled);
        setRetentionDays(fetched.retentionDays);
        setTargets(fetched.targets);
        setPreview(counts);
      })
      .catch((err: unknown) =>
        setError(
          err instanceof Error ? err.message : 'Gagal memuat pengaturan.',
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const dirty = useMemo(() => {
    if (!settings) return false;
    return (
      enabled !== settings.enabled ||
      retentionDays !== settings.retentionDays ||
      JSON.stringify(targets) !== JSON.stringify(settings.targets)
    );
  }, [settings, enabled, retentionDays, targets]);

  const enabledTargetCount = TARGET_META.filter((t) => targets[t.id]).length;
  const dbRows = preview.appLogs + preview.backupHistory;
  const files = preview.backupFiles + preview.logFiles;

  const refreshPreview = async () => {
    try {
      setPreview(await previewCleanup());
    } catch {
      // preview best-effort
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const saved = await saveCleanupSettings({
        enabled,
        retentionDays,
        targets,
      });
      setSettings(saved);
      setEnabled(saved.enabled);
      setRetentionDays(saved.retentionDays);
      setTargets(saved.targets);
      await refreshPreview();
      pushToast('success', 'Pengaturan pembersihan otomatis disimpan.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan.');
    } finally {
      setSaving(false);
    }
  };

  const handleRun = async () => {
    setRunning(true);
    setError('');
    try {
      // Pastikan BE memakai pengaturan terbaru sebelum menjalankan.
      if (dirty) {
        const saved = await saveCleanupSettings({
          enabled,
          retentionDays,
          targets,
        });
        setSettings(saved);
        setEnabled(saved.enabled);
        setRetentionDays(saved.retentionDays);
        setTargets(saved.targets);
      }
      const result = await runCleanupNow();
      setSettings(result);
      await refreshPreview();
      const del = result.lastDeleted ?? EMPTY_DELETED;
      pushToast(
        'success',
        `Pembersihan selesai — ${del.appLogs + del.backupHistory} baris DB & ${del.backupFiles + del.logFiles} file dihapus.`,
      );
      setConfirmRun(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menjalankan.');
    } finally {
      setRunning(false);
    }
  };

  if (loading) return <AdminLoading label="Memuat pengaturan…" />;
  if (error && !settings)
    return <AdminError message={error} onRetry={load} />;
  if (!settings) return null;

  return (
    <div>
      <AdminPageHeader
        title="Pembersihan Otomatis"
        description="Hapus log, file backup/export, dan data lama secara otomatis sesuai batas usia."
      />

      {error ? (
        <p className="mb-4 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Status */}
          <section className="rounded-2xl border border-ink-200/80 bg-white/90 p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                    enabled
                      ? 'bg-admin-50 text-admin-700'
                      : 'bg-ink-100 text-ink-400'
                  }`}
                >
                  <Trash2 size={20} />
                </div>
                <div>
                  <h2 className="font-admin-display text-lg font-semibold text-ink-900">
                    Pembersihan otomatis
                  </h2>
                  <p className="mt-1 max-w-md text-sm text-ink-500">
                    Saat aktif, server menghapus data yang lebih lama dari batas
                    usia sesuai jadwal. Tanpa ini, log dan file backup akan
                    menumpuk terus.
                  </p>
                </div>
              </div>
              <Toggle
                checked={enabled}
                onChange={setEnabled}
                label={enabled ? 'Aktif' : 'Nonaktif'}
              />
            </div>
          </section>

          {/* Retensi */}
          <section className="rounded-2xl border border-ink-200/80 bg-white/90 p-5 shadow-sm sm:p-6">
            <h2 className="font-admin-display text-lg font-semibold text-ink-900">
              Batas usia data
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              Data yang lebih lama dari batas ini yang akan dihapus.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {RETENTION_PRESETS.map((preset) => {
                const active = retentionDays === preset.days;
                const disabled = preset.days < settings.minRetentionDays;
                return (
                  <button
                    key={preset.days}
                    type="button"
                    disabled={disabled}
                    onClick={() => setRetentionDays(preset.days)}
                    className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                      active
                        ? 'border-admin-300 bg-admin-50 text-admin-800'
                        : 'border-ink-200 text-ink-600 hover:bg-ink-50'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-ink-50 px-3.5 py-3 text-sm text-ink-600">
              <Clock size={16} className="mt-0.5 shrink-0 text-ink-400" />
              <span>
                Menghapus data sebelum{' '}
                <strong className="font-semibold text-ink-800">
                  {cutoffLabel(retentionDays)}
                </strong>{' '}
                ({retentionDays} hari ke belakang). Batas minimum{' '}
                {settings.minRetentionDays} hari demi keamanan.
              </span>
            </div>
          </section>

          {/* Target */}
          <section className="rounded-2xl border border-ink-200/80 bg-white/90 p-5 shadow-sm sm:p-6">
            <h2 className="font-admin-display text-lg font-semibold text-ink-900">
              Yang dibersihkan
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              Pilih jenis data. Angka mengikuti pengaturan tersimpan —
              simpan untuk memperbarui.
            </p>
            <ul className="mt-4 space-y-2">
              {TARGET_META.map((target) => {
                const checked = targets[target.id];
                const count = preview[target.id];
                return (
                  <li key={target.id}>
                    <label
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-3 transition ${
                        checked
                          ? 'border-admin-300 bg-admin-50/60'
                          : 'border-ink-200 hover:bg-ink-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          setTargets((prev) => ({
                            ...prev,
                            [target.id]: e.target.checked,
                          }))
                        }
                        className="mt-0.5 rounded border-ink-300 text-admin-600 focus:ring-admin-500"
                      />
                      <target.Icon size={16} className="mt-0.5 text-ink-500" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-ink-800">
                            {target.label}
                          </span>
                          <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-500">
                            {target.kind === 'db' ? 'database' : 'file'}
                          </span>
                        </span>
                        <span className="mt-0.5 block text-xs text-ink-500">
                          {target.description}
                        </span>
                      </span>
                      <span className="ml-auto shrink-0 text-sm font-semibold text-ink-700">
                        {checked ? count.toLocaleString('id-ID') : '—'}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
            {enabledTargetCount === 0 ? (
              <p className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                <AlertTriangle size={14} />
                Pilih minimal satu jenis data agar pembersihan berjalan.
              </p>
            ) : null}
          </section>
        </div>

        {/* Aside */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-ink-200/80 bg-white/90 p-5 shadow-sm">
            <h2 className="font-admin-display text-lg font-semibold text-ink-900">
              Ringkasan
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-ink-500">Baris database</dt>
                <dd className="font-semibold text-ink-800">
                  {dbRows.toLocaleString('id-ID')}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-ink-500">File dihapus</dt>
                <dd className="font-semibold text-ink-800">
                  {files.toLocaleString('id-ID')}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-1.5 text-ink-500">
                  <HardDrive size={14} /> Ruang dibebaskan
                </dt>
                <dd className="font-semibold text-ink-800">
                  {formatBytes(preview.freedBytes)}
                </dd>
              </div>
            </dl>

            <button
              type="button"
              disabled={running || !enabled || enabledTargetCount === 0}
              onClick={() => setConfirmRun(true)}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-admin-600 px-4 py-3 text-sm font-semibold text-white hover:bg-admin-700 disabled:opacity-50"
            >
              <Play size={15} />
              {running ? 'Menjalankan…' : 'Jalankan sekarang'}
            </button>
            <p className="mt-2 text-center text-[11px] text-ink-400">
              Menghapus data lama secara nyata di server.
            </p>
          </section>

          <section className="rounded-2xl border border-ink-200/80 bg-white/90 p-5 shadow-sm">
            <h2 className="font-admin-display text-lg font-semibold text-ink-900">
              Jadwal & status
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-1.5 text-ink-500">
                  <RefreshCw size={14} /> Jadwal
                </dt>
                <dd className="text-right font-semibold text-ink-800">
                  {settings.scheduleLabel}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-500">Terakhir jalan</dt>
                <dd className="text-right font-semibold text-ink-800">
                  {settings.lastRunAt
                    ? formatDateTime(settings.lastRunAt)
                    : 'Belum pernah'}
                </dd>
              </div>
              {settings.lastDeleted ? (
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-ink-500">Hasil terakhir</dt>
                  <dd className="text-right font-semibold text-ink-800">
                    {(
                      settings.lastDeleted.appLogs +
                      settings.lastDeleted.backupHistory
                    ).toLocaleString('id-ID')}{' '}
                    baris · {formatBytes(settings.lastDeleted.freedBytes)}
                  </dd>
                </div>
              ) : null}
            </dl>
            <p className="mt-3 rounded-xl bg-ink-50 px-3 py-2 text-[11px] text-ink-500">
              Jadwal sebenarnya diatur di server lewat variabel lingkungan
              (lihat panduan STB). UI ini hanya menampilkan.
            </p>
          </section>

          <button
            type="button"
            disabled={!dirty || saving}
            onClick={() => void handleSave()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-admin-300 bg-admin-50 px-4 py-3 text-sm font-semibold text-admin-800 hover:bg-admin-100 disabled:opacity-50"
          >
            <Save size={15} />
            {saving ? 'Menyimpan…' : dirty ? 'Simpan pengaturan' : 'Tersimpan'}
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmRun}
        title="Jalankan pembersihan sekarang?"
        tone="warning"
        confirmLabel="Jalankan"
        description={
          <div className="space-y-2">
            <p>
              Akan menghapus data sebelum{' '}
              <strong>{cutoffLabel(settings.retentionDays)}</strong> pada{' '}
              {enabledTargetCount} jenis data terpilih.
            </p>
            <p className="text-xs text-ink-400">
              Estimasi: {dbRows.toLocaleString('id-ID')} baris database,{' '}
              {files} file, {formatBytes(preview.freedBytes)}.
            </p>
          </div>
        }
        onClose={() => setConfirmRun(false)}
        onConfirm={handleRun}
      />
    </div>
  );
}

function EMPTY_DELETED_TARGETS(): CleanupSettings['targets'] {
  return {
    appLogs: true,
    backupHistory: true,
    backupFiles: true,
    logFiles: false,
  };
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-3"
    >
      <span className="text-sm font-semibold text-ink-700">{label}</span>
      <span
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
          checked ? 'bg-admin-600' : 'bg-ink-200'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </span>
    </button>
  );
}
