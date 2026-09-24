import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react';
import { platformAuthenticatorIsAvailable } from '@simplewebauthn/browser';
import { ArrowRight, X } from 'react-feather';
import { FingerprintMark } from '@/shared/components/ui/FingerprintMark';
import { useAuth } from '@/shared/context/AuthContext';
import { ApiClientError } from '@/shared/lib/apiClient';
import {
  clearBiometricLoginMarker,
  isBiometricModuleEnabled,
  setBiometricLoginMarker,
} from '@/shared/lib/biometricLocal';
import {
  deleteMyWebAuthnCredential,
  fetchMyWebAuthnCredentials,
  registerWebAuthnCredential,
  updateMyWebAuthnLabel,
  type WebAuthnCredential,
} from '@/shared/lib/webauthnApi';
import {
  isBiometricCancelled,
  isBiometricRouteMissing,
  isBiometricUnsupported,
  mapBiometricMessage,
  shouldClearBiometricMarker,
} from '@/shared/lib/webauthnErrors';

const DEVICE_LIMIT = 2;
const LABEL_MAX = 40;

function formatWhen(iso: string | null): string {
  if (!iso) return 'Belum dipakai';
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}

function normalizeLabel(value: string): string {
  return value.trim().slice(0, LABEL_MAX);
}

