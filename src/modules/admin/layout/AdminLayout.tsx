import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Grid, LogOut, Menu, Shield } from 'react-feather';
import { AdminToastProvider } from '@/modules/admin/components/AdminToast';
import { AdminSidebar } from '@/modules/admin/layout/AdminSidebar';
import { useAuth } from '@/shared/context/AuthContext';
import { appPaths } from '@/shared/routes';
import { Footer } from '@/shared/components/ui/Footer';
import { ThemeToggle } from '@/shared/ui';
import { shortPersonName } from '@/shared/utils/personDisplayName';

const SIDEBAR_COLLAPSED_KEY = 'admin.sidebarCollapsed';

function readSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
}

function writeSidebarCollapsed(collapsed: boolean) {
  try {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0');
  } catch {
    /* ignore */
  }
}

export function AdminLayout() {
  const { person, logout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(readSidebarCollapsed);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const loginName = person
    ? shortPersonName(person, person.fullName)
    : 'Admin';

  useEffect(() => {
    writeSidebarCollapsed(collapsed);
  }, [collapsed]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  return (
    <AdminToastProvider>
      <div
        data-module="admin"
        className="min-h-screen bg-suite-bg text-suite-ink"
      >
        <div className="h-0.5 bg-gradient-to-r from-admin-700 via-admin-400 to-teal-300" />
        <div className="flex min-h-[calc(100vh-2px)]">
          <aside
            className={[
              'sticky top-0 z-20 hidden h-[calc(100vh-2px)] shrink-0 overflow-hidden transition-[width] duration-200 lg:flex lg:flex-col',
              collapsed ? 'w-16' : 'w-60',
            ].join(' ')}
          >
            <AdminSidebar
              collapsed={collapsed}
              showCollapseToggle
              onToggleCollapsed={() => setCollapsed((prev) => !prev)}
            />
          </aside>

          {drawerOpen ? (
            <div className="fixed inset-0 z-40 lg:hidden">
              <button
                type="button"
                aria-label="Tutup menu"
                className="absolute inset-0 bg-[rgba(20,24,15,0.45)]"
                onClick={() => setDrawerOpen(false)}
              />
              <aside className="absolute inset-y-0 left-0 flex w-[min(18rem,88vw)] flex-col overflow-hidden shadow-2xl">
                <AdminSidebar
                  collapsed={false}
                  onNavigate={() => setDrawerOpen(false)}
                />
              </aside>
            </div>
          ) : null}

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-30 border-b border-suite-border bg-suite-surface/95 backdrop-blur-md">
              <div className="flex h-14 items-center gap-2 px-3 sm:px-5">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className="rounded-control p-2 text-suite-muted hover:bg-suite-soft lg:hidden"
                  aria-label="Buka menu"
                >
                  <Menu size={18} />
                </button>

                <div className="flex min-w-0 items-center gap-2.5 lg:hidden">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-admin-50 text-admin-700 dark:bg-admin-600/25 dark:text-admin-300">
                    <Shield size={18} />
                  </div>
                  <div className="hidden min-w-0 leading-tight sm:block">
                    <div className="truncate text-[15px] font-bold text-suite-ink">
                      Admin Console
                    </div>
                  </div>
                </div>

                <div className="ml-1 hidden min-w-0 flex-1 sm:block">
                  <span className="inline-flex max-w-[16rem] items-center gap-1.5 truncate rounded-full border border-admin-200 bg-admin-50 px-2.5 py-1 text-[12px] font-bold text-admin-800 dark:border-admin-500/40 dark:bg-admin-600/20 dark:text-admin-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-admin-500 dark:bg-admin-300" />
                    Operator · {loginName}
                  </span>
                </div>

                <div className="ml-auto flex items-center gap-1.5">
                  <ThemeToggle />
                  <Link
                    to={appPaths.launcher}
                    className="inline-flex shrink-0 items-center justify-center rounded-control p-2 text-suite-muted hover:bg-suite-soft"
                    title="Semua modul"
                    aria-label="Semua modul"
                  >
                    <Grid size={15} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => void logout()}
                    className="inline-flex items-center gap-1 rounded-control px-2 py-1.5 text-xs font-semibold text-suite-muted hover:bg-money-rose-soft hover:text-money-rose dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
                  >
                    <LogOut size={15} />
                    <span className="hidden sm:inline">Keluar</span>
                  </button>
                </div>
              </div>
            </header>

            <main className="mx-auto w-full max-w-[1280px] flex-1 px-3 py-6 sm:px-6 lg:px-7 lg:py-8">
              <Outlet />
            </main>
            <Footer moduleName="Admin Console" />
          </div>
        </div>
      </div>
    </AdminToastProvider>
  );
}
