import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Lock, MapPin } from 'react-feather';
import type { FamilyEvent } from '@/types/event';
import { EVENT_TYPE_CONFIG } from '@/types/event';
import { isRestrictedEvent } from '@/utils/eventAccess';
import {
  buildMonthGrid,
  groupEventsByDate,
  monthDateRange,
  shiftMonth,
  toDateKey,
} from '@/utils/eventCalendar';

const WEEKDAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

function buildYearOptions(centerYear: number): number[] {
  const now = new Date().getFullYear();
  const start = Math.min(centerYear, now) - 25;
  const end = Math.max(centerYear, now) + 5;
  const years: number[] = [];
  for (let y = end; y >= start; y--) years.push(y);
  return years;
}

type EventsCalendarViewProps = {
  year: number;
  month: number;
  events: FamilyEvent[];
  onMonthChange: (next: { year: number; month: number }) => void;
  canManageEvent: (event: FamilyEvent) => boolean;
  onEdit?: (event: FamilyEvent) => void;
};

export function EventsCalendarView({
  year,
  month,
  events,
  onMonthChange,
  canManageEvent,
  onEdit,
}: EventsCalendarViewProps) {
  const { dateFrom, dateTo } = useMemo(
    () => monthDateRange(year, month),
    [year, month],
  );

  const cells = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const byDate = useMemo(
    () => groupEventsByDate(events, dateFrom, dateTo),
    [events, dateFrom, dateTo],
  );

  const todayKey = toDateKey(new Date());
  const [selectedDay, setSelectedDay] = useState<string>(() => {
    if (todayKey >= dateFrom && todayKey <= dateTo) return todayKey;
    return dateFrom;
  });

  useEffect(() => {
    setSelectedDay((prev) => {
      if (prev >= dateFrom && prev <= dateTo) return prev;
      if (todayKey >= dateFrom && todayKey <= dateTo) return todayKey;
      return dateFrom;
    });
  }, [dateFrom, dateTo, todayKey]);

  const selectedEvents = byDate.get(selectedDay) ?? [];

  const yearOptions = useMemo(() => buildYearOptions(year), [year]);
  const isCurrentMonth =
    year === new Date().getFullYear() && month === new Date().getMonth() + 1;

  const goToday = () => {
    const now = new Date();
    onMonthChange({ year: now.getFullYear(), month: now.getMonth() + 1 });
    setSelectedDay(toDateKey(now));
  };

  const goPrev = () => onMonthChange(shiftMonth(year, month, -1));
  const goNext = () => onMonthChange(shiftMonth(year, month, 1));

  const setMonthOnly = (nextMonth: number) => {
    onMonthChange({ year, month: nextMonth });
  };

  const setYearOnly = (nextYear: number) => {
    onMonthChange({ year: nextYear, month });
  };

  const selectedLabel = useMemo(() => {
    try {
      return new Date(`${selectedDay}T12:00:00`).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return selectedDay;
    }
  }, [selectedDay]);

  return (
    <div className="space-y-4">
      {/* Month / year picker — jelas untuk semua umur */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 px-0.5">
          Pilih bulan & tahun
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block min-w-0">
            <span className="block text-sm font-medium text-brand-700 mb-1.5">
              Bulan
            </span>
            <select
              value={month}
              onChange={(e) => setMonthOnly(Number(e.target.value))}
              className="block w-full rounded-xl border-gray-300 text-base font-semibold text-brand-700 py-3 focus:ring-primary-500 focus:border-primary-500"
              aria-label="Pilih bulan"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={name} value={idx + 1}>
                  {name}
                </option>
              ))}
            </select>
          </label>

          <label className="block min-w-0">
            <span className="block text-sm font-medium text-brand-700 mb-1.5">
              Tahun
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setYearOnly(year - 1)}
                className="inline-flex items-center justify-center w-12 h-12 rounded-xl border border-gray-200 text-brand-700 hover:bg-gray-50 flex-shrink-0"
                aria-label="Tahun sebelumnya"
              >
                <ChevronLeft size={20} />
              </button>
              <select
                value={year}
                onChange={(e) => setYearOnly(Number(e.target.value))}
                className="block w-full rounded-xl border-gray-300 text-base font-semibold text-brand-700 py-3 focus:ring-primary-500 focus:border-primary-500"
                aria-label="Pilih tahun"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setYearOnly(year + 1)}
                className="inline-flex items-center justify-center w-12 h-12 rounded-xl border border-gray-200 text-brand-700 hover:bg-gray-50 flex-shrink-0"
                aria-label="Tahun berikutnya"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </label>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goPrev}
            className="flex-1 inline-flex items-center justify-center gap-1.5 min-h-[48px] px-3 rounded-xl border border-gray-200 text-sm font-semibold text-brand-700 hover:bg-gray-50"
          >
            <ChevronLeft size={18} />
            <span className="hidden sm:inline">Bulan</span> lalu
          </button>
          <button
            type="button"
            onClick={goToday}
            disabled={isCurrentMonth}
            className={`flex-1 inline-flex items-center justify-center min-h-[48px] px-3 rounded-xl text-sm font-semibold transition-colors ${
              isCurrentMonth
                ? 'bg-primary-50 text-primary-700 border border-primary-200 cursor-default'
                : 'bg-primary-500 text-white hover:bg-primary-600'
            }`}
          >
            Hari ini
          </button>
          <button
            type="button"
            onClick={goNext}
            className="flex-1 inline-flex items-center justify-center gap-1.5 min-h-[48px] px-3 rounded-xl border border-gray-200 text-sm font-semibold text-brand-700 hover:bg-gray-50"
          >
            Bulan <span className="hidden sm:inline">depan</span>
            <ChevronRight size={18} />
          </button>
        </div>

        <p className="text-center text-sm font-bold text-brand-700 pt-0.5">
          Menampilkan: {MONTH_NAMES[month - 1]} {year}
        </p>
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/80">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="py-2 text-center text-[11px] sm:text-xs font-semibold text-gray-500"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((cell) => {
            const dayEvents = byDate.get(cell.dateKey) ?? [];
            const selected = selectedDay === cell.dateKey;
            const count = dayEvents.length;

            return (
              <button
                key={cell.dateKey}
                type="button"
                onClick={() => setSelectedDay(cell.dateKey)}
                className={`min-h-[64px] sm:min-h-[96px] p-1 sm:p-1.5 border-b border-r border-gray-50 text-left transition-colors ${
                  selected
                    ? 'bg-primary-50 ring-2 ring-inset ring-primary-400'
                    : 'hover:bg-gray-50'
                } ${cell.inCurrentMonth ? 'bg-white' : 'bg-gray-50/40'}`}
              >
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span
                    className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs sm:text-sm font-semibold ${
                      cell.isToday
                        ? 'bg-primary-500 text-white'
                        : cell.inCurrentMonth
                          ? 'text-brand-700'
                          : 'text-gray-300'
                    }`}
                  >
                    {cell.day}
                  </span>
                  {count > 0 && (
                    <span className="sm:hidden text-[10px] font-bold text-primary-600">
                      {count}
                    </span>
                  )}
                </div>

                <div className="hidden sm:flex flex-col gap-0.5">
                  {dayEvents.slice(0, 2).map((event) => {
                    const cfg = EVENT_TYPE_CONFIG[event.type];
                    return (
                      <span
                        key={`${cell.dateKey}-${event.id}`}
                        className={`truncate rounded px-1 py-0.5 text-[10px] font-medium leading-tight ${cfg.bg} ${cfg.color}`}
                        title={event.title}
                      >
                        {cfg.emoji} {event.title}
                      </span>
                    );
                  })}
                  {count > 2 && (
                    <span className="text-[10px] text-gray-400 font-medium px-0.5">
                      +{count - 2} lagi
                    </span>
                  )}
                </div>

                {count > 0 && (
                  <div className="sm:hidden flex gap-0.5 mt-1 flex-wrap">
                    {dayEvents.slice(0, 3).map((event) => (
                      <span
                        key={`${cell.dateKey}-dot-${event.id}`}
                        className="w-1.5 h-1.5 rounded-full bg-primary-500"
                        aria-hidden
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day detail — selalu tampil agar mudah untuk semua umur */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Acara pada
            </p>
            <h3 className="text-base sm:text-lg font-bold text-brand-700">
              {selectedLabel}
            </h3>
          </div>
          <span className="flex-shrink-0 inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
            {selectedEvents.length} acara
          </span>
        </div>

        {selectedEvents.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            Tidak ada acara di tanggal ini
          </p>
        ) : (
          <ul className="space-y-2">
            {selectedEvents.map((event) => {
              const cfg = EVENT_TYPE_CONFIG[event.type];
              return (
                <li
                  key={event.id}
                  className="rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50/40 transition-colors"
                >
                  <Link
                    to={`/events/${event.id}`}
                    className="flex items-start gap-3 p-3"
                  >
                    <span
                      className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg ${cfg.bg}`}
                    >
                      {cfg.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                        <span className={`text-xs font-semibold ${cfg.color}`}>
                          {cfg.label}
                        </span>
                        {isRestrictedEvent(event) && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">
                            <Lock size={10} /> Terbatas
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-brand-700 leading-snug">
                        {event.title}
                      </p>
                      {event.location && (
                        <p className="mt-1 text-xs text-gray-500 flex items-center gap-1 truncate">
                          <MapPin size={12} className="flex-shrink-0" />
                          {event.location}
                        </p>
                      )}
                      {event.endDate && event.endDate !== event.date && (
                        <p className="mt-1 text-[11px] text-gray-400">
                          {event.date} — {event.endDate}
                        </p>
                      )}
                    </div>
                  </Link>
                  {canManageEvent(event) && onEdit && (
                    <div className="px-3 pb-3 -mt-1">
                      <button
                        type="button"
                        onClick={() => onEdit(event)}
                        className="text-xs font-semibold text-primary-600 hover:underline min-h-[36px] px-1"
                      >
                        Edit acara
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
