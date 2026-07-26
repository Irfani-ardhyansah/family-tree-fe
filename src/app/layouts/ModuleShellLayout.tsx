import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Grid, LogOut } from 'react-feather';
import { useAuth } from '@/shared/context/AuthContext';
import { appPaths } from '@/shared/routes';
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
    <div className="min-h-screen bg-gray-100">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-3 sm:h-16 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              to={appPaths.launcher}
              className="inline-flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm font-medium text-brand-600 hover:bg-gray-50"
            >
              <Grid size={16} />
              <span className="hidden sm:inline">Semua modul</span>
            </Link>
            <span className="text-sm font-semibold text-brand-800">
              {moduleName}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {loginName && (
              <span className="hidden text-xs font-semibold text-brand-700 sm:inline">
                {loginName}
              </span>
            )}
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
