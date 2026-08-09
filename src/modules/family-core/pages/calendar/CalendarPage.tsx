import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, Settings } from 'react-feather';
import {
  CoreCard,
  CorePageHeader,
} from '@/modules/family-core/components/PageChrome';
import { useFamilyCoreCalendar } from '@/modules/family-core/context/FamilyCoreCalendarContext';
import { useFamilyCoreCalendarEventTypes } from '@/modules/family-core/context/FamilyCoreCalendarEventTypesContext';
import { useFamilyCoreUi } from '@/modules/family-core/context/FamilyCoreUiContext';
import {
  buildMonthCells,
  eventOccursOn,
  formatDayLabel,
  formatMonthLabel,
  sortEvents,
  toDateKey,
} from '@/modules/family-core/lib/calendarDate';
import { resolveCalendarEventType } from '@/modules/family-core/lib/calendarEventMeta';
import { CORE_MEMBERS } from '@/modules/family-core/mocks/coreMembers';
import type { CalendarEventTypeSlug } from '@/modules/family-core/types';
import { corePaths } from '@/shared/routes';

const WEEKDAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export function CalendarPage() {
  const { events } = useFamilyCoreCalendar();
  const { types, getTypeBySlug } = useFamilyCoreCalendarEventTypes();
  const { openCalendarModal } = useFamilyCoreUi();
  const todayKey = toDateKey(new Date());
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDay, setSelectedDay] = useState(todayKey);
  const [typeFilter, setTypeFilter] = useState<'all' | CalendarEventTypeSlug>(
    'all',
  );

  const metaOf = (slug: string) =>
    resolveCalendarEventType(getTypeBySlug(slug));

  const cells = useMemo(
    () => buildMonthCells(cursor.year, cursor.month),
    [cursor.year, cursor.month],
  );

  const filtered = useMemo(() => {
    const list =
      typeFilter === 'all'
        ? events
        : events.filter((e) => e.type === typeFilter);
    return sortEvents(list);
  }, [events, typeFilter]);

  const dayEvents = useMemo(
    () => filtered.filter((e) => eventOccursOn(e, selectedDay)),
    [filtered, selectedDay],
  );

  const upcoming = useMemo(() => {
    return filtered
      .filter((e) => e.date >= todayKey || (e.endDate && e.endDate >= todayKey))
      .slice(0, 8);
  }, [filtered, todayKey]);

  const dotsByDay = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const event of filtered) {
      const start = event.date;
      const end =
        event.endDate && event.endDate > event.date ? event.endDate : event.date;
      let cur = start;
      while (cur <= end) {
        const meta = metaOf(event.type);
        const list = map.get(cur) ?? [];
        if (!list.includes(meta.dot) && list.length < 3) list.push(meta.dot);
        map.set(cur, list);
        const d = new Date(`${cur}T12:00:00`);
        d.setDate(d.getDate() + 1);
        cur = toDateKey(d);
      }
    }
    return map;
  }, [filtered, types]);

  const shiftMonth = (delta: number) => {
    setCursor((prev) => {
      const d = new Date(prev.year, prev.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const memberName = (id: string | null) =>
    id ? CORE_MEMBERS.find((m) => m.id === id)?.name : null;

  const openAdd = () => {
    openCalendarModal({ defaultDate: selectedDay });
  };

  return (
    <div>
      <CorePageHeader
        title="Family calendar"
        description="Jadwal keluarga inti — beda dari acara besar Family Roots."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={corePaths.calendarEventTypes}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-[13px] font-bold text-brand-700 hover:border-sky-300 hover:text-sky-700"
            >
              <Settings size={15} />
              Tipe
            </Link>
            <button
              type="button"
              onClick={openAdd}
              className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 py-2.5 text-[13px] font-bold text-white shadow-sm hover:bg-sky-700"
            >
              <Plus size={16} />
              Tambah
            </button>
          </div>
        }
      />

      <div className="mb-3 -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        <button
          type="button"
          onClick={() => setTypeFilter('all')}
          className={[
            'whitespace-nowrap rounded-full border px-3 py-1.5 text-[12px] font-bold transition-colors',
            typeFilter === 'all'
              ? 'border-sky-500 bg-sky-50 text-sky-800'
              : 'border-gray-200 bg-white text-brand-500 hover:bg-gray-50',
          ].join(' ')}
        >
          Semua
        </button>
        {types.map((t) => {
          const resolved = resolveCalendarEventType(t);
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTypeFilter(t.slug)}
              className={[
                'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-[12px] font-bold transition-colors',
                typeFilter === t.slug
                  ? 'border-sky-500 bg-sky-50 text-sky-800'
                  : 'border-gray-200 bg-white text-brand-500 hover:bg-gray-50',
              ].join(' ')}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${resolved.dot}`} />
              {t.label}
            </button>
          );
        })}
      </div>

      <CoreCard className="mb-4 overflow-hidden p-3 sm:p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="rounded-xl p-2 text-brand-500 hover:bg-gray-50"
            aria-label="Bulan sebelumnya"
          >
            <ChevronLeft size={18} />
          </button>
          <p className="text-[15px] font-bold capitalize text-brand-800">
            {formatMonthLabel(cursor.year, cursor.month)}
          </p>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="rounded-xl p-2 text-brand-500 hover:bg-gray-50"
            aria-label="Bulan berikutnya"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="mb-1 grid grid-cols-7 gap-1">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="py-1 text-center text-[11px] font-bold text-brand-400"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((key, idx) => {
            if (!key) {
              return <div key={`empty-${idx}`} className="aspect-square" />;
            }
            const selected = key === selectedDay;
            const isToday = key === todayKey;
            const dots = dotsByDay.get(key) ?? [];
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedDay(key)}
                onDoubleClick={() =>
                  openCalendarModal({ defaultDate: key })
                }
                className={[
                  'flex aspect-square flex-col items-center justify-center rounded-[12px] text-[13px] font-semibold transition-colors',
                  selected
                    ? 'bg-sky-600 text-white'
                    : isToday
                      ? 'bg-sky-50 text-sky-800'
                      : 'text-brand-700 hover:bg-gray-50',
                ].join(' ')}
              >
                {Number(key.slice(-2))}
                <span className="mt-0.5 flex h-1.5 gap-0.5">
                  {dots.map((dot) => (
                    <span
                      key={dot}
                      className={[
                        'h-1 w-1 rounded-full',
                        selected ? 'bg-white/90' : dot,
                      ].join(' ')}
                    />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </CoreCard>

      <div className="mb-2 flex items-end justify-between gap-2">
        <div>
          <h2 className="text-[13px] font-bold text-brand-800">
            {formatDayLabel(selectedDay)}
          </h2>
          <p className="text-[12px] text-brand-400">
            {dayEvents.length} kegiatan
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="text-[12px] font-bold text-sky-700 hover:underline"
        >
          + Jadwal di hari ini
        </button>
      </div>

      <CoreCard className="mb-5 overflow-hidden divide-y divide-gray-100">
        {dayEvents.length === 0 ? (
          <p className="px-4 py-8 text-center text-[13px] text-brand-400">
            Tidak ada jadwal di hari ini.
          </p>
        ) : (
          dayEvents.map((event) => {
            const meta = metaOf(event.type);
            const Icon = meta.Icon;
            const who = memberName(event.memberId);
            return (
              <Link
                key={event.id}
                to={corePaths.calendarEvent(event.id)}
                className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-sky-50/60"
              >
                <span
                  className={[
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]',
                    meta.toneBg,
                    meta.toneText,
                  ].join(' ')}
                >
                  <Icon size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-brand-800">
                    {event.title}
                  </p>
                  <p className="mt-0.5 truncate text-[12.5px] text-brand-500">
                    {[
                      event.allDay ? 'Seharian' : event.time,
                      meta.label,
                      who,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
              </Link>
            );
          })
        )}
      </CoreCard>

      <h2 className="mb-2 text-[13px] font-bold uppercase tracking-wide text-brand-400">
        Mendatang
      </h2>
      <CoreCard className="overflow-hidden divide-y divide-gray-100">
        {upcoming.length === 0 ? (
          <p className="px-4 py-8 text-center text-[13px] text-brand-400">
            Tidak ada jadwal mendatang.
          </p>
        ) : (
          upcoming.map((event) => {
            const meta = metaOf(event.type);
            return (
              <Link
                key={event.id}
                to={corePaths.calendarEvent(event.id)}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-sky-50/60"
              >
                <span className={`h-2 w-2 shrink-0 rounded-full ${meta.dot}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold text-brand-800">
                    {event.title}
                  </p>
                  <p className="text-[12px] text-brand-400">
                    {event.date}
                    {event.time ? ` · ${event.time}` : ''}
                    {' · '}
                    {meta.label}
                  </p>
                </div>
              </Link>
            );
          })
        )}
      </CoreCard>
    </div>
  );
}
