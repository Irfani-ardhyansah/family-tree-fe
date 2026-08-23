import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Home, Key, LogOut, Shield } from 'react-feather';
import { NotificationBell } from '@/shared/components/ui/NotificationBell';
import { useAuth } from '@/shared/context/AuthContext';
import { useSecondaryPasswordGate } from '@/shared/context/SecondaryPasswordGateContext';
import { MODULE_CATALOG, type ModuleDevStatus } from '@/shared/data/moduleCatalog';
import { useIsAdmin } from '@/shared/hooks/useIsAdmin';
import { adminPaths, appPaths } from '@/shared/routes';
import { Footer } from '@/shared/components/ui/Footer';
import { ThemeToggle } from '@/shared/ui';
import { shortPersonName } from '@/shared/utils/personDisplayName';

const SENSITIVE_MODULE_IDS = new Set(['core', 'money', 'household']);

const STATUS_STYLES: Record<
  ModuleDevStatus,
  { label: string; className: string }
> = {
  'in-dev': {
    label: 'In dev',
    className: 'bg-amber-700/80 text-amber-100',
  },
  planned: {
    label: 'Planned',
    className: 'bg-slate-700 text-slate-200',
  },
  ready: {
    label: 'Ready',
    className: 'bg-emerald-700/90 text-emerald-100',
  },
};

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function LauncherPage() {
  const { person, logout, mustSetupSecondaryPassword, hasSecondaryPassword } =
    useAuth();
  const { ensureUnlocked, openChangePassword } = useSecondaryPasswordGate();
  const isAdmin = useIsAdmin();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const setupPrompted = useRef(false);

  const displayName = useMemo(
    () => (person ? shortPersonName(person, person.fullName) : 'Pengguna'),
    [person],
  );
  const initials = useMemo(
    () => getInitials(person?.fullName ?? displayName),
    [person?.fullName, displayName],
  );

  const isModuleEnabled = useMemo(() => {
    const map = new Map(
      (person?.moduleStatuses ?? []).map((m) => [m.moduleId, m.enabled]),
    );
    return (moduleId: string) => map.get(moduleId) ?? true;
  }, [person?.moduleStatuses]);

  useEffect(() => {
    if (!mustSetupSecondaryPassword || setupPrompted.current) return;
    setupPrompted.current = true;
    void ensureUnlocked();
  }, [mustSetupSecondaryPassword, ensureUnlocked]);

  const openModule = async (to: string) => {
    const ok = await ensureUnlocked();
    if (ok) navigate(to);
  };

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate(appPaths.login, { replace: true });
  };

  return (
    <div
      data-module="launcher"
      className="flex min-h-screen flex-col bg-suite-bg text-suite-ink"
    >
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(106,168,106,0.12),_transparent_55%)]" />

      <div className="relative mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg shadow-primary-900/40">
              <Home size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-suite-ink sm:text-xl">
                Family Suite
              </h1>
              <p className="text-xs text-suite-faint sm:text-sm">
                Platform keluarga Ardhyansah
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationBell />

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="inline-flex items-center gap-2 rounded-full border border-suite-border bg-suite-surface py-1.5 pl-1.5 pr-3 transition hover:bg-suite-soft"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-xs font-bold">
                {initials}
              </span>
              <span className="hidden text-sm font-medium text-suite-ink sm:inline">
                {displayName}
              </span>
              <ChevronDown size={14} className="text-suite-faint" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border border-suite-border bg-suite-surface shadow-xl">
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      void openModule(adminPaths.home);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-admin-700 hover:bg-suite-soft dark:text-teal-200"
                  >
                    <Shield size={14} />
                    Admin Panel
                  </button>
                )}
                {hasSecondaryPassword && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      openChangePassword();
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-suite-ink hover:bg-suite-soft"
                  >
                    <Key size={14} />
                    Ganti password kedua
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-suite-ink hover:bg-suite-soft"
                >
                  <LogOut size={14} />
                  Keluar
                </button>
              </div>
            )}
          </div>
          </div>
        </header>

        <section className="mt-10 sm:mt-12">
          <h2 className="text-3xl font-bold tracking-tight text-suite-ink sm:text-4xl">
            Selamat datang 👋
          </h2>
          <p className="mt-2 text-sm text-suite-muted sm:text-base">
            Pilih aplikasi yang ingin kamu buka
          </p>
        </section>

        <section className="mt-8 grid grid-cols-1 gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-5">
          {MODULE_CATALOG.map((mod) => {
            const status = STATUS_STYLES[mod.status];
            const ModIcon = mod.Icon;
            const enabled = isModuleEnabled(mod.id);
            const cardClass = `group relative rounded-3xl border border-suite-border border-t-4 ${mod.accent} bg-suite-surface p-5 shadow-card transition duration-200 ${
              enabled
                ? 'hover:-translate-y-0.5 hover:border-suite-muted/40'
                : 'cursor-not-allowed opacity-55'
            }`;

            const body = (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${mod.iconWrap}`}
                  >
                    <ModIcon size={22} className={mod.iconColor} />
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      enabled
                        ? status.className
                        : 'bg-rose-900/80 text-rose-100'
                    }`}
                  >
                    {enabled ? status.label : 'Nonaktif'}
                  </span>
                </div>

                <div className="mt-4">
                  <h3
                    className={`text-lg font-bold text-suite-ink ${
                      enabled
                        ? (mod.titleHover ?? 'group-hover:text-primary-600 dark:group-hover:text-primary-200')
                        : ''
                    }`}
                  >
                    {mod.title}
                  </h3>
                  <p className="text-sm text-suite-muted">
                    {enabled
                      ? mod.subtitle
                      : 'Modul dimatikan oleh admin keluarga'}
                  </p>
                </div>

                <ul className="mt-5 space-y-2.5">
                  {mod.features.map(({ label, icon: FeatureIcon }) => (
                    <li
                      key={label}
                      className="flex items-center gap-2.5 text-sm text-suite-muted"
                    >
                      <FeatureIcon
                        size={15}
                        className={`flex-shrink-0 ${mod.iconColor}`}
                      />
                      {label}
                    </li>
                  ))}
                </ul>
              </>
            );

            if (!enabled) {
              return (
                <div key={mod.id} className={cardClass} aria-disabled>
                  {body}
                </div>
              );
            }

            if (SENSITIVE_MODULE_IDS.has(mod.id)) {
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => void openModule(mod.to)}
                  className={`${cardClass} w-full text-left`}
                >
                  {body}
                </button>
              );
            }

            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => navigate(mod.to)}
                className={`${cardClass} w-full text-left`}
              >
                {body}
              </button>
            );
          })}

          {isAdmin && (
            <button
              type="button"
              onClick={() => void openModule(adminPaths.home)}
              className="group relative w-full rounded-3xl border border-suite-border border-t-4 border-t-teal-500 bg-suite-surface p-5 text-left shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-admin-300 sm:col-span-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/15">
                  <Shield size={22} className="text-teal-400" />
                </div>
                <span className="rounded-full bg-teal-800/80 px-2.5 py-1 text-[11px] font-semibold text-teal-100">
                  Admin only
                </span>
              </div>
              <div className="mt-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-suite-ink group-hover:text-admin-700 dark:group-hover:text-teal-200">
                    Admin Panel
                  </h3>
                  <p className="text-sm text-suite-muted">
                    Kontrol modul, audit, sesi, dan broadcast keluarga
                  </p>
                </div>
                <span className="mt-3 text-sm font-semibold text-teal-400 sm:mt-0">
                  Buka kontrol →
                </span>
              </div>
            </button>
          )}
        </section>
      </div>
      <Footer />
    </div>
  );
}
