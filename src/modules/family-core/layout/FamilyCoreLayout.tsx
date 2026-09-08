import { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  FileText,
  Grid,
  HardDrive,
  Heart,
  Home,
  LogOut,
  Plus,
  Server,
  X,
} from 'react-feather';
import { CoreModalsHost } from '@/modules/family-core/components/modals/CoreModalsHost';
import { FamilyCoreCalendarProvider } from '@/modules/family-core/context/FamilyCoreCalendarContext';
import { FamilyCoreCalendarEventTypesProvider } from '@/modules/family-core/context/FamilyCoreCalendarEventTypesContext';
import { FamilyCoreDocumentTypesProvider } from '@/modules/family-core/context/FamilyCoreDocumentTypesContext';
import { FamilyCoreDocumentsProvider } from '@/modules/family-core/context/FamilyCoreDocumentsContext';
import { FamilyCoreHealthProvider } from '@/modules/family-core/context/FamilyCoreHealthContext';
import {
  FamilyCoreUiProvider,
  useFamilyCoreUi,
} from '@/modules/family-core/context/FamilyCoreUiContext';
import { useFamilyCoreCalendar } from '@/modules/family-core/context/FamilyCoreCalendarContext';
import { useFamilyCoreDocuments } from '@/modules/family-core/context/FamilyCoreDocumentsContext';
import { toDateKey } from '@/modules/family-core/lib/calendarDate';
import { getDocumentStatus } from '@/modules/family-core/lib/documentStatus';
import { useAuth } from '@/shared/context/AuthContext';
import { useDataSource } from '@/shared/context/DataSourceContext';
import { appPaths, corePaths } from '@/shared/routes';
import { Footer } from '@/shared/components/ui/Footer';
import { ThemeToggle } from '@/shared/ui';
import { shortPersonName } from '@/shared/utils/personDisplayName';

const NAV_ITEMS = [
  {
    to: corePaths.home,
    label: 'Beranda',
    end: true,
    Icon: Home,
    activeClass:
      'bg-sky-100 text-sky-800 ring-sky-200 dark:bg-sky-950/60 dark:text-sky-200 dark:ring-sky-800',
    iconActive: 'bg-sky-600 text-white',
    iconIdle: 'bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-300',
  },
  {
    to: corePaths.documents,
    label: 'Dokumen',
    end: false,
    Icon: FileText,
    activeClass:
      'bg-sky-100 text-sky-800 ring-sky-200 dark:bg-sky-950/60 dark:text-sky-200 dark:ring-sky-800',
    iconActive: 'bg-sky-600 text-white',
    iconIdle: 'bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-300',
  },
  {
    to: corePaths.health,
    label: 'Health',
    end: false,
    Icon: Heart,
    activeClass:
      'bg-rose-50 text-rose-800 ring-rose-200 dark:bg-rose-950/50 dark:text-rose-200 dark:ring-rose-900',
    iconActive: 'bg-rose-500 text-white',
    iconIdle: 'bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-300',
  },
  {
    to: corePaths.calendar,
    label: 'Kalender',
    end: false,
    Icon: Calendar,
    activeClass:
      'bg-teal-50 text-teal-800 ring-teal-200 dark:bg-teal-950/50 dark:text-teal-200 dark:ring-teal-900',
    iconActive: 'bg-teal-600 text-white',
    iconIdle: 'bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-300',
  },
] as const;

const QUICK_ACTIONS = [
  {
    key: 'document',
    title: 'Tambah dokumen',
    subtitle: 'KTP, paspor, SIM, dan arsip penting',
    tone: 'sky' as const,
    Icon: FileText,
  },
  {
    key: 'calendar',
    title: 'Jadwal baru',
    subtitle: 'Sekolah, dokter, tagihan, acara keluarga',
    tone: 'teal' as const,
    Icon: Calendar,
  },
  {
    key: 'health',
    title: 'Buka Health Tracker',
    subtitle: 'Alergi, obat, dan catatan medis anggota',
    tone: 'rose' as const,
    Icon: Heart,
  },
] as const;

