import { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  FileText,
  Grid,
  Heart,
  Home,
  LogOut,
  Plus,
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
import { CORE_MEMBERS } from '@/modules/family-core/mocks/coreMembers';
import { useAuth } from '@/shared/context/AuthContext';
import { appPaths, corePaths } from '@/shared/routes';
import { shortPersonName } from '@/shared/utils/personDisplayName';

const NAV_ITEMS = [
  {
    to: corePaths.home,
    label: 'Beranda',
    end: true,
    Icon: Home,
    activeClass: 'bg-sky-100 text-sky-800 ring-sky-200',
    iconActive: 'bg-sky-600 text-white',
    iconIdle: 'bg-sky-50 text-sky-600',
  },
  {
    to: corePaths.documents,
    label: 'Dokumen',
    end: false,
    Icon: FileText,
    activeClass: 'bg-sky-100 text-sky-800 ring-sky-200',
    iconActive: 'bg-sky-600 text-white',
    iconIdle: 'bg-sky-50 text-sky-600',
  },
  {
    to: corePaths.health,
    label: 'Health',
    end: false,
    Icon: Heart,
    activeClass: 'bg-rose-50 text-rose-800 ring-rose-200',
    iconActive: 'bg-rose-500 text-white',
    iconIdle: 'bg-rose-50 text-rose-500',
  },
  {
    to: corePaths.calendar,
    label: 'Kalender',
    end: false,
    Icon: Calendar,
    activeClass: 'bg-teal-50 text-teal-800 ring-teal-200',
    iconActive: 'bg-teal-600 text-white',
    iconIdle: 'bg-teal-50 text-teal-600',
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
  const { openDocumentModal, openCalendarModal } = useFamilyCoreUi();
  const { documents } = useFamilyCoreDocuments();
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

  const previewMembers = CORE_MEMBERS.slice(0, 5);
  const extraMembers = Math.max(0, CORE_MEMBERS.length - previewMembers.length);

  const handleQuickAction = (key: (typeof QUICK_ACTIONS)[number]['key']) => {
    setQuickAddOpen(false);
    if (key === 'document') openDocumentModal();
    else if (key === 'calendar') openCalendarModal();
    else if (key === 'health') navigate(corePaths.health);
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f0f7fc_0%,#f3f4f6_28%,#f3f4f6_100%)] text-brand-800">
      <header className="sticky top-0 z-40 border-b border-sky-100/80 bg-white/85 shadow-[0_1px_0_rgba(14,116,144,0.06)] backdrop-blur-md">
        {/* Brand row */}
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-3 py-2.5 sm:px-6 sm:py-3">
          <Link
            to={appPaths.launcher}
            className="inline-flex shrink-0 items-center justify-center rounded-xl p-2 text-brand-500 transition-colors hover:bg-sky-50 hover:text-sky-700"
            title="Semua modul"
            aria-label="Semua modul"
          >
            <Grid size={16} />
          </Link>

          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-gradient-to-br from-sky-500 to-sky-700 text-white shadow-[0_8px_18px_-8px_rgba(2,132,199,0.75)]">
              <Home size={18} />
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400" />
            </span>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-[15px] font-bold tracking-tight text-brand-800">
                Family Core
              </div>
              <div className="truncate text-[11.5px] text-brand-400">
                {CORE_MEMBERS.length} anggota · keluarga inti
              </div>
            </div>
          </div>

          {/* Avatar stack */}
          <div className="hidden items-center sm:flex" aria-label="Anggota keluarga">
            <div className="flex -space-x-2">
              {previewMembers.map((m) => (
                <span
                  key={m.id}
                  title={m.name}
                  className={[
                    'flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white shadow-sm',
                    m.avatarTone,
                  ].join(' ')}
                >
                  {m.initials}
                </span>
              ))}
              {extraMembers > 0 ? (
                <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-[10px] font-bold text-slate-600 shadow-sm">
                  +{extraMembers}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setQuickAddOpen(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-sky-600 px-3 text-[12.5px] font-bold text-white shadow-[0_8px_16px_-8px_rgba(2,132,199,0.7)] hover:bg-sky-700 sm:px-3.5"
              aria-label="Aksi cepat"
            >
              <Plus size={15} />
              <span className="hidden sm:inline">Aksi</span>
            </button>

            {loginName ? (
              <span className="hidden max-w-[7rem] truncate rounded-full bg-gray-50 px-2.5 py-1.5 text-[11.5px] font-semibold text-brand-600 lg:inline">
                {loginName}
              </span>
            ) : null}

            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-[12.5px] font-medium text-gray-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>

        {/* Primary nav */}
        <nav className="mx-auto flex max-w-3xl gap-1.5 overflow-x-auto px-3 pb-2.5 sm:px-6">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  'group inline-flex items-center gap-2 whitespace-nowrap rounded-[11px] px-2.5 py-2 text-[13px] font-semibold transition-all',
                  isActive
                    ? `${item.activeClass} ring-1 shadow-sm`
                    : 'text-brand-500 hover:bg-white/80 hover:text-brand-700',
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
        <div className="border-t border-sky-100/70 bg-gradient-to-r from-sky-50/90 via-white to-teal-50/60">
          <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2 px-3 py-2 text-[12.5px] sm:px-6">
            <span className="font-semibold text-sky-900/80">Ringkasan</span>
            <span className="rounded-full border border-sky-200/80 bg-white px-2.5 py-0.5 text-[11.5px] font-bold text-sky-800">
              {documents.length} dokumen
            </span>
            {urgentDocs > 0 ? (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11.5px] font-bold text-amber-800">
                {urgentDocs} perlu perhatian
              </span>
            ) : (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11.5px] font-bold text-emerald-700">
                Dokumen aman
              </span>
            )}
            <span className="rounded-full border border-teal-200/80 bg-white px-2.5 py-0.5 text-[11.5px] font-bold text-teal-800">
              {upcomingEvents} jadwal ke depan
            </span>

            {/* Mobile avatar peek */}
            <div className="ml-auto flex -space-x-1.5 sm:hidden">
              {CORE_MEMBERS.slice(0, 4).map((m) => (
                <span
                  key={m.id}
                  className={[
                    'flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-[9px] font-bold text-white',
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

      <main className="mx-auto max-w-3xl px-3 py-5 sm:px-6 sm:py-7">
        <Outlet />
      </main>

      {quickAddOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <button
            type="button"
            className="absolute inset-0 bg-[rgba(15,23,42,0.4)]"
            aria-label="Tutup"
            onClick={() => setQuickAddOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-t-[20px] bg-white p-5 shadow-xl sm:rounded-2xl sm:p-6">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[15px] font-extrabold text-brand-800">
                  Mau catat apa?
                </h2>
                <p className="text-[12px] text-brand-400">
                  Aksi cepat Family Core
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQuickAddOpen(false)}
                className="rounded-full p-1.5 text-brand-400 hover:bg-gray-100"
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
                    'flex w-full items-center gap-3 rounded-[12px] px-2.5 py-2.5 text-left transition-colors hover:bg-gray-50',
                    index === 0 ? 'bg-sky-50/80' : '',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'flex h-10 w-10 items-center justify-center rounded-[11px]',
                      action.tone === 'sky' && 'bg-sky-600 text-white',
                      action.tone === 'teal' && 'bg-teal-100 text-teal-700',
                      action.tone === 'rose' && 'bg-rose-100 text-rose-600',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <action.Icon size={17} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13.5px] font-bold text-brand-800">
                      {action.title}
                    </span>
                    <span className="block text-[11.5px] text-brand-400">
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
