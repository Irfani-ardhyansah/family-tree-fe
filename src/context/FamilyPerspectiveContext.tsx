import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Person, TreePerspective } from '@/types/person';
import { useFamily } from '@/context/FamilyDataContext';
import {
  getPersonsForPerspective,
  getVisiblePersonIds,
} from '@/utils/familyPerspective';

export type PerspectiveTheme = {
  accent: string;
  accentBg: string;
  accentBorder: string;
  accentText: string;
  bannerBg: string;
  bannerBorder: string;
  ring: string;
};

const THEMES: Record<TreePerspective, PerspectiveTheme> = {
  self: {
    accent: 'bg-primary-500',
    accentBg: 'bg-primary-50',
    accentBorder: 'border-primary-400',
    accentText: 'text-primary-700',
    bannerBg: 'bg-primary-50',
    bannerBorder: 'border-primary-200',
    ring: 'ring-primary-400',
  },
  spouse: {
    accent: 'bg-secondary-500',
    accentBg: 'bg-secondary-100',
    accentBorder: 'border-secondary-500',
    accentText: 'text-brand-700',
    bannerBg: 'bg-secondary-100',
    bannerBorder: 'border-secondary-500/30',
    ring: 'ring-secondary-500',
  },
};

type FamilyPerspectiveContextType = {
  perspective: TreePerspective;
  setPerspective: (p: TreePerspective) => void;
  me: Person | undefined;
  spouse: Person | undefined;
  hasSpouse: boolean;
  focusPerson: Person | undefined;
  focusLabel: string;
  focusShortLabel: string;
  theme: PerspectiveTheme;
  visiblePersons: Person[];
  visiblePersonIds: Set<string>;
};

const FamilyPerspectiveContext =
  createContext<FamilyPerspectiveContextType | null>(null);

export function FamilyPerspectiveProvider({ children }: { children: ReactNode }) {
  const { persons, rootPersonId } = useFamily();
  const [perspective, setPerspective] = useState<TreePerspective>('self');

  const me = useMemo(
    () =>
      persons.find((p) => p.isSelf) ??
      persons.find((p) => p.id === rootPersonId),
    [persons, rootPersonId],
  );

  const spouse = useMemo(() => {
    const spouseId = me?.spouseIds[0];
    return spouseId ? persons.find((p) => p.id === spouseId) : undefined;
  }, [me, persons]);

  const hasSpouse = !!spouse;

  const focusPerson = perspective === 'spouse' && spouse ? spouse : me;
  const focusLabel = focusPerson?.fullName ?? 'Saya';
  const focusShortLabel =
    perspective === 'self'
      ? 'Saya'
      : spouse?.nickname ?? spouse?.fullName.split(' ').slice(-1)[0] ?? 'Pasangan';

  const familyData = useMemo(
    () => ({ persons, rootPersonId }),
    [persons, rootPersonId],
  );

  const visiblePersons = useMemo(
    () => getPersonsForPerspective(familyData, perspective),
    [familyData, perspective],
  );

  const visiblePersonIds = useMemo(
    () => getVisiblePersonIds(familyData, perspective),
    [familyData, perspective],
  );

  const theme = THEMES[perspective];

  return (
    <FamilyPerspectiveContext.Provider
      value={{
        perspective,
        setPerspective,
        me,
        spouse,
        hasSpouse,
        focusPerson,
        focusLabel,
        focusShortLabel,
        theme,
        visiblePersons,
        visiblePersonIds,
      }}
    >
      {children}
    </FamilyPerspectiveContext.Provider>
  );
}

export function useFamilyPerspective() {
  const ctx = useContext(FamilyPerspectiveContext);
  if (!ctx) {
    throw new Error(
      'useFamilyPerspective must be used inside FamilyPerspectiveProvider',
    );
  }
  return ctx;
}
