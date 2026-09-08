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
      className="relative min-h-screen overflow-hidden bg-suite-bg text-suite-ink"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-28 -top-24 h-[22rem] w-[22rem] rounded-full bg-primary-500/16 blur-3xl" />
        <div className="absolute -right-20 top-[38%] h-72 w-72 rounded-full bg-primary-800/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(106,168,106,0.08),_transparent_52%)]" />
      </div>

      <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
        <div className="rounded-full border border-suite-border/80 bg-suite-surface/80 shadow-sm backdrop-blur-md">
          <ThemeToggle />
        </div>
      </div>

      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10 sm:px-6">
        <Link
          to={appPaths.login}
          className="mb-8 flex items-center gap-3"
          aria-label="Family Suite"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-md shadow-primary-900/25">
            <Home size={20} className="text-white" />
          </div>
          <div>
            <span className="block text-lg font-bold leading-tight tracking-tight text-suite-ink">
              Family Suite
            </span>
            <span className="block text-xs font-medium text-suite-faint">
              Platform keluarga Ardhyansah
            </span>
          </div>
        </Link>

        <div className="w-full max-w-[26rem]">{children}</div>

        <p className="mt-8 max-w-sm text-center text-xs leading-relaxed text-suite-faint">
          Untuk seluruh anggota keluarga — mudah digunakan di ponsel maupun
          komputer
        </p>
      </div>
    </div>
  );
}
