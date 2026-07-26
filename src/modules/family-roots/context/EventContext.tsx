import { createContext, useContext, useState, type ReactNode } from 'react';
import type { EventContribution, FamilyEvent } from '@/shared/types/event';
import { MOCK_EVENTS } from '@/shared/data/mockEventData';

type EventContextType = {
  events: FamilyEvent[];
  getEventById: (id: string) => FamilyEvent | undefined;
  addEvent: (event: Omit<FamilyEvent, 'id'>) => void;
  updateEvent: (event: FamilyEvent) => void;
  deleteEvent: (id: string) => void;
  addContribution: (
    eventId: string,
    contribution: Omit<EventContribution, 'id' | 'createdAt'>,
  ) => void;
};

const EventContext = createContext<EventContextType | null>(null);

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function normalizeEvent(event: FamilyEvent): FamilyEvent {
  return {
    ...event,
    personIds: event.personIds ?? [],
    attendeeIds: event.attendeeIds ?? [],
    contributions: event.contributions ?? [],
    photoUrls: event.photoUrls ?? [],
  };
}

export function EventProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<FamilyEvent[]>(
    MOCK_EVENTS.map(normalizeEvent),
  );

  const getEventById = (id: string) => {
    const event = events.find((e) => e.id === id);
    return event ? normalizeEvent(event) : undefined;
  };

  const addEvent = (data: Omit<FamilyEvent, 'id'>) => {
    const newEvent: FamilyEvent = normalizeEvent({
      ...data,
      id: generateId('event'),
    });
    setEvents((prev) => [newEvent, ...prev]);
  };

  const updateEvent = (updated: FamilyEvent) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === updated.id ? normalizeEvent(updated) : e)),
    );
  };

  const deleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const addContribution = (
    eventId: string,
    contribution: Omit<EventContribution, 'id' | 'createdAt'>,
  ) => {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id !== eventId) return e;
        const newContribution: EventContribution = {
          ...contribution,
          id: generateId('contrib'),
          createdAt: new Date().toISOString(),
        };
        return {
          ...e,
          contributions: [newContribution, ...e.contributions],
        };
      }),
    );
  };

  return (
    <EventContext.Provider
      value={{
        events,
        getEventById,
        addEvent,
        updateEvent,
        deleteEvent,
        addContribution,
      }}
    >
      {children}
    </EventContext.Provider>
  );
}

export function useEvents() {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error('useEvents must be used inside EventProvider');
  return ctx;
}
