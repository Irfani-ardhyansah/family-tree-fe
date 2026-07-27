import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Switch,
  Transition,
  TransitionChild,
} from '@headlessui/react';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { Edit2, Plus, Trash2 } from 'react-feather';
import {
  createAgeRule,
  deleteAgeRule,
  fetchAgeRules,
  updateAgeRule,
} from '@/modules/admin/api/adminApi';
import { ConfirmDialog } from '@/modules/admin/components/ConfirmDialog';
import { useAdminToast } from '@/modules/admin/components/AdminToast';
import {
  AdminEmpty,
  AdminError,
  AdminLoading,
  AdminPageHeader,
} from '@/modules/admin/components/PageState';
import type { AgeAccessRule } from '@/modules/admin/types';
import {
  formatAgeRange,
  formatRelativeTime,
} from '@/modules/admin/utils/format';
import { MODULE_CATALOG, type AppModuleId } from '@/shared/data/moduleCatalog';

type FormState = {
  id?: string;
  moduleId: AppModuleId;
  minAge: string;
  maxAge: string;
  note: string;
  noMax: boolean;
  isActive: boolean;
};

const emptyForm = (moduleId?: AppModuleId): FormState => ({
  moduleId: moduleId ?? 'roots',
  minAge: '0',
  maxAge: '',
  note: '',
  noMax: true,
  isActive: true,
});

