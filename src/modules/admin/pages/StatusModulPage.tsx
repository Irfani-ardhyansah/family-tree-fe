import { useEffect, useState } from 'react';
import { Switch } from '@headlessui/react';
import {
  fetchModuleStatuses,
  toggleModuleStatus,
} from '@/modules/admin/api/adminApi';
import { ConfirmDialog } from '@/modules/admin/components/ConfirmDialog';
import {
  AdminError,
  AdminLoading,
  AdminPageHeader,
} from '@/modules/admin/components/PageState';
import { useAdminToast } from '@/modules/admin/components/AdminToast';
import type { ModuleRuntimeStatus } from '@/modules/admin/types';
import { formatRelativeTime } from '@/modules/admin/utils/format';
import { useAuth } from '@/shared/context/AuthContext';
import { MODULE_CATALOG, type AppModuleId } from '@/shared/data/moduleCatalog';
import { shortPersonName } from '@/shared/utils/personDisplayName';

export function StatusModulPage() {
  const { person, refreshPerson } = useAuth();
  const { pushToast } = useAdminToast();
  const [statuses, setStatuses] = useState<ModuleRuntimeStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingOff, setPendingOff] = useState<AppModuleId | null>(null);
  const [togglingId, setTogglingId] = useState<AppModuleId | null>(null);

  const actorName = person
    ? shortPersonName(person, person.fullName)
    : 'Admin';

  const load = () => {
    setLoading(true);
    setError('');
    void fetchModuleStatuses()
      .then(setStatuses)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Gagal memuat status'),
      )
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const applyToggle = async (moduleId: AppModuleId, enabled: boolean) => {
    const prev = statuses;
    setTogglingId(moduleId);
    setStatuses((list) =>
      list.map((m) =>
        m.moduleId === moduleId
          ? {
              ...m,
              enabled,
              updatedAt: new Date().toISOString(),
              updatedBy: actorName,
            }
          : m,
      ),
    );
    try {
      const updated = await toggleModuleStatus(moduleId, enabled, actorName);
      setStatuses((list) =>
        list.map((m) => (m.moduleId === moduleId ? updated : m)),
      );
      try {
        await refreshPerson();
      } catch {
        // accessVersion refresh best-effort
      }
      pushToast(
        'success',
        enabled ? 'Modul diaktifkan.' : 'Modul dimatikan.',
      );
    } catch (err) {
      setStatuses(prev);
      pushToast(
        'error',
        err instanceof Error ? err.message : 'Gagal mengubah status modul.',
      );
    } finally {
      setTogglingId(null);
    }
  };

  const handleToggle = (moduleId: AppModuleId, next: boolean) => {
    if (!next) {
      setPendingOff(moduleId);
      return;
    }
    void applyToggle(moduleId, true);
  };

  if (loading) return <AdminLoading label="Memuat status modul…" />;
  if (error) return <AdminError message={error} onRetry={load} />;

  return (
    <div>
      <AdminPageHeader
        title="Status Modul"
        description="Nyalakan atau matikan modul secara global. Perubahan memicu refresh permission di sisi user."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {MODULE_CATALOG.map((mod) => {
          const status = statuses.find((s) => s.moduleId === mod.id);
          const enabled = status?.enabled ?? true;
          const Icon = mod.Icon;
          const busy = togglingId === mod.id;

          return (
            <div
              key={mod.id}
              className={`relative overflow-hidden rounded-2xl border bg-white/90 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                enabled
                  ? 'border-ink-200/80'
                  : 'border-ink-200/60 bg-ink-50/80 opacity-90'
              }`}
            >
              <div
                className={`absolute inset-x-0 top-0 h-1 ${
                  enabled ? 'bg-admin-500' : 'bg-ink-300'
                }`}
              />
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-900 text-admin-300">
                    <Icon size={22} />
                  </span>
                  <div>
                    <h3 className="font-semibold text-ink-900">{mod.title}</h3>
                    <p className="text-xs text-ink-400">{mod.subtitle}</p>
                  </div>
                </div>
                <Switch
                  checked={enabled}
                  disabled={busy}
                  onChange={(v) => handleToggle(mod.id, v)}
                  className={`${
                    enabled ? 'bg-admin-600' : 'bg-ink-300'
                  } relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full transition disabled:opacity-50`}
                >
                  <span
                    className={`${
                      enabled ? 'translate-x-6' : 'translate-x-1'
                    } pointer-events-none inline-block h-5 w-5 translate-y-1 transform rounded-full bg-white shadow transition`}
                  />
                </Switch>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-ink-500">
                {mod.description}
              </p>
              <p className="mt-4 text-xs text-ink-400">
                {status
                  ? `Diubah ${formatRelativeTime(status.updatedAt)} oleh ${status.updatedBy}`
                  : 'Belum ada riwayat perubahan'}
              </p>
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        isOpen={pendingOff != null}
        title="Matikan modul?"
        description="Modul ini akan tidak bisa diakses oleh semua user. Lanjutkan?"
        confirmLabel="Matikan modul"
        tone="warning"
        onClose={() => setPendingOff(null)}
        onConfirm={async () => {
          if (pendingOff) await applyToggle(pendingOff, false);
        }}
      />
    </div>
  );
}
