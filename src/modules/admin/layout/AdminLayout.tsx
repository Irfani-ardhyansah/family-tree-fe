import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Activity,
  Archive,
  Bell,
  Clipboard,
  Grid,
  LogOut,
  Menu,
  Settings,
  Shield,
  Sliders,
  Users,
  X,
} from 'react-feather';
import { AdminToastProvider } from '@/modules/admin/components/AdminToast';
import { useAuth } from '@/shared/context/AuthContext';
import { adminPaths, appPaths } from '@/shared/routes';
import { shortPersonName } from '@/shared/utils/personDisplayName';

type NavItem = {
  to: string;
  label: string;
  icon: typeof Shield;
  end?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { to: adminPaths.home, label: 'Dashboard', icon: Activity, end: true },
  // RBAC Modul — disembunyikan sementara
  { to: adminPaths.modules, label: 'Status Modul', icon: Sliders },
  { to: adminPaths.audit, label: 'Audit Log', icon: Clipboard },
  { to: adminPaths.sessions, label: 'Session', icon: Users },
  { to: adminPaths.broadcast, label: 'Broadcast', icon: Bell },
  { to: adminPaths.settings, label: 'Pengaturan', icon: Settings },
  { to: adminPaths.backup, label: 'Backup & Export', icon: Archive },
];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
      {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition duration-200 ${
              isActive
                ? 'bg-admin-500/15 text-admin-200 shadow-[inset_0_0_0_1px_rgba(45,212,191,0.25)]'
                : 'text-ink-300 hover:bg-white/5 hover:text-white'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon
                size={17}
                className={
                  isActive
                    ? 'text-admin-300'
                    : 'text-ink-400 group-hover:text-ink-200'
                }
              />
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function SidebarChrome({
  footer,
  onNavigate,
}: {
  footer: ReactNode;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 px-5 py-5">
        <Link
          to={adminPaths.home}
          onClick={onNavigate}
          className="flex items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-admin-400 to-admin-700 shadow-lg shadow-admin-950/40">
            <Shield size={18} className="text-white" />
          </div>
          <div>
            <p className="font-admin-display text-lg font-bold leading-tight text-white">
              Admin
            </p>
            <p className="text-[11px] font-medium tracking-wide text-admin-300/90">
              Family Suite Control
            </p>
          </div>
        </Link>
      </div>
      <SidebarNav onNavigate={onNavigate} />
      {footer}
    </div>
  );
}

export function AdminLayout() {
  const { person, logout } = useAuth();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const loginName = person
    ? shortPersonName(person, person.fullName)
    : 'Admin';

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const footer = (
    <div className="mt-auto space-y-2 border-t border-white/10 p-3">
      <Link
        to={appPaths.launcher}
        className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-300 transition hover:bg-white/5 hover:text-white"
      >
        <Grid size={16} />
        Semua modul
      </Link>
      <button
        type="button"
        onClick={() => void logout()}
        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-300 transition hover:bg-rose-500/10 hover:text-rose-300"
      >
        <LogOut size={16} />
        Keluar
      </button>
      <div className="rounded-xl bg-white/5 px-3 py-2.5">
        <p className="text-[11px] uppercase tracking-wider text-ink-500">
          Masuk sebagai
        </p>
        <p className="truncate text-sm font-semibold text-ink-100">
          {loginName}
        </p>
      </div>
    </div>
  );

  return (
    <AdminToastProvider>
      <div className="font-admin min-h-screen bg-ink-50 text-ink-800">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(20,184,166,0.12),_transparent_50%),radial-gradient(ellipse_at_bottom_left,_rgba(15,23,42,0.06),_transparent_45%)]" />

        <div className="relative flex min-h-screen">
          <aside className="sticky top-0 hidden h-screen w-64 shrink-0 bg-ink-950 text-white lg:flex lg:flex-col">
            <SidebarChrome footer={footer} />
          </aside>

          {drawerOpen && (
            <div className="fixed inset-0 z-40 lg:hidden">
              <button
                type="button"
                aria-label="Tutup menu"
                className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm"
                onClick={() => setDrawerOpen(false)}
              />
              <aside className="absolute inset-y-0 left-0 flex w-[min(18rem,88vw)] flex-col bg-ink-950 text-white shadow-2xl animate-[adminDrawer_0.22s_ease-out]">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="absolute right-3 top-4 rounded-lg p-2 text-ink-300 hover:bg-white/10 hover:text-white"
                >
                  <X size={18} />
                </button>
                <SidebarChrome
                  footer={footer}
                  onNavigate={() => setDrawerOpen(false)}
                />
              </aside>
            </div>
          )}

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-30 border-b border-ink-200/80 bg-white/80 backdrop-blur-md lg:hidden">
              <div className="flex h-14 items-center justify-between gap-3 px-4">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl px-2.5 py-2 text-ink-700 hover:bg-ink-100"
                >
                  <Menu size={18} />
                  <span className="text-sm font-semibold">Admin</span>
                </button>
                <span className="truncate text-xs font-semibold text-ink-500">
                  {loginName}
                </span>
              </div>
            </header>

            <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
              <div
                key={location.pathname}
                className="mx-auto max-w-6xl animate-[adminFade_0.28s_ease-out]"
              >
                <Outlet />
              </div>
            </main>
          </div>
        </div>

        <style>{`
          @keyframes adminFade {
            from { opacity: 0; transform: translateY(6px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes adminDrawer {
            from { transform: translateX(-12px); opacity: 0.85; }
            to { transform: translateX(0); opacity: 1; }
          }
        `}</style>
      </div>
    </AdminToastProvider>
  );
}