export function RbacModulPage() {
  const { pushToast } = useAdminToast();
  const [rules, setRules] = useState<AgeAccessRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError('');
    void fetchAgeRules()
      .then(setRules)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Gagal memuat rule'),
      )
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const grouped = useMemo(() => {
    return MODULE_CATALOG.map((mod) => ({
      mod,
      rules: rules.filter((r) => r.moduleId === mod.id),
    }));
  }, [rules]);

  const openCreate = (moduleId?: AppModuleId) => {
    setForm(emptyForm(moduleId));
    setFormError('');
    setFormOpen(true);
  };

  const openEdit = (rule: AgeAccessRule) => {
    setForm({
      id: rule.id,
      moduleId: rule.moduleId,
      minAge: String(rule.minAge),
      maxAge: rule.maxAge == null ? '' : String(rule.maxAge),
      note: rule.note ?? '',
      noMax: rule.maxAge == null,
      isActive: rule.isActive,
    });
    setFormError('');
    setFormOpen(true);
  };

  const handleSave = async () => {
    setFormError('');
    const minAge = Number(form.minAge);
    const maxAge = form.noMax ? null : Number(form.maxAge);
    if (!Number.isFinite(minAge) || minAge < 0) {
      setFormError('Umur minimum harus angka ≥ 0.');
      return;
    }
    if (!form.noMax && (!Number.isFinite(maxAge) || (maxAge as number) < 0)) {
      setFormError('Umur maksimum tidak valid.');
      return;
    }
    if (maxAge != null && minAge > maxAge) {
      setFormError('Umur minimum tidak boleh lebih besar dari umur maksimum.');
      return;
    }

    setSaving(true);
    try {
      if (form.id) {
        const updated = await updateAgeRule({
          id: form.id,
          moduleId: form.moduleId,
          minAge,
          maxAge,
          note: form.note.trim() || undefined,
          isActive: form.isActive,
        });
        setRules((list) =>
          list.map((r) => (r.id === updated.id ? updated : r)),
        );
        pushToast('success', 'Rule berhasil diperbarui.');
      } else {
        const created = await createAgeRule({
          moduleId: form.moduleId,
          minAge,
          maxAge,
          note: form.note.trim() || undefined,
          isActive: form.isActive,
        });
        setRules((list) => [created, ...list]);
        pushToast('success', 'Rule berhasil ditambahkan.');
      }
      setFormOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal menyimpan.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (rule: AgeAccessRule) => {
    const prev = rules;
    setRules((list) =>
      list.map((r) =>
        r.id === rule.id ? { ...r, isActive: !r.isActive } : r,
      ),
    );
    try {
      const updated = await updateAgeRule({
        id: rule.id,
        isActive: !rule.isActive,
      });
      setRules((list) => list.map((r) => (r.id === updated.id ? updated : r)));
    } catch (err) {
      setRules(prev);
      pushToast(
        'error',
        err instanceof Error ? err.message : 'Gagal mengubah status rule.',
      );
    }
  };

  if (loading) return <AdminLoading label="Memuat RBAC modul…" />;
  if (error) return <AdminError message={error} onRetry={load} />;

  return (
    <div>
      <AdminPageHeader
        title="RBAC Modul"
        description="Atur rentang umur yang boleh mengakses tiap modul. Satu modul bisa punya beberapa rule."
        actions={
          <button
            type="button"
            onClick={() => openCreate()}
            className="inline-flex items-center gap-2 rounded-xl bg-admin-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-admin-700"
          >
            <Plus size={16} />
            Tambah Rule
          </button>
        }
      />

      {rules.length === 0 ? (
        <AdminEmpty
          title="Belum ada rule umur"
          description="Tambahkan rule pertama untuk membatasi akses modul berdasarkan usia."
          action={
            <button
              type="button"
              onClick={() => openCreate()}
              className="rounded-xl bg-admin-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Tambah Rule
            </button>
          }
        />
      ) : (
        <div className="space-y-5">
          {grouped.map(({ mod, rules: modRules }) => (
            <section
              key={mod.id}
              className="overflow-hidden rounded-2xl border border-ink-200/80 bg-white/90 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3 border-b border-ink-100 bg-ink-50/80 px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <mod.Icon size={18} className="text-admin-700" />
                  <h2 className="font-semibold text-ink-900">{mod.title}</h2>
                  <span className="rounded-full bg-ink-200/70 px-2 py-0.5 text-[11px] font-semibold text-ink-600">
                    {modRules.length} rule
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => openCreate(mod.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-admin-700 hover:bg-admin-50"
                >
                  <Plus size={14} />
                  Tambah
                </button>
              </div>

              {modRules.length === 0 ? (
                <p className="px-4 py-6 text-sm text-ink-400">
                  Belum ada rule untuk modul ini.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="text-xs uppercase tracking-wider text-ink-400">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Rentang umur</th>
                        <th className="px-4 py-3 font-semibold">Keterangan</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                        <th className="px-4 py-3 font-semibold">Diubah</th>
                        <th className="px-4 py-3 font-semibold" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-100">
                      {modRules.map((rule) => (
                        <tr key={rule.id} className="hover:bg-admin-50/30">
                          <td className="px-4 py-3 font-medium text-ink-800">
                            {formatAgeRange(rule.minAge, rule.maxAge)}
                          </td>
                          <td className="px-4 py-3 text-ink-500">
                            {rule.note || '—'}
                          </td>
                          <td className="px-4 py-3">
                            <Switch
                              checked={rule.isActive}
                              onChange={() => void handleToggle(rule)}
                              className={`${
                                rule.isActive ? 'bg-admin-600' : 'bg-ink-300'
                              } relative inline-flex h-6 w-11 rounded-full transition`}
                            >
                              <span
                                className={`${
                                  rule.isActive
                                    ? 'translate-x-6'
                                    : 'translate-x-1'
                                } inline-block h-4 w-4 translate-y-1 rounded-full bg-white shadow transition`}
                              />
                            </Switch>
                          </td>
                          <td className="px-4 py-3 text-ink-400">
                            {formatRelativeTime(rule.updatedAt)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => openEdit(rule)}
                                className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 hover:text-ink-800"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteId(rule.id)}
                                className="rounded-lg p-2 text-ink-500 hover:bg-rose-50 hover:text-rose-600"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ))}
        </div>
      )}

      <Transition appear show={formOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50 font-admin"
          onClose={() => !saving && setFormOpen(false)}
        >
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-ink-950/45 backdrop-blur-[2px]" />
          </TransitionChild>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <DialogPanel className="w-full max-w-lg rounded-2xl border border-ink-200 bg-white p-5 shadow-2xl sm:p-6">
                  <DialogTitle className="font-admin-display text-xl font-bold text-ink-900">
                    {form.id ? 'Edit Rule Umur' : 'Tambah Rule Umur'}
                  </DialogTitle>

                  <div className="mt-5 space-y-4">
                    <label className="block">
                      <span className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                        Modul
                      </span>
                      <select
                        value={form.moduleId}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            moduleId: e.target.value as AppModuleId,
                          }))
                        }
                        className="mt-1.5 w-full rounded-xl border-ink-200 text-sm focus:border-admin-500 focus:ring-admin-500"
                      >
                        {MODULE_CATALOG.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.title}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                      <label className="block">
                        <span className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                          Umur min
                        </span>
                        <input
                          type="number"
                          min={0}
                          value={form.minAge}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, minAge: e.target.value }))
                          }
                          className="mt-1.5 w-full rounded-xl border-ink-200 text-sm focus:border-admin-500 focus:ring-admin-500"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                          Umur max
                        </span>
                        <input
                          type="number"
                          min={0}
                          disabled={form.noMax}
                          value={form.maxAge}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, maxAge: e.target.value }))
                          }
                          placeholder={form.noMax ? 'Tanpa batas' : ''}
                          className="mt-1.5 w-full rounded-xl border-ink-200 text-sm focus:border-admin-500 focus:ring-admin-500 disabled:bg-ink-50"
                        />
                      </label>
                    </div>

                    <label className="flex items-center gap-2 text-sm text-ink-600">
                      <input
                        type="checkbox"
                        checked={form.noMax}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            noMax: e.target.checked,
                            maxAge: e.target.checked ? '' : f.maxAge,
                          }))
                        }
                        className="rounded border-ink-300 text-admin-600 focus:ring-admin-500"
                      />
                      Tanpa batas atas (umur max = infinity)
                    </label>

                    <label className="block">
                      <span className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                        Keterangan (opsional)
                      </span>
                      <textarea
                        rows={2}
                        value={form.note}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, note: e.target.value }))
                        }
                        className="mt-1.5 w-full rounded-xl border-ink-200 text-sm focus:border-admin-500 focus:ring-admin-500"
                      />
                    </label>

                    <label className="flex items-center gap-2 text-sm text-ink-600">
                      <input
                        type="checkbox"
                        checked={form.isActive}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, isActive: e.target.checked }))
                        }
                        className="rounded border-ink-300 text-admin-600 focus:ring-admin-500"
                      />
                      Rule aktif
                    </label>

                    {formError && (
                      <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
                        {formError}
                      </p>
                    )}
                  </div>

                  <div className="mt-6 flex justify-end gap-2">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => setFormOpen(false)}
                      className="rounded-xl px-4 py-2.5 text-sm font-semibold text-ink-600 hover:bg-ink-100"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void handleSave()}
                      className="rounded-xl bg-admin-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-admin-700 disabled:opacity-60"
                    >
                      {saving ? 'Menyimpan…' : 'Simpan'}
                    </button>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>

      <ConfirmDialog
        isOpen={deleteId != null}
        title="Hapus rule?"
        description="Rule umur ini akan dihapus permanen dari konfigurasi akses modul."
        confirmLabel="Hapus"
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteId) return;
          await deleteAgeRule(deleteId);
          setRules((list) => list.filter((r) => r.id !== deleteId));
          pushToast('success', 'Rule dihapus.');
        }}
      />
    </div>
  );
}
