import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Home, Key, LogOut, Shield } from 'react-feather';
import { NotificationBell } from '@/shared/components/ui/NotificationBell';
import { useAuth } from '@/shared/context/AuthContext';
import { useSecondaryPasswordGate } from '@/shared/context/SecondaryPasswordGateContext';
import { MODULE_CATALOG, type ModuleDevStatus } from '@/shared/data/moduleCatalog';
import { useIsAdmin } from '@/shared/hooks/useIsAdmin';
import { adminPaths, appPaths } from '@/shared/routes';
import { shortPersonName } from '@/shared/utils/personDisplayName';

const SENSITIVE_MODULE_IDS = new Set(['money', 'household']);

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
    <div className="min-h-screen bg-[#0b0d10] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(106,168,106,0.12),_transparent_55%)]" />

      <div className="relative mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg shadow-primary-900/40">
              <Home size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white sm:text-xl">
                Family Suite
              </h1>
              <p className="text-xs text-zinc-400 sm:text-sm">
                Platform keluarga Ardhyansah
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell variant="dark" />

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="inline-flex items-center gap-2 rounded-full border border-zinc-700/80 bg-zinc-900/80 py-1.5 pl-1.5 pr-3 transition hover:border-zinc-500"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-xs font-bold">
                {initials}
              </span>
              <span className="hidden text-sm font-medium text-zinc-100 sm:inline">
                {displayName}
              </span>
              <ChevronDown size={14} className="text-zinc-400" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl">
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      void openModule(adminPaths.home);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-teal-200 hover:bg-zinc-800"
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
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-zinc-200 hover:bg-zinc-800"
                  >
                    <Key size={14} />
                    Ganti password kedua
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-zinc-200 hover:bg-zinc-800"
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
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Selamat datang 👋
          </h2>
          <p className="mt-2 text-sm text-zinc-400 sm:text-base">
            Pilih aplikasi yang ingin kamu buka
          </p>
        </section>

        <section className="mt-8 grid grid-cols-1 gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-5">
          {MODULE_CATALOG.map((mod) => {
            const status = STATUS_STYLES[mod.status];
            const ModIcon = mod.Icon;
            const enabled = isModuleEnabled(mod.id);
            const cardClass = `group relative rounded-3xl border border-zinc-800/90 border-t-4 ${mod.accent} bg-zinc-900/70 p-5 shadow-lg shadow-black/20 transition duration-200 ${
              enabled
                ? 'hover:-translate-y-0.5 hover:border-zinc-700 hover:bg-zinc-900'
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
                    className={`text-lg font-bold text-white ${
                      enabled
                        ? (mod.titleHover ?? 'group-hover:text-primary-200')
                        : ''
                    }`}
                  >
                    {mod.title}
                  </h3>
                  <p className="text-sm text-zinc-400">
                    {enabled
                      ? mod.subtitle
                      : 'Modul dimatikan oleh admin keluarga'}
                  </p>
                </div>

                <ul className="mt-5 space-y-2.5">
                  {mod.features.map(({ label, icon: FeatureIcon }) => (
                    <li
                      key={label}
                      className="flex items-center gap-2.5 text-sm text-zinc-300"
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
              className="group relative w-full rounded-3xl border border-zinc-800/90 border-t-4 border-t-teal-500 bg-zinc-900/70 p-5 text-left shadow-lg shadow-black/20 transition duration-200 hover:-translate-y-0.5 hover:border-zinc-700 hover:bg-zinc-900 sm:col-span-2"
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
                  <h3 className="text-lg font-bold text-white group-hover:text-teal-200">
                    Admin Panel
                  </h3>
                  <p className="text-sm text-zinc-400">
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
    </div>
  );
}
