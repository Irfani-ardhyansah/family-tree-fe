import { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from '@headlessui/react';
import { ArrowRight, ChevronDown, Home, Key, LogOut, Shield } from 'react-feather';
import { NotificationBell } from '@/shared/components/ui/NotificationBell';
import { useAuth } from '@/shared/context/AuthContext';
import { useSecondaryPasswordGate } from '@/shared/context/SecondaryPasswordGateContext';
import {
  MODULE_CATALOG,
  type ModuleCatalogItem,
} from '@/shared/data/moduleCatalog';
import { useIsAdmin } from '@/shared/hooks/useIsAdmin';
import { adminPaths, appPaths } from '@/shared/routes';
import { ThemeToggle } from '@/shared/ui';
import { cx } from '@/shared/ui/cx';
import { shortPersonName } from '@/shared/utils/personDisplayName';

const SENSITIVE_MODULE_IDS = new Set(['core', 'money', 'household']);

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function ModuleCard({
  item,
  enabled,
  onSelect,
}: {
  item: ModuleCatalogItem;
  enabled: boolean;
  onSelect?: () => void;
}) {
  const ModIcon = item.Icon;
  const badgeLabel = !enabled
    ? 'Nonaktif'
    : item.status === 'planned'
      ? 'Segera'
      : null;
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span
          className={cx(
            'flex h-12 w-12 items-center justify-center rounded-2xl',
            item.iconWrap,
          )}
        >
          <ModIcon size={22} className={item.iconColor} />
        </span>
        {badgeLabel ? (
          <span
            className={cx(
              'rounded-full px-2.5 py-1 text-[11px] font-semibold',
              enabled
                ? 'bg-suite-soft text-suite-muted'
                : 'bg-rose-500/12 text-rose-700 dark:text-rose-300',
            )}
          >
            {badgeLabel}
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex-1">
        <h3 className="text-lg font-bold tracking-tight text-suite-ink">
          {item.title}
        </h3>
        <p className="mt-0.5 text-xs font-medium text-suite-faint">
          {item.subtitle}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-suite-muted">
          {enabled ? item.description : 'Modul dimatikan oleh admin keluarga'}
        </p>
      </div>

      {enabled ? (
        <>
          <div className="mt-5 flex flex-wrap gap-1.5">
            {item.features.map(({ label }) => (
              <span
                key={label}
                className="rounded-full bg-suite-soft px-2.5 py-1 text-[11px] font-medium text-suite-muted"
              >
                {label}
              </span>
            ))}
          </div>
          <span
            className={cx(
              'mt-5 inline-flex items-center gap-1 text-sm font-semibold',
              item.iconColor,
            )}
          >
            Buka
            <ArrowRight
              size={14}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </span>
        </>
      ) : null}
    </>
  );

  const cardClass = cx(
    'group relative flex w-full flex-col rounded-[24px] border border-suite-border/80 bg-suite-surface/90 p-5 text-left shadow-card backdrop-blur-md transition duration-200',
    enabled
      ? 'hover:-translate-y-0.5 hover:border-suite-muted/35 hover:shadow-md'
      : 'cursor-not-allowed opacity-55',
  );

  if (!enabled) {
    return (
      <div className={cardClass} aria-disabled>
        {body}
      </div>
    );
  }

  return (
    <button type="button" onClick={onSelect} className={cardClass}>
      {body}
    </button>
  );
}

export function LauncherPage() {
  const { person, logout, mustSetupSecondaryPassword, hasSecondaryPassword } =
    useAuth();
  const { ensureUnlocked, openChangePassword } = useSecondaryPasswordGate();
  const isAdmin = useIsAdmin();
  const navigate = useNavigate();
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
    await logout();
    navigate(appPaths.login, { replace: true });
  };

  const handleSelect = (item: ModuleCatalogItem) => {
    if (SENSITIVE_MODULE_IDS.has(item.id)) {
      void openModule(item.to);
      return;
    }
    navigate(item.to);
  };

  return (
    <div
      data-module="launcher"
      className="relative flex min-h-screen flex-col overflow-hidden bg-suite-bg text-suite-ink"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-28 -top-24 h-[22rem] w-[22rem] rounded-full bg-primary-500/16 blur-3xl" />
        <div className="absolute -right-20 top-[32%] h-72 w-72 rounded-full bg-primary-800/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(106,168,106,0.08),_transparent_52%)]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-md shadow-primary-900/25">
              <Home size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight tracking-tight text-suite-ink">
                Family Suite
              </h1>
              <p className="text-xs font-medium text-suite-faint">
                Platform keluarga Ardhyansah
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-full border border-suite-border/80 bg-suite-surface/80 p-0.5 shadow-sm backdrop-blur-md">
              <ThemeToggle />
              <NotificationBell className="h-9 w-9 rounded-full" />
            </div>

            <Menu>
              <MenuButton className="inline-flex items-center gap-2 rounded-full border border-suite-border/80 bg-suite-surface/80 py-1 pl-1 pr-2.5 shadow-sm backdrop-blur-md transition hover:bg-suite-surface sm:pr-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-xs font-bold text-white">
                  {initials}
                </span>
                <span className="hidden max-w-[9rem] truncate text-sm font-medium text-suite-ink sm:inline">
                  {displayName}
                </span>
                <ChevronDown size={14} className="text-suite-faint" />
              </MenuButton>

              <MenuItems
                transition
                anchor="bottom end"
                className="z-20 w-56 origin-top-right rounded-2xl border border-suite-border bg-suite-surface p-1 shadow-card [--anchor-gap:8px] focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0"
              >
                {isAdmin && (
                  <MenuItem>
                    <button
                      type="button"
                      onClick={() => void openModule(adminPaths.home)}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-suite-ink data-[focus]:bg-suite-soft"
                    >
                      <Shield size={14} className="text-admin-600 dark:text-admin-300" />
                      Admin Panel
                    </button>
                  </MenuItem>
                )}
                {hasSecondaryPassword && (
                  <MenuItem>
                    <button
                      type="button"
                      onClick={openChangePassword}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-suite-ink data-[focus]:bg-suite-soft"
                    >
                      <Key size={14} className="text-suite-faint" />
                      Ganti password kedua
                    </button>
                  </MenuItem>
                )}
                <MenuItem>
                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-suite-ink data-[focus]:bg-suite-soft"
                  >
                    <LogOut size={14} className="text-suite-faint" />
                    Keluar
                  </button>
                </MenuItem>
              </MenuItems>
            </Menu>
          </div>
        </header>

        <section className="mt-10 sm:mt-14">
          <h2 className="text-3xl font-extrabold tracking-tight text-suite-ink sm:text-4xl">
            Halo, {displayName}
          </h2>
          <p className="mt-2 text-sm text-suite-muted sm:text-base">
            Pilih modul untuk mulai
          </p>
        </section>

        <section className="mt-8 grid grid-cols-1 gap-3 sm:mt-10 sm:grid-cols-2 sm:gap-4">
          {MODULE_CATALOG.map((item) => {
            const enabled = isModuleEnabled(item.id);
            return (
              <ModuleCard
                key={item.id}
                item={item}
                enabled={enabled}
                onSelect={enabled ? () => handleSelect(item) : undefined}
              />
            );
          })}
        </section>

        {isAdmin && (
          <button
            type="button"
            onClick={() => void openModule(adminPaths.home)}
            className="group mt-4 flex w-full items-center gap-4 rounded-[24px] border border-suite-border/80 bg-suite-surface/90 px-5 py-4 text-left shadow-card backdrop-blur-md transition duration-200 hover:-translate-y-0.5 hover:border-admin-300/50"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-admin-500/12 text-admin-700 dark:text-admin-300">
              <Shield size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-bold tracking-tight text-suite-ink">
                Admin Panel
              </p>
              <p className="text-sm text-suite-muted">
                Kontrol modul, audit, sesi, dan broadcast keluarga
              </p>
            </div>
            <span className="hidden items-center gap-1 text-sm font-semibold text-admin-700 sm:inline-flex dark:text-admin-300">
              Buka
              <ArrowRight
                size={14}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </span>
          </button>
        )}

        <p className="mt-auto pt-12 pb-2 text-center text-xs text-suite-faint">
          © {new Date().getFullYear()} Family Suite
        </p>
      </div>
    </div>
  );
}
