import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Grid, LogOut } from 'react-feather';
import { useAuth } from '@/shared/context/AuthContext';
import { appPaths } from '@/shared/routes';
import { Footer } from '@/shared/components/ui/Footer';
import { ThemeToggle } from '@/shared/ui';
import { shortPersonName } from '@/shared/utils/personDisplayName';

type ModuleShellLayoutProps = {
  children: ReactNode;
  moduleName: string;
};

export function ModuleShellLayout({
  children,
  moduleName,
}: ModuleShellLayoutProps) {
  const { logout, person } = useAuth();
  const loginName = person
    ? shortPersonName(person, person.fullName)
    : null;

  return (
    <div data-module="household" className="flex min-h-screen flex-col bg-suite-bg text-suite-ink">
      <header className="sticky top-0 z-40 border-b border-suite-border bg-suite-surface/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-3 sm:h-16 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              to={appPaths.launcher}
              className="inline-flex items-center justify-center rounded-control p-2 text-suite-muted hover:bg-suite-soft"
              title="Semua modul"
              aria-label="Semua modul"
            >
              <Grid size={16} />
            </Link>
            <span className="text-sm font-semibold text-suite-ink">
              {moduleName}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {loginName && (
              <span className="hidden text-xs font-semibold text-suite-ink sm:inline">
                {loginName}
              </span>
            )}
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex items-center gap-1.5 rounded-control px-3 py-2 text-sm font-medium text-suite-muted hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <Footer moduleName={moduleName} />
    </div>
  );
}
