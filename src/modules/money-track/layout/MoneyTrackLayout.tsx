import { NavLink, Outlet, Link } from 'react-router-dom';
import {
  CreditCard,
  Grid,
  LogOut,
  Plus,
  X,
} from 'react-feather';
import { useAuth } from '@/shared/context/AuthContext';
import { appPaths, moneyPaths } from '@/shared/routes';
import { MoneyModalsHost } from '@/modules/money-track/components/modals/MoneyModalsHost';
import type { MoneyModalType } from '@/modules/money-track/components/modals/modalTypes';
import {
  MoneyTrackUiProvider,
  useMoneyTrackUi,
} from '@/modules/money-track/context/MoneyTrackUiContext';

const NAV_ITEMS = [
  { to: moneyPaths.home, label: 'Dashboard', end: true },
  { to: moneyPaths.transactions, label: 'Transaksi', end: false },
  { to: moneyPaths.pockets, label: 'Kantong', end: false },
  { to: moneyPaths.wishlist, label: 'Wishlist', end: false },
  { to: moneyPaths.debts, label: 'Utang Piutang', end: false },
  { to: moneyPaths.balancing, label: 'Balancing', end: false },
] as const;

const QUICK_ACTIONS: {
  type: MoneyModalType;
  title: string;
  subtitle: string;
  tone: 'primary' | 'rose' | 'violet' | 'amber';
}[] = [
  {
    type: 'transaction',
    title: 'Catat Transaksi',
    subtitle: 'Pemasukan atau pengeluaran harian',
    tone: 'primary',
  },
  {
    type: 'transfer',
    title: 'Transfer ke Pasangan',
    subtitle: 'Kirim uang ke pasangan',
    tone: 'rose',
  },
  {
    type: 'move',
    title: 'Pindah Antar Kantong',
    subtitle: 'Geser saldo antar kantong sendiri',
    tone: 'violet',
  },
  {
    type: 'cash',
    title: 'Tarik Tunai',
    subtitle: 'Catat uang keluar jadi cash',
    tone: 'amber',
  },
];

function MoneyTrackChrome() {
  const { logout } = useAuth();
  const {
    data,
    scope,
    setScope,
    scopeLabel,
    quickAddOpen,
    setQuickAddOpen,
    dataSource,
    setDataSource,
    openModal,
  } = useMoneyTrackUi();

  const coupleNames = data.persons.map((p) => p.name).join(' & ');
  const brandSub =
    data.persons.length === 0
      ? dataSource === 'api'
        ? 'Sumber: API'
        : 'Sumber: Dummy'
      : data.mode === 'couple'
        ? `Pasangan · ${coupleNames}`
        : 'Pribadi';

  return (
    <div className="font-money min-h-screen bg-money-bg text-money-ink">
      <header className="sticky top-0 z-40 border-b border-money-border bg-money-surface/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1280px] items-center gap-3 px-3 py-2.5 sm:gap-4 sm:px-6 lg:px-7">
          <Link
            to={appPaths.launcher}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-money-muted hover:bg-money-soft"
            title="Semua modul"
          >
            <Grid size={15} />
            <span className="hidden lg:inline">Modul</span>
          </Link>

          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-money-amber-soft text-money-amber">
              <CreditCard size={18} />
            </div>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-[15px] font-bold">Money Track</div>
              <div className="truncate text-[11.5px] text-money-faint">
                {brandSub}
              </div>
            </div>
          </div>

          <nav className="ml-1 hidden min-w-0 flex-1 items-center gap-0.5 overflow-x-auto md:flex">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  [
                    'whitespace-nowrap rounded-[9px] px-3 py-2 text-[13.5px] font-semibold transition-colors',
                    isActive
                      ? 'bg-money-brown-soft text-money-brown-deep'
                      : 'text-money-muted hover:bg-money-soft',
                  ].join(' ')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {data.mode === 'couple' && data.persons.length > 0 && (
              <div className="hidden items-center gap-1.5 sm:flex">
                <button
                  type="button"
                  onClick={() => setScope('all')}
                  className={[
                    'rounded-full border-[1.5px] px-2.5 py-1.5 text-[11px] font-bold',
                    scope === 'all'
                      ? 'border-money-brown-deep bg-money-brown-soft text-money-brown-deep'
                      : 'border-money-border text-money-faint hover:bg-money-soft',
                  ].join(' ')}
                >
                  Gabungan
                </button>
                {data.persons.map((p) => {
                  const active = scope === p.id;
                  const isHusband = p.role === 'husband';
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setScope(p.id)}
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
                      {p.name}
                    </button>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              onClick={() => setQuickAddOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-money-brown text-white shadow-[0_8px_16px_-6px_rgba(91,124,153,0.55)] hover:bg-money-brown-deep md:hidden"
              aria-label="Tambah"
            >
              <Plus size={20} />
            </button>

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

        {/* Mobile nav */}
        <nav className="flex gap-1 overflow-x-auto border-t border-money-border px-3 py-2 md:hidden">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  'whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold',
                  isActive
                    ? 'bg-money-brown-soft text-money-brown-deep'
                    : 'text-money-muted',
                ].join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <div className="border-b border-[#d5dde6] bg-money-brown-soft">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-2 px-3 py-2 text-[13px] text-money-brown-deep sm:px-6 lg:px-7">
          <span>Melihat data:</span>
          <span className="rounded-full border border-[#cfd8e2] bg-money-surface px-2.5 py-0.5 text-[12.5px] font-bold">
            {scopeLabel}
          </span>
          <span className="hidden text-xs text-[#6f9166] sm:inline">
            Semua kartu mengikuti pilihan ini
          </span>

          <div
            className="ml-auto flex items-center gap-2"
            role="group"
            aria-label="Sumber data"
          >
            <span className="hidden text-[11px] font-bold uppercase tracking-wide text-[#6f9166] sm:inline">
              Sumber
            </span>
            <div className="inline-flex rounded-full border border-[#cfd8e2] bg-money-surface p-0.5">
              <button
                type="button"
                onClick={() => setDataSource('dummy')}
                className={[
                  'rounded-full px-2.5 py-1 text-[11.5px] font-bold transition-colors',
                  dataSource === 'dummy'
                    ? 'bg-money-brown text-white'
                    : 'text-money-muted hover:bg-money-soft',
                ].join(' ')}
              >
                Dummy
              </button>
              <button
                type="button"
                onClick={() => setDataSource('api')}
                className={[
                  'rounded-full px-2.5 py-1 text-[11.5px] font-bold transition-colors',
                  dataSource === 'api'
                    ? 'bg-money-blue text-white'
                    : 'text-money-muted hover:bg-money-soft',
                ].join(' ')}
              >
                API
              </button>
            </div>
            <button
              type="button"
              onClick={() => setQuickAddOpen(true)}
              className="hidden items-center gap-1.5 rounded-full bg-money-brown px-3 py-1.5 text-xs font-bold text-white hover:bg-money-brown-deep md:inline-flex"
            >
              <Plus size={14} />
              Catat
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1280px] px-3 py-6 sm:px-6 lg:px-7 lg:py-8">
        <Outlet />
      </main>

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
              {QUICK_ACTIONS.map((action, index) => (
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
                      action.tone === 'rose' &&
                        'bg-money-rose-soft text-money-rose',
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
