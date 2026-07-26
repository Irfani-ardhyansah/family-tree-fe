import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  MapPin,
  Users,
  Filter,
  X,
  Calendar,
  Lock,
  List,
} from 'react-feather';
import type { FamilyEvent, EventType } from '@/shared/types/event';
import { EVENT_TYPE_CONFIG } from '@/shared/types/event';
import { useFamily } from '@/modules/family-roots/context/FamilyDataContext';
import { useFamilyPerspective } from '@/modules/family-roots/context/FamilyPerspectiveContext';
import { useFocusPersonId } from '@/shared/hooks/useFocusPersonId';
import { useEventsPage } from '@/shared/hooks/useEventsPage';
import { isRestrictedEvent } from '@/shared/utils/eventAccess';
import { monthDateRange } from '@/shared/utils/eventCalendar';
import { EventFormModal } from './components/EventFormModal';
import { EventsCalendarView } from './components/EventsCalendarView';
import { DeleteConfirmDialog } from '../family-data/components/DeleteConfirmDialog';

type LayoutMode = 'cards' | 'calendar';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function isUpcoming(dateStr: string): boolean {
  return new Date(dateStr) >= new Date(new Date().toDateString());
}

function getYears(events: FamilyEvent[]): number[] {
  const years = events.map((e) => new Date(e.date).getFullYear());
  return [...new Set(years)].sort((a, b) => b - a);
}

// ─── Event card ───────────────────────────────────────────────────────────────
function EventCard({
  event,
  personNames,
  onEdit,
  onDelete,
  accentBarClass,
  canManage,
}: {
  event: FamilyEvent;
  personNames: string[];
  onEdit: () => void;
  onDelete: () => void;
  accentBarClass: string;
  canManage: boolean;
}) {
  const cfg = EVENT_TYPE_CONFIG[event.type];
  const upcoming = isUpcoming(event.date);

  const totalPhotos =
    (event.photoUrls ?? []).length + (event.contributions ?? []).length;

  return (
    <Link
      to={`/roots/events/${event.id}`}
      className="block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group"
    >
      {/* Top: photo strip or color accent */}
          {(event.photoUrls ?? []).length > 0 ? (
        <div className="relative h-36 overflow-hidden">
          <img
            src={event.photoUrls[0]}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          {totalPhotos > 1 && (
            <span className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
              {totalPhotos} foto
            </span>
          )}
        </div>
      ) : (event.contributions ?? []).length > 0 ? (
        <div className="relative h-36 overflow-hidden">
          <img
            src={event.contributions[0].photoUrl}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          {totalPhotos > 1 && (
            <span className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
              {totalPhotos} foto
            </span>
          )}
        </div>
      ) : (
        <div className={`h-1.5 w-full ${accentBarClass}`} />
      )}

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}
            >
              <span>{cfg.emoji}</span>
              {cfg.label}
            </span>
            {upcoming && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                Mendatang
              </span>
            )}
            {isRestrictedEvent(event) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                <Lock size={11} /> Terbatas
              </span>
            )}
          </div>
          {canManage && (
            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(); }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                aria-label={`Edit ${event.title}`}
              >
                <Edit2 size={15} />
              </button>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                aria-label={`Hapus ${event.title}`}
              >
                <Trash2 size={15} />
              </button>
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-brand-700 leading-snug mb-2 group-hover:text-primary-600 transition-colors">
          {event.title}
        </h3>

        {/* Meta */}
        <div className="space-y-1.5 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Calendar size={13} className="flex-shrink-0 text-gray-400" />
            <span>
              {formatDate(event.date)}
              {event.endDate && event.endDate !== event.date && (
                <> — {formatDate(event.endDate)}</>
              )}
            </span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin size={13} className="flex-shrink-0 text-gray-400" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
          {personNames.length > 0 && (
            <div className="flex items-center gap-2">
              <Users size={13} className="flex-shrink-0 text-gray-400" />
              <span className="truncate">
                {personNames.length <= 2
                  ? personNames.join(', ')
                  : `${personNames.slice(0, 2).join(', ')} +${personNames.length - 2} lainnya`}
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        {event.description && (
          <p className="mt-3 text-xs text-gray-400 leading-relaxed line-clamp-2">
            {event.description}
          </p>
        )}

        {canManage && (
          <div className="flex gap-2 mt-4 pt-3 border-t border-gray-50 sm:hidden">
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(); }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 transition-colors"
            >
              <Edit2 size={13} /> Edit
            </button>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
            >
              <Trash2 size={13} /> Hapus
            </button>
          </div>
        )}
      </div>
    </Link>
  );
}

