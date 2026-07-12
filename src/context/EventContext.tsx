import { createContext, useContext, useState, type ReactNode } from 'react';
import type { FamilyEvent } from '@/types/event';
import { MOCK_EVENTS } from '@/data/mockEventData';

type EventContextType = {
  events: FamilyEvent[];
  addEvent: (event: Omit<FamilyEvent, 'id'>) => void;
  updateEvent: (event: FamilyEvent) => void;
  deleteEvent: (id: string) => void;
};

const EventContext = createContext<EventContextType | null>(null);

function generateId(): string {
  return `event-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function EventProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<FamilyEvent[]>(MOCK_EVENTS);

  const addEvent = (data: Omit<FamilyEvent, 'id'>) => {
    setEvents((prev) => [{ ...data, id: generateId() }, ...prev]);
  };

  const updateEvent = (updated: FamilyEvent) => {
    setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
  };

  const deleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <EventContext.Provider value={{ events, addEvent, updateEvent, deleteEvent }}>
      {children}
    </EventContext.Provider>
  );
}

export function useEvents() {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error('useEvents must be used inside EventProvider');
  return ctx;
}
