import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { CreditCard, Grid, LogOut, Menu, Plus, X } from 'react-feather';
import { useAuth } from '@/shared/context/AuthContext';
import { appPaths } from '@/shared/routes';
import { MoneyModalsHost } from '@/modules/money-track/components/modals/MoneyModalsHost';
import {
  MoneyTrackUiProvider,
  useMoneyTrackUi,
} from '@/modules/money-track/context/MoneyTrackUiContext';
import { MoneySidebar } from '@/modules/money-track/layout/MoneySidebar';
import { MONEY_QUICK_ACTIONS } from '@/modules/money-track/layout/moneyNav';
import type { MoneyPerson, MoneyScope } from '@/modules/money-track/types';

const SIDEBAR_COLLAPSED_KEY = 'money-track.sidebarCollapsed';

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

function NavbarScope() {
  const { data, scope, setScope, scopeLabel } = useMoneyTrackUi();
  const showCouple = data.mode === 'couple' && data.persons.length > 0;

  return (
    <div className="ml-1 flex min-w-0 flex-1 items-center gap-2">
      <span className="hidden shrink-0 text-[12px] text-money-muted lg:inline">
        Melihat data:
      </span>
      {showCouple ? (
        <>
          <div className="hidden items-center gap-1.5 sm:flex">
            <ScopePills
              scope={scope}
              persons={data.persons}
              onChange={setScope}
            />
          </div>
          <ScopeMenu
            scope={scope}
            scopeLabel={scopeLabel}
            persons={data.persons}
            onChange={setScope}
            className="sm:hidden"
          />
        </>
      ) : (
        <span className="max-w-[9rem] truncate rounded-full border border-money-border bg-money-soft px-2.5 py-1 text-[12px] font-bold text-money-brown-deep">
          {scopeLabel}
        </span>
      )}
    </div>
  );
}

function ScopePills({
  scope,
  persons,
  onChange,
}: {
  scope: MoneyScope;
  persons: MoneyPerson[];
  onChange: (next: MoneyScope) => void;
}) {
  return (
    <>
      <button
        type="button"
        onClick={() => onChange('all')}
        className={[
          'rounded-full border-[1.5px] px-2.5 py-1.5 text-[11px] font-bold',
          scope === 'all'
            ? 'border-money-brown-deep bg-money-brown-soft text-money-brown-deep'
            : 'border-money-border text-money-faint hover:bg-money-soft',
        ].join(' ')}
      >
        Gabungan
      </button>
      {persons.map((person) => {
        const active = scope === person.id;
        const isHusband = person.role === 'husband';
        return (
          <button
            key={person.id}
            type="button"
            onClick={() => onChange(person.id)}
            className={[
              'inline-flex items-center gap-1.5 rounded-full border-[1.5px] px-3 py-1.5 text-[12.5px] font-bold',
              active && isHusband
                ? 'border-money-brown bg-money-brown text-white'
                : active && !isHusband
                  ? 'border-money-rose-soft bg-money-rose-soft text-[#8c4038]'
                  : 'border-money-border text-money-muted hover:bg-money-soft',
            ].join(' ')}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {person.name}
          </button>
        );
      })}
    </>
  );
}

