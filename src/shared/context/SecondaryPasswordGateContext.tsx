import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from '@headlessui/react';
import {
  createContext,
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Eye, EyeOff, Lock, Shield } from 'react-feather';
import { ApiClientError, hasValidModuleUnlock, SECONDARY_UNLOCK_REQUIRED_EVENT } from '@/shared/lib/apiClient';
import {
  changeSecondaryPassword,
  setupSecondaryPassword,
  validateSecondaryPasswordInput,
  verifySecondaryPassword,
} from '@/shared/lib/secondaryPasswordApi';
import { useAuth } from '@/shared/context/AuthContext';

type PendingResolver = {
  resolve: (ok: boolean) => void;
};

type GateMode = 'setup' | 'verify' | 'change' | null;

type SecondaryPasswordGateValue = {
  /** Pastikan unlock valid; buka setup/verify bila perlu. Return false jika user batal. */
  ensureUnlocked: () => Promise<boolean>;
  openChangePassword: () => void;
};

const SecondaryPasswordGateContext =
  createContext<SecondaryPasswordGateValue | null>(null);

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  autoFocus,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  autoFocus?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <label className="block" htmlFor={id}>
      <span className="mb-1.5 block text-[13px] font-semibold text-suite-ink">
        {label}
      </span>
      <div className="relative">
        <Lock
          size={16}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-suite-faint"
          aria-hidden
        />
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          placeholder="••••••••"
          onChange={(e) => onChange(e.target.value)}
          className="block w-full rounded-2xl border border-suite-border bg-suite-soft py-3 pl-11 pr-12 text-sm text-suite-ink placeholder:text-suite-faint transition focus:border-primary-500 focus:bg-suite-surface focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl p-2 text-suite-faint transition-colors hover:bg-suite-surface hover:text-suite-ink"
          tabIndex={-1}
          aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </label>
  );
}

function mapSecondaryError(error: unknown): string {
  if (error instanceof ApiClientError) {
    return error.message || 'Terjadi kesalahan.';
  }
  if (error instanceof Error && error.message) return error.message;
  return 'Terjadi kesalahan.';
}

