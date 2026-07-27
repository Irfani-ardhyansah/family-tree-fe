import { useEffect, useState } from 'react';
import { Image as ImageIcon } from 'react-feather';
import {
  fetchSettings,
  saveSettings,
  uploadSettingsLogo,
} from '@/modules/admin/api/adminApi';
import { useAdminToast } from '@/modules/admin/components/AdminToast';
import {
  AdminError,
  AdminLoading,
  AdminPageHeader,
} from '@/modules/admin/components/PageState';
import type { AppSettings } from '@/modules/admin/types';

const TIMEZONES = [
  'Asia/Jakarta',
  'Asia/Makassar',
  'Asia/Jayapura',
  'Asia/Singapore',
  'UTC',
];

const CURRENCIES = ['IDR', 'USD', 'SGD', 'MYR', 'EUR'];

export function SettingsPage() {
  const { pushToast } = useAdminToast();
  const [form, setForm] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    void fetchSettings()
      .then(setForm)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Gagal memuat pengaturan'),
      )
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleLogoUpload = async (file: File | null) => {
    if (!form) return;
    if (!file) {
      setForm({ ...form, logoUrl: null });
      return;
    }

    setFormError('');
    setUploadingLogo(true);
    try {
      const logoUrl = await uploadSettingsLogo(file);
      setForm({ ...form, logoUrl });
      pushToast('success', 'Logo diunggah.');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal upload logo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    if (!form) return;
    setFormError('');
    setSaving(true);
    try {
      const saved = await saveSettings(form);
      setForm(saved);
      pushToast('success', 'Pengaturan disimpan.');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal menyimpan.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AdminLoading label="Memuat pengaturan…" />;
  if (error) return <AdminError message={error} onRetry={load} />;
  if (!form) return null;

  return (
    <div>
      <AdminPageHeader
        title="Pengaturan"
        description="Konfigurasi umum aplikasi keluarga — nama, timezone, currency, dan branding."
      />

      <div className="max-w-2xl rounded-2xl border border-ink-200/80 bg-white/90 p-5 shadow-sm sm:p-6">
        <div className="space-y-5">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-400">
              Nama keluarga / aplikasi
            </span>
            <input
              value={form.familyName}
              onChange={(e) =>
                setForm({ ...form, familyName: e.target.value })
              }
              className="mt-1.5 w-full rounded-xl border-ink-200 text-sm focus:border-admin-500 focus:ring-admin-500"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                Timezone
              </span>
              <select
                value={form.timezone}
                onChange={(e) =>
                  setForm({ ...form, timezone: e.target.value })
                }
                className="mt-1.5 w-full rounded-xl border-ink-200 text-sm focus:border-admin-500 focus:ring-admin-500"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                Currency default
              </span>
              <select
                value={form.currency}
                onChange={(e) =>
                  setForm({ ...form, currency: e.target.value })
                }
                className="mt-1.5 w-full rounded-xl border-ink-200 text-sm focus:border-admin-500 focus:ring-admin-500"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-400">
              Logo / branding (opsional)
            </span>
            <div className="mt-2 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-ink-300 bg-ink-50">
                {form.logoUrl ? (
                  <img
                    src={form.logoUrl}
                    alt="Logo"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImageIcon size={22} className="text-ink-300" />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label
                  className={`inline-flex cursor-pointer rounded-xl bg-ink-900 px-3 py-2 text-xs font-semibold text-white hover:bg-ink-800 ${
                    uploadingLogo ? 'pointer-events-none opacity-60' : ''
                  }`}
                >
                  {uploadingLogo ? 'Mengunggah…' : 'Upload gambar'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingLogo}
                    onChange={(e) =>
                      void handleLogoUpload(e.target.files?.[0] ?? null)
                    }
                  />
                </label>
                {form.logoUrl && (
                  <button
                    type="button"
                    onClick={() => void handleLogoUpload(null)}
                    className="text-xs font-semibold text-rose-600 hover:underline"
                  >
                    Hapus logo
                  </button>
                )}
              </div>
            </div>
            <p className="mt-2 text-xs text-ink-400">
              Logo diunggah langsung ke server. Klik Simpan untuk menyimpan
              perubahan lain (termasuk hapus logo).
            </p>
          </div>

          {formError && (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {formError}
            </p>
          )}

          <button
            type="button"
            disabled={saving || uploadingLogo}
            onClick={() => void handleSave()}
            className="rounded-xl bg-admin-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-admin-700 disabled:opacity-60"
          >
            {saving ? 'Menyimpan…' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>
    </div>
  );
}
