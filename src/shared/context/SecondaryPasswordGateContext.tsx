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
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-zinc-200">
        {label}
      </span>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          className="block w-full rounded-xl border border-zinc-700 bg-zinc-950/80 py-2.5 pl-3 pr-10 text-sm text-white placeholder:text-zinc-600 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          tabIndex={-1}
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

  const title =
    mode === 'setup'
      ? 'Atur password kedua'
      : mode === 'change'
        ? 'Ganti password kedua'
        : 'Verifikasi password kedua';

  const description =
    mode === 'setup'
      ? 'Password ini melindungi Admin, Money Track, dan Household. Minimal 6 karakter.'
      : mode === 'change'
        ? 'Masukkan password saat ini dan password baru.'
        : 'Masukkan password kedua untuk membuka modul sensitif (berlaku ~15 menit).';

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
            <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px]" />
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
                <DialogPanel className="w-full max-w-md overflow-hidden rounded-3xl border border-zinc-800/90 border-t-4 border-t-primary-500 bg-zinc-900/95 p-5 text-white shadow-2xl shadow-black/40 sm:p-6">
                  <div className="mb-4 flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-500/15 text-primary-400">
                      {mode === 'verify' ? <Lock size={20} /> : <Shield size={20} />}
                    </span>
                    <div>
                      <DialogTitle className="text-lg font-bold tracking-tight text-white">
                        {title}
                      </DialogTitle>
                      <p className="mt-1 text-sm text-zinc-400">{description}</p>
                    </div>
                  </div>

                  <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3.5">
                    {mode === 'change' && (
                      <PasswordField
                        id="sp-current"
                        label="Password saat ini"
                        value={currentPassword}
                        onChange={setCurrentPassword}
                        autoComplete="current-password"
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
                        className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300"
                      >
                        {error}
                      </p>
                    )}

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => closeWith(false)}
                        className="rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={busy}
                        className="rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
                      >
                        {busy
                          ? 'Memproses…'
                          : mode === 'setup'
                            ? 'Simpan & buka'
                            : mode === 'change'
                              ? 'Ganti password'
                              : 'Buka modul'}
                      </button>
                    </div>
                  </form>
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