export function SecondaryPasswordGateProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { isAuthenticated, mustSetupSecondaryPassword, setSecondaryPasswordStatus } =
    useAuth();
  const [mode, setMode] = useState<GateMode>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const pendingRef = useRef<PendingResolver | null>(null);

  const resetForm = () => {
    setPassword('');
    setConfirmPassword('');
    setCurrentPassword('');
    setError('');
    setBusy(false);
  };

  const closeWith = useCallback((ok: boolean) => {
    pendingRef.current?.resolve(ok);
    pendingRef.current = null;
    setMode(null);
    resetForm();
  }, []);

  const openMode = useCallback((next: Exclude<GateMode, null>) => {
    return new Promise<boolean>((resolve) => {
      if (pendingRef.current) {
        pendingRef.current.resolve(false);
      }
      pendingRef.current = { resolve };
      resetForm();
      setMode(next);
    });
  }, []);

  const ensureUnlocked = useCallback(async () => {
    if (hasValidModuleUnlock()) return true;
    if (mustSetupSecondaryPassword) {
      return openMode('setup');
    }
    return openMode('verify');
  }, [mustSetupSecondaryPassword, openMode]);

  const openChangePassword = useCallback(() => {
    void openMode('change');
  }, [openMode]);

  useEffect(() => {
    if (!isAuthenticated) {
      if (pendingRef.current) {
        pendingRef.current.resolve(false);
        pendingRef.current = null;
      }
      setMode(null);
      resetForm();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const onRequired = () => {
      if (!isAuthenticated) return;
      if (mode) return;
      void openMode(mustSetupSecondaryPassword ? 'setup' : 'verify');
    };
    window.addEventListener(SECONDARY_UNLOCK_REQUIRED_EVENT, onRequired);
    return () =>
      window.removeEventListener(SECONDARY_UNLOCK_REQUIRED_EVENT, onRequired);
  }, [isAuthenticated, mode, mustSetupSecondaryPassword, openMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'setup') {
      const invalid = validateSecondaryPasswordInput(password, confirmPassword);
      if (invalid) {
        setError(invalid);
        return;
      }
      setBusy(true);
      try {
        const data = await setupSecondaryPassword(password, confirmPassword);
        setSecondaryPasswordStatus(data.secondaryPassword);
        closeWith(true);
      } catch (err) {
        setError(mapSecondaryError(err));
      } finally {
        setBusy(false);
      }
      return;
    }

    if (mode === 'verify') {
      const invalid = validateSecondaryPasswordInput(password);
      if (invalid) {
        setError(invalid);
        return;
      }
      setBusy(true);
      try {
        await verifySecondaryPassword(password);
        closeWith(true);
      } catch (err) {
        setError(mapSecondaryError(err));
      } finally {
        setBusy(false);
      }
      return;
    }

    if (mode === 'change') {
      const invalid = validateSecondaryPasswordInput(
        password,
        confirmPassword,
      );
      if (invalid) {
        setError(invalid);
        return;
      }
      if (!currentPassword.trim()) {
        setError('Password saat ini wajib diisi.');
        return;
      }
      setBusy(true);
      try {
        const data = await changeSecondaryPassword({
          currentPassword: currentPassword.trim(),
          newPassword: password.trim(),
          confirmPassword: confirmPassword.trim(),
        });
        setSecondaryPasswordStatus(data.secondaryPassword);
        closeWith(true);
      } catch (err) {
        setError(mapSecondaryError(err));
      } finally {
        setBusy(false);
      }
    }
  };

  const value = useMemo(
    () => ({ ensureUnlocked, openChangePassword }),
    [ensureUnlocked, openChangePassword],
  );

  const isUnlock = mode === 'verify';
  const title =
    mode === 'setup'
      ? 'Atur password kedua'
      : mode === 'change'
        ? 'Ganti password kedua'
        : 'Buka modul';

  const description =
    mode === 'setup'
      ? 'Melindungi Admin, Money Track, dan Household. Minimal 6 karakter.'
      : mode === 'change'
        ? 'Masukkan password saat ini, lalu password baru.'
        : 'Password kedua berlaku sekitar 15 menit setelah berhasil.';

  const submitLabel =
    busy
      ? 'Memproses…'
      : mode === 'setup'
        ? 'Simpan & buka'
        : mode === 'change'
          ? 'Ganti password'
          : 'Buka';

  return (
    <SecondaryPasswordGateContext.Provider value={value}>
      {children}

      <Transition appear show={mode != null} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-[70]"
          onClose={() => {
            if (!busy) closeWith(false);
          }}
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
            <div className="fixed inset-0 bg-ink-950/45 backdrop-blur-sm" />
          </TransitionChild>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center sm:items-center sm:p-4">
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <DialogPanel className="w-full max-w-md overflow-hidden rounded-t-[28px] border border-suite-border bg-suite-surface text-suite-ink shadow-card sm:rounded-[28px]">
                  <div className="px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 sm:px-7 sm:pb-7 sm:pt-7">
                    <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-suite-border sm:hidden" />

                    {isUnlock ? (
                      <div className="mb-6 text-center">
                        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500/12 text-primary-600 dark:text-primary-400">
                          <Lock size={22} />
                        </span>
                        <DialogTitle className="mt-4 text-xl font-bold tracking-tight text-suite-ink">
                          {title}
                        </DialogTitle>
                        <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-suite-muted">
                          {description}
                        </p>
                      </div>
                    ) : (
                      <div className="mb-6 flex items-start gap-3">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-500/12 text-primary-600 dark:text-primary-400">
                          <Shield size={20} />
                        </span>
                        <div className="min-w-0 pt-0.5">
                          <DialogTitle className="text-lg font-bold tracking-tight text-suite-ink">
                            {title}
                          </DialogTitle>
                          <p className="mt-1 text-sm leading-relaxed text-suite-muted">
                            {description}
                          </p>
                        </div>
                      </div>
                    )}

                    <form
                      onSubmit={(e) => void handleSubmit(e)}
                      className="space-y-4"
                    >
                      {mode === 'change' && (
                        <PasswordField
                          id="sp-current"
                          label="Password saat ini"
                          value={currentPassword}
                          onChange={setCurrentPassword}
                          autoComplete="current-password"
                          autoFocus
                        />
                      )}
                      <PasswordField
                        id="sp-password"
                        label={
                          mode === 'change' ? 'Password baru' : 'Password kedua'
                        }
                        value={password}
                        onChange={setPassword}
                        autoComplete={
                          mode === 'verify' ? 'current-password' : 'new-password'
                        }
                        autoFocus={mode !== 'change'}
                      />
                      {(mode === 'setup' || mode === 'change') && (
                        <PasswordField
                          id="sp-confirm"
                          label="Konfirmasi password"
                          value={confirmPassword}
                          onChange={setConfirmPassword}
                          autoComplete="new-password"
                        />
                      )}

                      {error && (
                        <p
                          role="alert"
                          className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-700 dark:text-rose-300"
                        >
                          {error}
                        </p>
                      )}

                      <div className="flex flex-col gap-2 pt-1">
                        <button
                          type="submit"
                          disabled={busy}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-500 px-4 py-3.5 text-[15px] font-semibold text-white shadow-sm shadow-primary-900/20 transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {busy && (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          )}
                          {submitLabel}
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => closeWith(false)}
                          className="rounded-2xl px-4 py-2.5 text-sm font-semibold text-suite-muted transition hover:bg-suite-soft hover:text-suite-ink disabled:opacity-50"
                        >
                          Batal
                        </button>
                      </div>
                    </form>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </SecondaryPasswordGateContext.Provider>
  );
}

export function useSecondaryPasswordGate() {
  const ctx = useContext(SecondaryPasswordGateContext);
  if (!ctx) {
    throw new Error(
      'useSecondaryPasswordGate must be used within SecondaryPasswordGateProvider',
    );
  }
  return ctx;
}
