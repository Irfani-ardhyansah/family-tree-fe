import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Key, Eye, EyeOff, LogIn, HelpCircle } from 'react-feather';
import { useAuth } from '@/shared/context/AuthContext';
import { appPaths } from '@/shared/routes';
import { normalizeLoginCode, LOGIN_CODE_MAX_LENGTH } from '@/shared/utils/loginCode';

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
    <div className="rounded-3xl border border-suite-border border-t-4 border-t-primary-500 bg-suite-surface p-6 shadow-card sm:p-8">
      <div className="mb-7 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-suite-ink sm:text-3xl">
          Masuk
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-suite-muted sm:text-base">
          Gunakan kode pribadi keluarga Anda
        </p>
      </div>

      <div className="mb-6 rounded-2xl border border-primary-500/20 bg-primary-500/10 px-4 py-3">
        <div className="flex items-start gap-2.5">
          <HelpCircle
            size={18}
            className="mt-0.5 shrink-0 text-primary-400"
            aria-hidden
          />
          <div className="text-sm leading-relaxed text-suite-ink">
            <p className="mb-1 font-semibold text-primary-700 dark:text-primary-200">Cara membuat kode</p>
            <p className="text-suite-muted">
              <span className="font-mono font-semibold text-suite-ink">
                Singkatan nama
              </span>{' '}
              (panjangnya mengikuti nama) +{' '}
              <span className="font-mono font-semibold text-suite-ink">6 angka</span>{' '}
              tanggal lahir (DDMMYY).
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-suite-muted">
              <li>
                1 kata:{' '}
                <span className="font-mono font-bold text-suite-ink">
                  MIA210399
                </span>{' '}
                (Mia, 21 Mar 1999)
              </li>
              <li>
                2 kata:{' '}
                <span className="font-mono font-bold text-suite-ink">
                  MR170845
                </span>{' '}
                (Mulyono Raka, 17 Agt 1945)
              </li>
              <li>Ada panggilan: pakai panggilan + tanggal lahir</li>
            </ul>
          </div>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="login-code"
            className="mb-1.5 block text-sm font-semibold text-suite-ink"
          >
            Kode Masuk
          </label>
          <div className="relative">
            <Key
              size={18}
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
              className="block w-full rounded-xl border border-suite-border bg-suite-soft py-3 pl-11 pr-12 font-mono text-base uppercase tracking-wider text-suite-ink placeholder:text-suite-faint shadow-sm focus:border-primary-500 focus:bg-suite-surface focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            <button
              type="button"
              onClick={() => setShowCode((prev) => !prev)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-suite-faint transition-colors hover:bg-suite-soft hover:text-suite-ink"
              aria-label={showCode ? 'Sembunyikan kode' : 'Tampilkan kode'}
            >
              {showCode ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p className="mt-1.5 text-xs text-suite-faint">
            Huruf kapital otomatis · diakhiri 6 angka tanggal lahir
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            id="remember"
            name="remember"
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-5 w-5 rounded border-suite-border bg-suite-surface text-primary-500 focus:ring-primary-500 focus:ring-offset-0"
          />
          <label
            htmlFor="remember"
            className="select-none text-sm text-suite-muted"
          >
            Ingat saya di perangkat ini
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 py-3.5 text-base font-semibold text-white shadow-sm shadow-primary-900/40 transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LogIn size={18} />
          {isSubmitting ? 'Memproses…' : 'Masuk'}
        </button>
      </form>

      <div className="mt-8 border-t border-suite-border pt-6 text-center">
        <p className="text-sm text-suite-muted">
          Belum terdaftar?{' '}
          <Link
            to={appPaths.register}
            className="font-semibold text-primary-400 underline-offset-2 hover:text-primary-300 hover:underline"
          >
            Hubungi admin keluarga
          </Link>
        </p>
      </div>
    </div>
  );
}
