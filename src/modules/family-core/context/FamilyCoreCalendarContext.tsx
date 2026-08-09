/* Context + hook are intentionally co-located. */
/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { CALENDAR_EVENTS } from '@/modules/family-core/mocks/calendarMock';
import type { CalendarEvent } from '@/modules/family-core/types';

export type CalendarEventDraft = Omit<CalendarEvent, 'id'>;

type FamilyCoreCalendarContextValue = {
  events: CalendarEvent[];
  getEvent: (id: string) => CalendarEvent | undefined;
  addEvent: (draft: CalendarEventDraft) => CalendarEvent;
  updateEvent: (id: string, draft: CalendarEventDraft) => CalendarEvent | null;
  deleteEvent: (id: string) => boolean;
};

const FamilyCoreCalendarContext =
  createContext<FamilyCoreCalendarContextValue | null>(null);

export function FamilyCoreCalendarProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [events, setEvents] = useState<CalendarEvent[]>(CALENDAR_EVENTS);

  const getEvent = useCallback(
    (id: string) => events.find((e) => e.id === id),
    [events],
  );

  const addEvent = useCallback((draft: CalendarEventDraft) => {
    const created: CalendarEvent = {
      ...draft,
      id: `cal-${crypto.randomUUID().slice(0, 8)}`,
    };
    setEvents((prev) => [created, ...prev]);
    return created;
  }, []);

  const updateEvent = useCallback(
    (id: string, draft: CalendarEventDraft) => {
      let updated: CalendarEvent | null = null;
      setEvents((prev) =>
        prev.map((event) => {
          if (event.id !== id) return event;
          updated = { ...draft, id };
          return updated;
        }),
      );
      return updated;
    },
    [],
  );

  const deleteEvent = useCallback((id: string) => {
    let removed = false;
    setEvents((prev) => {
      const next = prev.filter((e) => e.id !== id);
      removed = next.length !== prev.length;
      return next;
    });
    return removed;
  }, []);

  const value = useMemo(
    () => ({ events, getEvent, addEvent, updateEvent, deleteEvent }),
    [events, getEvent, addEvent, updateEvent, deleteEvent],
  );

  return (
    <FamilyCoreCalendarContext.Provider value={value}>
      {children}
    </FamilyCoreCalendarContext.Provider>
  );
}

export function useFamilyCoreCalendar() {
  const ctx = useContext(FamilyCoreCalendarContext);
  if (!ctx) {
    throw new Error(
      'useFamilyCoreCalendar must be used within FamilyCoreCalendarProvider',
    );
  }
  return ctx;
}