// ─── Filter pill group ─────────────────────────────────────────────────────────
function PillGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
            value === opt.value
              ? 'border-primary-500 bg-primary-500 text-white'
              : 'border-gray-200 bg-white text-gray-600 hover:border-primary-300'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── Date helpers ─────────────────────────────────────────────────────────────
const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

// ─── Main page ────────────────────────────────────────────────────────────────
type FilterState = {
  type: EventType | 'all';
  year: string;      // '' | '2023'
  month: string;     // '' | '1'–'12'  (hanya aktif jika year diisi)
  dateFrom: string;  // '' | YYYY-MM-DD (hanya aktif jika month diisi)
  dateTo: string;    // '' | YYYY-MM-DD (hanya aktif jika month diisi)
};

const DEFAULT_FILTERS: FilterState = {
  type: 'all',
  year: '',
  month: '',
  dateFrom: '',
  dateTo: '',
};

const TYPE_OPTIONS = [
  { value: 'all' as const, label: 'Semua Jenis' },
  ...Object.entries(EVENT_TYPE_CONFIG).map(([k, v]) => ({
    value: k as EventType,
    label: `${v.emoji} ${v.label}`,
  })),
];

export function EventsPage() {
  const { persons: mockPersons } = useFamily();
  const {
    focusShortLabel,
    theme,
    perspective,
  } = useFamilyPerspective();
  const focusPersonId = useFocusPersonId();

  const [layout, setLayout] = useState<LayoutMode>('cards');
  const [calCursor, setCalCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<FamilyEvent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FamilyEvent | null>(null);

  const calendarRange = useMemo(
    () => monthDateRange(calCursor.year, calCursor.month),
    [calCursor],
  );

  const apiQuery = useMemo(() => {
    if (layout === 'calendar') {
      return {
        view: 'calendar' as const,
        dateFrom: calendarRange.dateFrom,
        dateTo: calendarRange.dateTo,
        type: filters.type !== 'all' ? filters.type : undefined,
        q: search.trim() || undefined,
      };
    }
    return {
      type: filters.type !== 'all' ? filters.type : undefined,
      year: filters.year || undefined,
      month: filters.month || undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
      q: search.trim() || undefined,
    };
  }, [layout, calendarRange, filters, search]);

  const {
    source,
    events,
    allPersons: apiPersons,
    isLoading,
    error,
    saveEvent,
    removeEvent,
  } = useEventsPage(focusPersonId, apiQuery);

  const persons = source === 'api' ? apiPersons : mockPersons;

  const personMap = useMemo(
    () => new Map(persons.map((p) => [p.id, p.fullName])),
    [persons],
  );

  const yearOptions = useMemo(() => getYears(events), [events]);

  // Months available in the selected year (dynamic)
  const monthOptions = useMemo(() => {
    if (!filters.year) return [];
    const months = events
      .filter((e) => new Date(e.date).getFullYear().toString() === filters.year)
      .map((e) => new Date(e.date).getMonth() + 1);
    return [...new Set(months)].sort((a, b) => a - b);
  }, [events, filters.year]);

  // Min/max dates for the date-range pickers (constrained to selected month)
  const datePickerBounds = useMemo(() => {
    if (!filters.year || !filters.month) return { min: '', max: '' };
    const y = parseInt(filters.year);
    const m = parseInt(filters.month);
    const min = `${y}-${String(m).padStart(2, '0')}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const max = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return { min, max };
  }, [filters.year, filters.month]);

  const filtersActive =
    layout === 'calendar'
      ? filters.type !== 'all'
      : filters.type !== 'all' || filters.year !== '';

  const activeFilterCount = [
    filters.type !== 'all',
    layout === 'cards' && filters.year !== '',
  ].filter(Boolean).length;

  const filtered = useMemo(() => {
    // API + mode kalender (mock) sudah difilter di hook / BE
    if (source === 'api' || layout === 'calendar') return events;

    const q = search.toLowerCase().trim();
    return events
      .filter((e) => {
        if (
          q &&
          !e.title.toLowerCase().includes(q) &&
          !(e.location ?? '').toLowerCase().includes(q) &&
          !(e.description ?? '').toLowerCase().includes(q)
        )
          return false;
        if (filters.type !== 'all' && e.type !== filters.type) return false;

        const d = new Date(e.date);
        if (filters.year && d.getFullYear().toString() !== filters.year)
          return false;
        if (filters.year && filters.month) {
          if ((d.getMonth() + 1).toString() !== filters.month) return false;
        }
        if (filters.year && filters.month && filters.dateFrom) {
          if (d < new Date(filters.dateFrom)) return false;
        }
        if (filters.year && filters.month && filters.dateTo) {
          const to = new Date(filters.dateTo);
          to.setHours(23, 59, 59, 999);
          if (d > to) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const aUp = isUpcoming(a.date);
        const bUp = isUpcoming(b.date);
        if (aUp !== bUp) return aUp ? -1 : 1;
        return aUp
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime();
      });
  }, [source, layout, events, search, filters]);

  // Cascading setters — child resets when parent changes
  const setFilterType = (type: FilterState['type']) =>
    setFilters((p) => ({ ...p, type }));
  const setFilterYear = (year: string) =>
    setFilters((p) => ({ ...p, year, month: '', dateFrom: '', dateTo: '' }));
  const setFilterMonth = (month: string) =>
    setFilters((p) => ({ ...p, month, dateFrom: '', dateTo: '' }));
  const setFilterDateFrom = (dateFrom: string) =>
    setFilters((p) => ({ ...p, dateFrom }));
  const setFilterDateTo = (dateTo: string) =>
    setFilters((p) => ({ ...p, dateTo }));

  const resetFilters = () => setFilters(DEFAULT_FILTERS);

  // Label for the date chip in active-filters summary
  const dateBreadcrumb = (() => {
    if (!filters.year) return '';
    const y = filters.year;
    const m = filters.month ? MONTH_NAMES[parseInt(filters.month) - 1] : '';
    if (!m) return `Tahun ${y}`;
    if (!filters.dateFrom && !filters.dateTo) return `${m} ${y}`;
    const fmt = (iso: string) => new Date(iso).getDate();
    if (filters.dateFrom && filters.dateTo)
      return `${fmt(filters.dateFrom)}–${fmt(filters.dateTo)} ${m} ${y}`;
    if (filters.dateFrom) return `≥ ${fmt(filters.dateFrom)} ${m} ${y}`;
    return `≤ ${fmt(filters.dateTo)} ${m} ${y}`;
  })();

  const handleSearchChange = (v: string) => setSearch(v);

  const openAdd = () => { setEventToEdit(null); setIsFormOpen(true); };
  const openEdit = (e: FamilyEvent) => { setEventToEdit(e); setIsFormOpen(true); };

  const handleSave = async (
    data: Omit<FamilyEvent, 'id'>,
    mediaIds?: string[],
  ) => {
    await saveEvent(data, eventToEdit?.id, mediaIds);
  };

  const upcomingCount = events.filter((e) => isUpcoming(e.date)).length;

  return (
    <>
      {/* ── Page header ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-brand-700">Acara Keluarga</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {filtered.length} acara
            {layout === 'calendar' ? ' di bulan ini' : ''} · Fokus{' '}
            <span className={`font-medium ${theme.accentText}`}>
              {focusShortLabel}
            </span>
            {layout === 'cards' && upcomingCount > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700 font-medium">
                {upcomingCount} mendatang
              </span>
            )}
            {source === 'api' && (
              <span className="ml-2 text-primary-500">· API</span>
            )}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm w-full sm:w-auto"
        >
          <Plus size={18} />
          Tambah Acara
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="mb-4 text-sm text-gray-500">Memuat acara keluarga…</div>
      )}

      {/* ── Layout toggle ────────────────────────────────── */}
      <div className="flex gap-1 p-1 rounded-xl bg-gray-100 border border-gray-200 mb-3">
        <button
          type="button"
          onClick={() => setLayout('cards')}
          className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all min-h-[44px] ${
            layout === 'cards'
              ? 'bg-white text-brand-700 shadow-sm'
              : 'text-gray-500'
          }`}
        >
          <List size={16} />
          Kartu
        </button>
        <button
          type="button"
          onClick={() => setLayout('calendar')}
          className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all min-h-[44px] ${
            layout === 'calendar'
              ? 'bg-white text-brand-700 shadow-sm'
              : 'text-gray-500'
          }`}
        >
          <Calendar size={16} />
          Kalender
        </button>
      </div>

      {/* ── Search + Filter bar ──────────────────────────── */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Cari nama acara, lokasi..."
            className="block w-full pl-10 pr-4 py-2.5 rounded-xl border-gray-300 shadow-sm text-sm focus:ring-primary-500 focus:border-primary-500"
          />
          {search && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
            showFilters || filtersActive
              ? 'border-primary-400 bg-primary-50 text-primary-700'
              : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Filter size={15} />
          <span className="hidden sm:inline">Filter</span>
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Filter panel ─────────────────────────────────── */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4 space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-brand-700">Filter</p>
            {filtersActive && (
              <button
                onClick={resetFilters}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
              >
                <X size={12} /> Reset semua
              </button>
            )}
          </div>

          {/* Jenis Acara */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
              Jenis Acara
            </p>
            <PillGroup
              options={TYPE_OPTIONS}
              value={filters.type}
              onChange={setFilterType}
            />
          </div>

          {/* ── Cascading date filters (layout kartu saja) ── */}
          {layout === 'cards' && (
          <div className="space-y-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Waktu
            </p>

            {/* Level 1: Tahun */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-16 flex-shrink-0">Tahun</span>
              <select
                value={filters.year}
                onChange={(e) => setFilterYear(e.target.value)}
                className="flex-1 rounded-lg border-gray-300 text-sm focus:ring-primary-500 focus:border-primary-500 py-1.5"
              >
                <option value="">Semua tahun</option>
                {yearOptions.map((y) => (
                  <option key={y} value={y.toString()}>{y}</option>
                ))}
              </select>
              {filters.year && (
                <button
                  onClick={() => setFilterYear('')}
                  className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Level 2: Bulan (muncul setelah tahun dipilih) */}
            {filters.year && (
              <div className="ml-4 pl-3 border-l-2 border-primary-100 space-y-1">
                <p className="text-xs text-gray-400 mb-2">
                  Pilih bulan di tahun {filters.year}:
                </p>
                {monthOptions.length === 0 ? (
                  <p className="text-xs text-gray-300 italic">
                    Tidak ada acara di tahun ini
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {monthOptions.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() =>
                          setFilterMonth(
                            filters.month === m.toString() ? '' : m.toString(),
                          )
                        }
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          filters.month === m.toString()
                            ? 'border-primary-500 bg-primary-500 text-white'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-primary-300'
                        }`}
                      >
                        {MONTH_NAMES[m - 1]}
                      </button>
                    ))}
                  </div>
                )}

                {/* Level 3: Rentang tanggal (muncul setelah bulan dipilih) */}
                {filters.month && (
                  <div className="ml-4 pl-3 border-l-2 border-primary-100 pt-2 space-y-2">
                    <p className="text-xs text-gray-400">
                      Pilih rentang tanggal di{' '}
                      {MONTH_NAMES[parseInt(filters.month) - 1]} {filters.year}:
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-end gap-2">
                      <div className="flex-1 min-w-0">
                        <label className="block text-xs text-gray-500 mb-1">
                          Dari
                        </label>
                        <input
                          type="date"
                          value={filters.dateFrom}
                          min={datePickerBounds.min}
                          max={filters.dateTo || datePickerBounds.max}
                          onChange={(e) => setFilterDateFrom(e.target.value)}
                          className="block w-full rounded-lg border-gray-300 text-sm sm:text-xs focus:ring-primary-500 focus:border-primary-500 py-2.5 sm:py-1.5"
                        />
                      </div>
                      <span className="hidden sm:inline text-gray-400 text-sm mb-2">—</span>
                      <div className="flex-1 min-w-0">
                        <label className="block text-xs text-gray-500 mb-1">
                          Sampai
                        </label>
                        <input
                          type="date"
                          value={filters.dateTo}
                          min={filters.dateFrom || datePickerBounds.min}
                          max={datePickerBounds.max}
                          onChange={(e) => setFilterDateTo(e.target.value)}
                          className="block w-full rounded-lg border-gray-300 text-sm sm:text-xs focus:ring-primary-500 focus:border-primary-500 py-2.5 sm:py-1.5"
                        />
                      </div>
                      {(filters.dateFrom || filters.dateTo) && (
                        <button
                          onClick={() => {
                            setFilterDateFrom('');
                            setFilterDateTo('');
                          }}
                          className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 self-start sm:self-auto sm:mb-0.5"
                          aria-label="Hapus rentang tanggal"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          )}

          {layout === 'calendar' && (
            <p className="text-xs text-gray-400 leading-relaxed">
              Di mode kalender, navigasi bulan memakai tombol panah. Filter waktu
              kartu tidak dipakai.
            </p>
          )}

          {/* Active filter chips summary */}
          {filtersActive && (
            <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-100">
              {filters.type !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-medium">
                  {EVENT_TYPE_CONFIG[filters.type].emoji}{' '}
                  {EVENT_TYPE_CONFIG[filters.type].label}
                  <button onClick={() => setFilterType('all')}>
                    <X size={11} />
                  </button>
                </span>
              )}
              {layout === 'cards' && dateBreadcrumb && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-medium">
                  📅 {dateBreadcrumb}
                  <button onClick={() => setFilterYear('')}>
                    <X size={11} />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Calendar layout ──────────────────────────────── */}
      {layout === 'calendar' && (
        <EventsCalendarView
          year={calCursor.year}
          month={calCursor.month}
          events={filtered}
          onMonthChange={setCalCursor}
          canManageEvent={(event) =>
            source === 'mock' ? true : Boolean(event.canManage)
          }
          onEdit={openEdit}
        />
      )}

      {/* ── Empty state (kartu) ───────────────────────────── */}
      {layout === 'cards' && filtered.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-16 flex flex-col items-center text-center">
          <Calendar className="text-gray-300 mb-3" size={40} />
          <p className="text-gray-500 font-medium">Tidak ada acara ditemukan</p>
          {(search || filtersActive) && (
            <p className="text-gray-400 text-sm mt-1">
              Coba kata kunci lain atau{' '}
              <button
                onClick={() => { handleSearchChange(''); resetFilters(); }}
                className="text-primary-500 hover:underline"
              >
                hapus semua filter
              </button>
            </p>
          )}
          {!search && !filtersActive && (
            <button
              onClick={openAdd}
              className="mt-4 inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
            >
              <Plus size={16} /> Tambah Acara Pertama
            </button>
          )}
        </div>
      )}

      {/* ── Event cards grid ─────────────────────────────── */}
      {layout === 'cards' && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              personNames={event.personIds
                .map((id) => personMap.get(id))
                .filter((n): n is string => !!n)}
              onEdit={() => openEdit(event)}
              onDelete={() => setDeleteTarget(event)}
              accentBarClass={perspective === 'self' ? 'bg-primary-400' : 'bg-secondary-500'}
              canManage={source === 'mock' ? true : Boolean(event.canManage)}
            />
          ))}
        </div>
      )}

      {/* ── Modals ───────────────────────────────────────── */}
      <EventFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        eventToEdit={eventToEdit}
        onSave={handleSave}
        persons={persons}
      />

      <DeleteConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) await removeEvent(deleteTarget.id);
        }}
        personName={deleteTarget?.title ?? ''}
      />
    </>
  );
}
