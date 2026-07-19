import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Key, Eye, EyeOff, LogIn, HelpCircle } from 'react-feather';
import { useAuth } from '@/context/AuthContext';
import { useFamily } from '@/context/FamilyDataContext';
import { normalizeLoginCode, LOGIN_CODE_MAX_LENGTH } from '@/utils/loginCode';

export function LoginPage() {
  const [code, setCode] = useState('');
  const [remember, setRemember] = useState(true);
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const { persons } = useFamily();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const result = await login(code, persons, remember);
    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    navigate('/', { replace: true });
  };

  const handleCodeChange = (value: string) => {
    setCode(
      normalizeLoginCode(value)
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, LOGIN_CODE_MAX_LENGTH),
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-brand-700">
          Masuk
        </h1>
        <p className="text-base text-gray-500 mt-2 leading-relaxed">
          Gunakan kode pribadi keluarga Anda
        </p>
      </div>

      <div className="mb-6 rounded-xl bg-primary-50 border border-primary-100 px-4 py-3">
        <div className="flex items-start gap-2.5">
          <HelpCircle
            size={18}
            className="text-primary-600 shrink-0 mt-0.5"
            aria-hidden
          />
          <div className="text-sm text-primary-900 leading-relaxed">
            <p className="font-semibold mb-1">Cara membuat kode</p>
            <p>
              <span className="font-mono font-semibold">Singkatan nama</span>{' '}
              (panjangnya mengikuti nama) +{' '}
              <span className="font-mono font-semibold">6 angka</span> tanggal
              lahir (DDMMYY).
            </p>
            <ul className="mt-2 space-y-1 text-primary-800 list-disc list-inside">
              <li>
                1 kata: <span className="font-mono font-bold">MIA210399</span>{' '}
                (Mia, 21 Mar 1999)
              </li>
              <li>
                2 kata: <span className="font-mono font-bold">MR170845</span>{' '}
                (Mulyono Raka, 17 Agt 1945)
              </li>
              <li>
                Ada panggilan: pakai panggilan + tanggal lahir
              </li>
            </ul>
          </div>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="login-code"
            className="block text-sm font-semibold text-gray-700 mb-1.5"
          >
            Kode Masuk
          </label>
          <div className="relative">
            <Key
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
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
              className="block w-full pl-11 pr-12 py-3 text-base font-mono tracking-wider rounded-xl border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 uppercase"
            />
            <button
              type="button"
              onClick={() => setShowCode((prev) => !prev)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
              aria-label={showCode ? 'Sembunyikan kode' : 'Tampilkan kode'}
            >
              {showCode ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p className="mt-1.5 text-xs text-gray-400">
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
            className="h-5 w-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
          />
          <label htmlFor="remember" className="text-sm text-gray-700 select-none">
            Ingat saya di perangkat ini
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full inline-flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed text-white py-3.5 px-4 rounded-xl text-base font-semibold transition-colors shadow-sm"
        >
          <LogIn size={18} />
          {isSubmitting ? 'Memproses…' : 'Masuk'}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-gray-100 text-center">
        <p className="text-sm text-gray-600">
          Belum terdaftar?{' '}
          <Link
            to="/register"
            className="font-semibold text-primary-600 hover:text-primary-700 underline-offset-2 hover:underline"
          >
            Hubungi admin keluarga
          </Link>
        </p>
      </div>
    </div>
  );
}
