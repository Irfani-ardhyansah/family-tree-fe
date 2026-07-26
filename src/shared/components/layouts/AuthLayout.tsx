import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'react-feather';
import { appPaths } from '@/shared/routes';

type AuthLayoutProps = {
  children: ReactNode;
};

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen bg-[#0b0d10] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(106,168,106,0.12),_transparent_55%)]" />

      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-8 sm:px-6">
        <Link
          to={appPaths.login}
          className="mb-8 flex items-center gap-3 group"
          aria-label="Family Suite"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg shadow-primary-900/40 transition group-hover:shadow-primary-900/60">
            <Home size={22} className="text-white" />
          </div>
          <div>
            <span className="block text-xl font-bold leading-tight tracking-tight text-white">
              Family Suite
            </span>
            <span className="block text-xs font-medium text-zinc-400">
              Platform keluarga Ardhyansah
            </span>
          </div>
        </Link>

        <div className="w-full max-w-md">{children}</div>

        <p className="mt-10 text-center text-xs text-zinc-500">
          Untuk seluruh anggota keluarga — mudah digunakan di ponsel maupun
          komputer
        </p>
      </div>
    </div>
  );
}
