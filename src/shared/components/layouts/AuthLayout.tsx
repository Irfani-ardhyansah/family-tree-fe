import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'react-feather';
import { appPaths } from '@/shared/routes';
import { ThemeToggle } from '@/shared/ui';

type AuthLayoutProps = {
  children: ReactNode;
};

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div
      data-module="launcher"
      className="relative min-h-screen bg-suite-bg text-suite-ink"
    >
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(106,168,106,0.12),_transparent_55%)]" />

      <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

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
            <span className="block text-xl font-bold leading-tight tracking-tight text-suite-ink">
              Family Suite
            </span>
            <span className="block text-xs font-medium text-suite-faint">
              Platform keluarga Ardhyansah
            </span>
          </div>
        </Link>

        <div className="w-full max-w-md">{children}</div>

        <p className="mt-10 text-center text-xs text-suite-faint">
          Untuk seluruh anggota keluarga — mudah digunakan di ponsel maupun
          komputer
        </p>
      </div>
    </div>
  );
}