export function BiometricPanel() {
  const { person } = useAuth();
  const enabled = isBiometricModuleEnabled(person?.moduleStatuses);
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [items, setItems] = useState<WebAuthnCredential[]>([]);
  const [sensor, setSensor] = useState<boolean | null>(null);
  const [label, setLabel] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [pendingDelete, setPendingDelete] = useState<WebAuthnCredential | null>(null);
  const [busy, setBusy] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState('');
  const [quietNotice, setQuietNotice] = useState('');

  useEffect(() => {
    if (!enabled) {
      setVisible(false);
      setOpen(false);
      return;
    }

    let cancelled = false;
    void fetchMyWebAuthnCredentials()
      .then((next) => {
        if (cancelled) return;
        setItems(next);
        setVisible(true);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (shouldClearBiometricMarker(err)) clearBiometricLoginMarker();
        setVisible(false);
        setOpen(false);
      });

    if (!window.isSecureContext) {
      if (!cancelled) setSensor(false);
    } else {
      void platformAuthenticatorIsAvailable()
        .then((ok) => {
          if (!cancelled) setSensor(ok);
        })
        .catch(() => {
          if (!cancelled) setSensor(false);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const summary = useMemo(() => {
    if (items.length === 0) {
      return 'Biometrik belum didaftarkan. Kamu bisa menambahkan sampai 2 perangkat untuk masuk tanpa kode keluarga.';
    }
    const labels = items
      .map((item) =>
        item.enabled ? item.label : `${item.label} (dinonaktifkan admin)`,
      )
      .join(' · ');
    return `Biometrik aktif (${items.length}/${DEVICE_LIMIT}). ${labels}`;
  }, [items]);

  const hideFeature = () => {
    clearBiometricLoginMarker();
    setVisible(false);
    setOpen(false);
  };

  const handleCaught = (err: unknown) => {
    if (err instanceof ApiClientError && err.code === 'BIOMETRIC_DISABLED') {
      hideFeature();
      return;
    }
    if (shouldClearBiometricMarker(err)) clearBiometricLoginMarker();
    if (isBiometricRouteMissing(err)) {
      setVisible(false);
      setOpen(false);
      return;
    }
    if (isBiometricUnsupported(err)) {
      setSensor(false);
      setQuietNotice('');
      return;
    }
    if (isBiometricCancelled(err)) {
      setQuietNotice('Dibatalkan.');
      return;
    }
    setError(mapBiometricMessage(err));
  };

  const handleAdd = async () => {
    const nextLabel = normalizeLabel(label);
    setError('');
    setQuietNotice('');
    if (!nextLabel) {
      setError('Isi nama perangkat dulu, misalnya Laptop kerja.');
      return;
    }
    setBusy(true);
    setRegistering(true);
    try {
      await registerWebAuthnCredential(nextLabel);
      setBiometricLoginMarker();
      setLabel('');
      setItems(await fetchMyWebAuthnCredentials());
    } catch (err) {
      handleCaught(err);
    } finally {
      setBusy(false);
      setRegistering(false);
    }
  };

  const handleSaveLabel = async (id: number) => {
    const nextLabel = normalizeLabel(editLabel);
    setError('');
    setQuietNotice('');
    if (!nextLabel) {
      setError('Nama perangkat wajib diisi, 1–40 karakter.');
      return;
    }
    setBusy(true);
    try {
      const updated = await updateMyWebAuthnLabel(id, nextLabel);
      setItems((list) => list.map((item) => (item.id === id ? updated : item)));
      setEditingId(null);
    } catch (err) {
      handleCaught(err);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setError('');
    setQuietNotice('');
    setBusy(true);
    try {
      await deleteMyWebAuthnCredential(pendingDelete.id);
      setItems((list) => list.filter((item) => item.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch (err) {
      handleCaught(err);
    } finally {
      setBusy(false);
    }
  };

  if (!enabled || !visible) return null;

  const canAdd = items.length < DEVICE_LIMIT && sensor === true;

  const openPanel = () => {
    setError('');
    setQuietNotice('');
    setPendingDelete(null);
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={openPanel}
        aria-label={summary}
        className="group relative mt-4 flex w-full items-center gap-4 overflow-hidden rounded-[24px] border border-suite-border/80 bg-suite-surface/90 px-4 py-4 text-left shadow-card backdrop-blur-md transition duration-200 hover:-translate-y-0.5 hover:border-primary-400/45 sm:px-5"
      >
        <span className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/70 to-transparent" />
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-500/12 text-primary-700 dark:text-primary-300">
          <FingerprintMark />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-bold tracking-tight text-suite-ink">
              {items.length === 0 ? 'Biometrik' : 'Biometrik aktif'}
            </span>
            <span className="rounded-full bg-suite-soft px-2 py-0.5 text-[11px] font-semibold text-suite-muted">
              {items.length}/{DEVICE_LIMIT}
            </span>
          </span>
          {items.length === 0 ? (
            <span className="mt-1 block text-sm leading-relaxed text-suite-muted">
              Belum didaftarkan. Kamu bisa menambahkan sampai 2 perangkat untuk masuk tanpa kode keluarga.
            </span>
          ) : (
            <span className="mt-2 flex flex-wrap gap-1.5">
              {items.map((item) => (
                <span
                  key={item.id}
                  className={
                    item.enabled
                      ? 'inline-flex max-w-full items-center rounded-full bg-primary-500/10 px-2.5 py-1 text-[11px] font-medium text-primary-800 dark:text-primary-200'
                      : 'inline-flex max-w-full items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-1 text-[11px] font-medium text-rose-800 dark:text-rose-200'
                  }
                >
                  <span className="truncate">{item.label}</span>
                  {!item.enabled && (
                    <span className="shrink-0 font-semibold">Dinonaktifkan admin</span>
                  )}
                </span>
              ))}
            </span>
          )}
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary-700 dark:text-primary-300">
          <span className="hidden sm:inline">
            {items.length === 0 ? 'Tambah' : 'Kelola'}
          </span>
          <ArrowRight
            size={14}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </span>
      </button>

      <Dialog open={open} onClose={() => { if (!busy) setOpen(false); }} className="relative z-50">
        <div className="fixed inset-0 bg-ink-950/45 backdrop-blur-[2px]" aria-hidden />
        <div className="fixed inset-0 overflow-y-auto p-4">
          <div className="flex min-h-full items-center justify-center">
            <DialogPanel className="w-full max-w-lg rounded-[24px] border border-suite-border bg-suite-surface p-5 shadow-card sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-500/12 text-primary-700 dark:text-primary-300">
                    <FingerprintMark />
                  </span>
                  <div>
                    <DialogTitle className="text-lg font-bold tracking-tight text-suite-ink">
                      Biometrik saya
                    </DialogTitle>
                    <p className="text-xs font-medium text-suite-faint">
                      {items.length}/{DEVICE_LIMIT} perangkat
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setOpen(false)}
                  className="rounded-xl p-2 text-suite-faint hover:bg-suite-soft hover:text-suite-ink disabled:opacity-50"
                  aria-label="Tutup"
                >
                  <X size={16} />
                </button>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-suite-muted">
                Yang tersimpan hanya perangkat ini, bukan data sidik jari. Maksimal 2 perangkat. Admin bisa menonaktifkan atau menghapus dari panel admin.
              </p>

              {error && (
                <p role="alert" className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-3.5 py-3 text-sm text-rose-700 dark:text-rose-300">
                  {error}
                </p>
              )}
              {quietNotice && (
                <p className="mt-4 text-sm text-suite-muted">{quietNotice}</p>
              )}

              <ul className="mt-5 space-y-3">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-2xl border border-suite-border bg-suite-soft px-3.5 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        {editingId === item.id ? (
                          <div className="flex gap-2">
                            <input
                              value={editLabel}
                              maxLength={LABEL_MAX}
                              onChange={(e) => setEditLabel(e.target.value)}
                              className="w-full rounded-xl border border-suite-border bg-suite-surface px-3 py-2 text-sm text-suite-ink"
                            />
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void handleSaveLabel(item.id)}
                              className="shrink-0 rounded-xl bg-primary-500 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                            >
                              Simpan
                            </button>
                          </div>
                        ) : (
                          <p className="font-semibold text-suite-ink">{item.label}</p>
                        )}
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          {!item.enabled && (
                            <span className="rounded-full bg-rose-500/12 px-2 py-0.5 text-[11px] font-semibold text-rose-700 dark:text-rose-300">
                              Dinonaktifkan admin
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-suite-faint">
                          Daftar {formatWhen(item.createdAt)} · Terakhir dipakai{' '}
                          {item.lastUsedAt ? formatWhen(item.lastUsedAt) : 'belum pernah'}
                        </p>
                      </div>
                      {editingId !== item.id && (
                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => {
                              setEditingId(item.id);
                              setEditLabel(item.label);
                            }}
                            className="text-sm font-semibold text-suite-muted hover:text-suite-ink"
                          >
                            Ubah
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => setPendingDelete(item)}
                            className="text-sm font-semibold text-rose-600 hover:text-rose-700"
                          >
                            Hapus
                          </button>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              {pendingDelete && (
                <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-3.5 py-3">
                  <p className="text-sm text-suite-ink">
                    Perangkat ini tidak bisa dipakai masuk lagi. Kamu bisa mendaftarkan yang baru nanti.
                  </p>
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setPendingDelete(null)}
                      className="rounded-xl px-3 py-2 text-sm font-semibold text-suite-muted"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleDelete()}
                      className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              )}

              {canAdd && (
                <div className="mt-5 space-y-3">
                  <label className="block text-[13px] font-semibold text-suite-ink">
                    Nama perangkat
                    <input
                      value={label}
                      maxLength={LABEL_MAX}
                      placeholder="Laptop kerja"
                      onChange={(e) => setLabel(e.target.value)}
                      className="mt-1.5 block w-full rounded-2xl border border-suite-border bg-suite-soft px-3.5 py-3 text-sm text-suite-ink placeholder:text-suite-faint"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleAdd()}
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-primary-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {registering ? 'Menunggu konfirmasi perangkat…' : 'Tambah perangkat'}
                  </button>
                </div>
              )}

              {items.length >= DEVICE_LIMIT && (
                <p className="mt-5 text-sm text-suite-muted">
                  Maksimal 2 perangkat. Hapus satu perangkat dulu kalau ingin mengganti.
                </p>
              )}

              {sensor === false && !window.isSecureContext && (
                <p className="mt-5 text-sm text-suite-muted">
                  Sidik jari hanya bisa dipakai lewat https domain Tailscale, termasuk saat di rumah. Alamat IP dan http ditolak browser.
                </p>
              )}

              {sensor === false && window.isSecureContext && (
                <p className="mt-5 text-sm text-suite-muted">
                  Browser ini tidak bisa memakai sidik jari. Di Android pakai Chrome.
                </p>
              )}
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </>
  );
}