function ScopeMenu({
  scope,
  scopeLabel,
  persons,
  onChange,
  className = '',
}: {
  scope: MoneyScope;
  scopeLabel: string;
  persons: MoneyPerson[];
  onChange: (next: MoneyScope) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    return () => document.removeEventListener('mousedown', onPointer);
  }, [open]);

  return (
    <div ref={rootRef} className={['relative', className].filter(Boolean).join(' ')}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        title={`Melihat data: ${scopeLabel}`}
        aria-label={`Melihat data: ${scopeLabel}`}
        aria-expanded={open}
        className="max-w-[8.5rem] truncate rounded-full border border-money-border bg-money-soft px-2.5 py-1 text-[12px] font-bold text-money-brown-deep"
      >
        {scopeLabel}
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-50 mt-1.5 flex w-48 flex-col gap-1 rounded-xl border border-money-border bg-money-surface p-2 shadow-lg">
          <ScopePills
            scope={scope}
            persons={persons}
            onChange={(next) => {
              onChange(next);
              setOpen(false);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

function MoneyTrackChrome() {
  const { logout } = useAuth();
  const location = useLocation();
  const { quickAddOpen, setQuickAddOpen, openModal } = useMoneyTrackUi();
  const [collapsed, setCollapsed] = useState(readSidebarCollapsed);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    writeSidebarCollapsed(collapsed);
  }, [collapsed]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  return (
    <div className="font-money min-h-screen bg-money-bg text-money-ink">
      <div className="flex min-h-screen">
        <aside
          className={[
            'sticky top-0 z-20 hidden h-screen shrink-0 border-r border-money-border bg-money-surface transition-[width] duration-200 lg:flex lg:flex-col',
            collapsed ? 'w-16' : 'w-60',
          ].join(' ')}
        >
          <MoneySidebar
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
            <aside className="absolute inset-y-0 left-0 flex w-[min(18rem,88vw)] flex-col bg-money-surface shadow-2xl">
              <MoneySidebar
                collapsed={false}
                onNavigate={() => setDrawerOpen(false)}
              />
            </aside>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-money-border bg-money-surface/95 backdrop-blur-md">
            <div className="flex h-14 items-center gap-2 px-3 sm:px-5">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="rounded-lg p-2 text-money-muted hover:bg-money-soft lg:hidden"
                aria-label="Buka menu"
              >
                <Menu size={18} />
              </button>

              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-money-amber-soft text-money-amber">
                  <CreditCard size={18} />
                </div>
                <div className="hidden min-w-0 leading-tight sm:block">
                  <div className="truncate text-[15px] font-bold">Money Track</div>
                </div>
              </div>

              <NavbarScope />

              <div className="ml-auto flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setQuickAddOpen(true)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full bg-money-brown font-bold text-white shadow-[0_8px_16px_-6px_rgba(91,124,153,0.55)] hover:bg-money-brown-deep h-9 w-9 sm:h-auto sm:w-auto sm:px-3 sm:py-1.5 sm:text-xs"
                  aria-label="Aksi"
                >
                  <Plus size={16} />
                  <span className="hidden sm:inline">Aksi</span>
                </button>
                <Link
                  to={appPaths.launcher}
                  className="inline-flex shrink-0 items-center justify-center rounded-lg p-2 text-money-muted hover:bg-money-soft"
                  title="Semua modul"
                  aria-label="Semua modul"
                >
                  <Grid size={15} />
                </Link>
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-money-muted hover:bg-money-rose-soft hover:text-money-rose"
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
        </div>
      </div>

      {quickAddOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <button
            type="button"
            className="absolute inset-0 bg-[rgba(20,24,15,0.45)]"
            aria-label="Tutup"
            onClick={() => setQuickAddOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-t-[20px] bg-money-surface p-5 shadow-xl sm:rounded-2xl sm:p-6">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[15px] font-extrabold">Mau catat apa?</h2>
                <p className="text-[12px] text-money-faint">
                  Pilih salah satu untuk lanjut
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQuickAddOpen(false)}
                className="rounded-full p-1.5 text-money-faint hover:bg-money-soft"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-1">
              {MONEY_QUICK_ACTIONS.map((action, index) => (
                <button
                  key={action.type}
                  type="button"
                  onClick={() => openModal(action.type)}
                  className={[
                    'flex w-full items-center gap-3 rounded-[11px] px-2 py-2.5 text-left transition-colors hover:bg-money-soft',
                    index === 0 ? 'bg-money-brown-soft' : '',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'flex h-9 w-9 items-center justify-center rounded-[10px] text-sm font-bold',
                      action.tone === 'primary' && 'bg-money-brown text-white',
                      action.tone === 'rose' && 'bg-money-rose-soft text-money-rose',
                      action.tone === 'violet' &&
                        'bg-money-violet-soft text-money-violet',
                      action.tone === 'amber' &&
                        'bg-money-amber-soft text-money-amber',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {index === 0 ? '±' : index === 1 ? '⇄' : index === 2 ? '⇆' : 'Rp'}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-bold">
                      {action.title}
                    </span>
                    <span className="block text-[11px] text-money-faint">
                      {action.subtitle}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <MoneyModalsHost />
    </div>
  );
}

export function MoneyTrackLayout() {
  return (
    <MoneyTrackUiProvider>
      <MoneyTrackChrome />
    </MoneyTrackUiProvider>
  );
}
