import { createContext, useContext, useState, type ReactNode } from 'react';
import type { MemoriamTribute, PrayerRecord } from '@/shared/types/memoriam';
import { MOCK_PRAYERS, MOCK_TRIBUTES } from '@/shared/data/mockMemoriamData';

type MemoriamContextType = {
  tributes: MemoriamTribute[];
  prayers: PrayerRecord[];
  getTributesFor: (deceasedId: string) => MemoriamTribute[];
  getPrayersFor: (deceasedId: string) => PrayerRecord[];
  addTribute: (data: Omit<MemoriamTribute, 'id' | 'createdAt'>) => void;
  updateTribute: (
    id: string,
    data: Pick<MemoriamTribute, 'content' | 'photoUrls'>,
  ) => void;
  deleteTribute: (id: string) => void;
  addPrayer: (deceasedId: string, authorId: string) => void;
  hasPrayed: (deceasedId: string, authorId: string) => boolean;
};

const MemoriamContext = createContext<MemoriamContextType | null>(null);

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function MemoriamProvider({ children }: { children: ReactNode }) {
  const [tributes, setTributes] = useState<MemoriamTribute[]>(MOCK_TRIBUTES);
  const [prayers, setPrayers] = useState<PrayerRecord[]>(MOCK_PRAYERS);

  const getTributesFor = (deceasedId: string) =>
    tributes
      .filter((t) => t.deceasedId === deceasedId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

  const getPrayersFor = (deceasedId: string) =>
    prayers.filter((p) => p.deceasedId === deceasedId);

  const addTribute = (data: Omit<MemoriamTribute, 'id' | 'createdAt'>) => {
    const now = new Date().toISOString();
    setTributes((prev) => [
      {
        ...data,
        id: generateId('trib'),
        createdAt: now,
        updatedAt: now,
        photoUrls: data.photoUrls ?? [],
        canManage: true,
      },
      ...prev,
    ]);
  };

  const updateTribute = (
    id: string,
    data: Pick<MemoriamTribute, 'content' | 'photoUrls'>,
  ) => {
    setTributes((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              content: data.content,
              photoUrls: data.photoUrls ?? [],
              updatedAt: new Date().toISOString(),
            }
          : t,
      ),
    );
  };

  const deleteTribute = (id: string) => {
    setTributes((prev) => prev.filter((t) => t.id !== id));
  };

  const addPrayer = (deceasedId: string, authorId: string) => {
    setPrayers((prev) => {
      if (prev.some((p) => p.deceasedId === deceasedId && p.authorId === authorId)) {
        return prev;
      }
      return [
        ...prev,
        {
          id: generateId('pray'),
          deceasedId,
          authorId,
          createdAt: new Date().toISOString(),
        },
      ];
    });
  };

  const hasPrayed = (deceasedId: string, authorId: string) =>
    prayers.some((p) => p.deceasedId === deceasedId && p.authorId === authorId);

  return (
    <MemoriamContext.Provider
      value={{
        tributes,
        prayers,
        getTributesFor,
        getPrayersFor,
        addTribute,
        updateTribute,
        deleteTribute,
        addPrayer,
        hasPrayed,
      }}
    >
      {children}
    </MemoriamContext.Provider>
  );
}

export function useMemoriam() {
  const ctx = useContext(MemoriamContext);
  if (!ctx) throw new Error('useMemoriam must be used inside MemoriamProvider');
  return ctx;
}
