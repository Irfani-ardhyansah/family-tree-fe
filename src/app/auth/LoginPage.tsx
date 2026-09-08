import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from '@headlessui/react';
import { ChevronDown, Eye, EyeOff, Key, LogIn } from 'react-feather';
import { useAuth } from '@/shared/context/AuthContext';
import { appPaths } from '@/shared/routes';
import { cx } from '@/shared/ui/cx';
import { normalizeLoginCode, LOGIN_CODE_MAX_LENGTH } from '@/shared/utils/loginCode';

const CODE_EXAMPLES = [
  { code: 'MIA210399', hint: 'Mia · 21 Mar 1999' },
  { code: 'MR170845', hint: 'Mulyono Raka · 17 Agt 1945' },
] as const;

export function LoginPage() {
  const [code, setCode] = useState('');
  const [remember, setRemember] = useState(true);
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const result = await login(code, remember);
    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    navigate(appPaths.launcher, { replace: true });
  };

  const handleCodeChange = (value: string) => {
    setCode(
      normalizeLoginCode(value)
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, LOGIN_CODE_MAX_LENGTH),
    );
  };

  return (
    <div className="rounded-[28px] border border-suite-border/80 bg-suite-surface/90 p-6 shadow-card backdrop-blur-md sm:p-8">
      <div className="mb-7">
        <h1 className="text-[1.7rem] font-extrabold tracking-tight text-suite-ink">
          Masuk
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-suite-muted">
          Gunakan kode pribadi keluarga Anda
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-3.5 py-3 text-sm text-rose-700 dark:text-rose-300"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="login-code"
            className="mb-1.5 block text-[13px] font-semibold text-suite-ink"
          >
            Kode masuk
          </label>
          <div className="relative">
            <Key
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-suite-faint"
              aria-hidden
            />
            <input
              type={showCode ? 'text' : 'password'}
              id="login-code"
              name="login-code"
              required
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              placeholder="MR170845"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              inputMode="text"
              maxLength={LOGIN_CODE_MAX_LENGTH}
              className="block w-full rounded-2xl border border-suite-border bg-suite-soft py-3 pl-11 pr-12 font-mono text-[15px] uppercase tracking-[0.18em] text-suite-ink placeholder:tracking-wider placeholder:text-suite-faint transition focus:border-primary-500 focus:bg-suite-surface focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
            <button
              type="button"
              onClick={() => setShowCode((prev) => !prev)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl p-2 text-suite-faint transition-colors hover:bg-suite-surface hover:text-suite-ink"
              aria-label={showCode ? 'Sembunyikan kode' : 'Tampilkan kode'}
            >
              {showCode ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-suite-faint">
            Singkatan nama + 6 angka tanggal lahir (DDMMYY)
          </p>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span id="remember-label" className="text-sm text-suite-muted">
            Ingat saya di perangkat ini
          </span>
          <button
            type="button"
            role="switch"
            id="remember"
            aria-labelledby="remember-label"
            aria-checked={remember}
            onClick={() => setRemember((prev) => !prev)}
            className={cx(
              'relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40',
              remember ? 'bg-primary-500' : 'bg-suite-border',
            )}
          >
            <span
              className={cx(
                'absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform',
                remember && 'translate-x-5',
              )}
            />
          </button>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-500 px-4 py-3.5 text-[15px] font-semibold text-white shadow-sm shadow-primary-900/20 transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <LogIn size={17} />
          )}
          {isSubmitting ? 'Memproses…' : 'Masuk'}
        </button>
      </form>

      <Disclosure as="div" className="mt-6 border-t border-suite-border/80 pt-4">
        {({ open }) => (
          <>
            <DisclosureButton className="flex w-full items-center justify-between gap-3 text-left text-sm font-medium text-suite-muted transition hover:text-suite-ink">
              Cara membuat kode
              <ChevronDown
                size={16}
                className={cx(
                  'shrink-0 text-suite-faint transition-transform',
                  open && 'rotate-180',
                )}
              />
            </DisclosureButton>
            <DisclosurePanel className="mt-3 space-y-2">
              {CODE_EXAMPLES.map((example) => (
                <div
                  key={example.code}
                  className="flex items-baseline justify-between gap-3 rounded-xl bg-suite-soft px-3 py-2.5"
                >
                  <span className="font-mono text-sm font-semibold tracking-wide text-suite-ink">
                    {example.code}
                  </span>
                  <span className="text-xs text-suite-faint">{example.hint}</span>
                </div>
              ))}
              <p className="px-1 pt-1 text-xs leading-relaxed text-suite-faint">
                Punya panggilan? Pakai panggilan + tanggal lahir.
              </p>
            </DisclosurePanel>
          </>
        )}
      </Disclosure>

      <p className="mt-6 text-center text-sm text-suite-muted">
        Belum terdaftar?{' '}
        <Link
          to={appPaths.register}
          className="font-semibold text-primary-600 underline-offset-2 hover:text-primary-700 hover:underline dark:text-primary-400 dark:hover:text-primary-300"
        >
          Hubungi admin keluarga
        </Link>
      </p>
    </div>
  );
}