function FamilyCoreChrome() {
  const navigate = useNavigate();
  const { logout, person } = useAuth();
  const { source, setSource, canUseMock, isMock } = useDataSource();
  const { openDocumentModal, openCalendarModal } = useFamilyCoreUi();
  const { documents, members, loading, error } = useFamilyCoreDocuments();
  const { events } = useFamilyCoreCalendar();
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const loginName = person
    ? shortPersonName(person, person.fullName)
    : null;

  const urgentDocs = documents.filter((d) => {
    const s = getDocumentStatus(d);
    return s === 'expired' || s === 'expiring';
  }).length;

  const today = toDateKey(new Date());
  const upcomingEvents = events.filter(
    (e) => e.date >= today || (e.endDate && e.endDate >= today),
  ).length;

  const previewMembers = members.slice(0, 5);
  const extraMembers = Math.max(0, members.length - previewMembers.length);

  const handleQuickAction = (key: (typeof QUICK_ACTIONS)[number]['key']) => {
    setQuickAddOpen(false);
    if (key === 'document') openDocumentModal();
    else if (key === 'calendar') openCalendarModal();
    else if (key === 'health') navigate(corePaths.health);
  };

  return (
    <div data-module="core" className="flex min-h-screen flex-col bg-suite-bg text-suite-ink">
      <header className="sticky top-0 z-40 border-b border-suite-border bg-suite-surface/90 shadow-[0_1px_0_rgba(14,116,144,0.06)] backdrop-blur-md dark:shadow-[0_1px_0_rgba(0,0,0,0.35)]">
        {/* Brand row — extra vertical room so icons/shadows aren’t clipped by backdrop-blur */}
        <div className="mx-auto flex w-full max-w-[1280px] items-center gap-2.5 px-3 py-3 sm:gap-3 sm:px-6 sm:py-3.5 lg:px-7">
          <Link
            to={appPaths.launcher}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-suite-muted transition-colors hover:bg-suite-soft hover:text-sky-600 dark:hover:text-sky-300"
            title="Semua modul"
            aria-label="Semua modul"
          >
            <Grid size={16} />
          </Link>

          <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-gradient-to-br from-sky-500 to-sky-700 text-white sm:h-10 sm:w-10 sm:rounded-[12px]">
              <Home size={17} />
              <span className="absolute bottom-0.5 right-0.5 h-2 w-2 rounded-full border-[1.5px] border-white bg-emerald-400 dark:border-suite-surface" />
            </span>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-[15px] font-bold tracking-tight text-suite-ink">
                Family Core
              </div>
              <div className="truncate text-[11.5px] text-suite-faint">
                {members.length} anggota ·{' '}
                {isMock ? 'sumber mock' : 'sumber API'}
              </div>
            </div>
          </div>

          {/* Avatar stack */}
          <div className="hidden items-center py-0.5 sm:flex" aria-label="Anggota keluarga">
            <div className="flex -space-x-2">
              {previewMembers.map((m) => (
                <span
                  key={m.id}
                  title={m.name}
                  className={[
                    'flex h-8 w-8 items-center justify-center rounded-full border-2 border-suite-surface text-[10px] font-bold text-white shadow-sm',
                    m.avatarTone,
                  ].join(' ')}
                >
                  {m.initials}
                </span>
              ))}
              {extraMembers > 0 ? (
                <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-suite-surface bg-suite-soft text-[10px] font-bold text-suite-muted shadow-sm">
                  +{extraMembers}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
            <button
              type="button"
              onClick={() => setQuickAddOpen(true)}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-sky-600 px-3 text-[12.5px] font-bold leading-none text-white hover:bg-sky-700 sm:px-3.5"
              aria-label="Aksi cepat"
            >
              <Plus size={15} className="shrink-0" />
              <span className="hidden sm:inline">Aksi</span>
            </button>

            <ThemeToggle />

            {loginName ? (
              <span className="hidden max-w-[7rem] truncate rounded-full bg-suite-soft px-2.5 py-1.5 text-[11.5px] font-semibold leading-none text-suite-muted lg:inline">
                {loginName}
              </span>
            ) : null}

            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-2.5 text-[12.5px] font-medium leading-none text-suite-muted transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
            >
              <LogOut size={15} className="shrink-0" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>

        {/* Primary nav — full width, tabs spread evenly */}
        <nav className="mx-auto flex w-full max-w-[1280px] gap-1.5 px-3 py-1.5 pb-3 sm:px-6 lg:px-7">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  'group inline-flex min-w-0 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-control px-2.5 py-2.5 text-[13px] font-semibold leading-none transition-all sm:justify-start sm:px-3',
                  isActive
                    ? `${item.activeClass} ring-1 ring-inset shadow-sm`
                    : 'text-suite-muted hover:bg-suite-soft hover:text-suite-ink',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={[
                      'flex h-7 w-7 items-center justify-center rounded-[9px] transition-colors',
                      isActive ? item.iconActive : item.iconIdle,
                    ].join(' ')}
                  >
                    <item.Icon size={14} />
                  </span>
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Context strip */}
        <div className="border-t border-suite-border bg-suite-soft/80 dark:bg-suite-soft/40">
          <div className="mx-auto flex w-full max-w-[1280px] flex-wrap items-center gap-2 px-3 py-2 text-[12.5px] sm:px-6 lg:px-7">
            <span className="font-semibold text-suite-muted">Ringkasan</span>
            <span className="rounded-full border border-suite-border bg-suite-surface px-2.5 py-0.5 text-[11.5px] font-bold text-sky-700 dark:text-sky-300">
              {loading ? '…' : `${documents.length} dokumen`}
            </span>
            {urgentDocs > 0 ? (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11.5px] font-bold text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
                {urgentDocs} perlu perhatian
              </span>
            ) : (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11.5px] font-bold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                Dokumen aman
              </span>
            )}
            <span className="rounded-full border border-suite-border bg-suite-surface px-2.5 py-0.5 text-[11.5px] font-bold text-teal-700 dark:text-teal-300">
              {upcomingEvents} jadwal ke depan
            </span>

            {error &&
            !/password kedua|unlock|verifikasi/i.test(error) ? (
              <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[11.5px] font-bold text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                {error}
              </span>
            ) : null}

            {canUseMock ? (
              <div className="inline-flex items-center gap-1 rounded-xl border border-dashed border-suite-border bg-suite-surface p-1">
                <button
                  type="button"
                  onClick={() => setSource('api')}
                  className={[
                    'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition-colors',
                    source === 'api'
                      ? 'bg-emerald-500 text-white'
                      : 'text-suite-muted hover:bg-suite-soft',
                  ].join(' ')}
                  title="Data dari backend API"
                >
                  <Server size={12} />
                  API
                </button>
                <button
                  type="button"
                  onClick={() => setSource('mock')}
                  className={[
                    'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition-colors',
                    source === 'mock'
                      ? 'bg-violet-500 text-white'
                      : 'text-suite-muted hover:bg-suite-soft',
                  ].join(' ')}
                  title="Data mock lokal"
                >
                  <HardDrive size={12} />
                  Mock
                </button>
              </div>
            ) : null}

            {/* Mobile avatar peek */}
            <div className="ml-auto flex -space-x-1.5 sm:hidden">
              {members.slice(0, 4).map((m) => (
                <span
                  key={m.id}
                  className={[
                    'flex h-6 w-6 items-center justify-center rounded-full border-2 border-suite-surface text-[9px] font-bold text-white',
                    m.avatarTone,
                  ].join(' ')}
                >
                  {m.initials}
                </span>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1280px] flex-1 px-3 py-5 sm:px-6 sm:py-7 lg:px-7">
        <Outlet />
      </main>

      <Footer moduleName="Family Core" />

      {quickAddOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <button
            type="button"
            className="absolute inset-0 bg-[rgba(15,23,42,0.4)]"
            aria-label="Tutup"
            onClick={() => setQuickAddOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-t-sheet bg-suite-surface p-5 shadow-xl sm:rounded-card sm:p-6">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[15px] font-extrabold text-suite-ink">
                  Mau catat apa?
                </h2>
                <p className="text-[12px] text-suite-faint">
                  Aksi cepat Family Core
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQuickAddOpen(false)}
                className="rounded-full p-1.5 text-suite-faint hover:bg-suite-soft"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-1">
              {QUICK_ACTIONS.map((action, index) => (
                <button
                  key={action.key}
                  type="button"
                  onClick={() => handleQuickAction(action.key)}
                  className={[
                    'flex w-full items-center gap-3 rounded-control px-2.5 py-2.5 text-left transition-colors hover:bg-suite-soft',
                    index === 0 ? 'bg-sky-50/80 dark:bg-sky-950/40' : '',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'flex h-10 w-10 items-center justify-center rounded-[11px]',
                      action.tone === 'sky' && 'bg-sky-600 text-white',
                      action.tone === 'teal' &&
                        'bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300',
                      action.tone === 'rose' &&
                        'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <action.Icon size={17} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13.5px] font-bold text-suite-ink">
                      {action.title}
                    </span>
                    <span className="block text-[11.5px] text-suite-faint">
                      {action.subtitle}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <CoreModalsHost />
    </div>
  );
}

export function FamilyCoreLayout() {
  return (
    <FamilyCoreDocumentTypesProvider>
      <FamilyCoreDocumentsProvider>
        <FamilyCoreHealthProvider>
          <FamilyCoreCalendarEventTypesProvider>
            <FamilyCoreCalendarProvider>
              <FamilyCoreUiProvider>
                <FamilyCoreChrome />
              </FamilyCoreUiProvider>
            </FamilyCoreCalendarProvider>
          </FamilyCoreCalendarEventTypesProvider>
        </FamilyCoreHealthProvider>
      </FamilyCoreDocumentsProvider>
    </FamilyCoreDocumentTypesProvider>
  );
}
