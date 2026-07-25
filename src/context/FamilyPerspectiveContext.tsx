import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AllowedFocusPerson } from '@/types/api';
import type { Person, TreePerspective } from '@/types/person';
import { useAuth } from '@/context/AuthContext';
import { useDataSource } from '@/context/DataSourceContext';
import { useFamily } from '@/context/FamilyDataContext';
import { authPersonToLocal } from '@/utils/personApiMapper';
import { shortPersonName } from '@/utils/personDisplayName';
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
  isPerspectiveSaving: boolean;
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

function perspectiveFromFocusId(
  spouseIds: number[],
  readFocusPersonId: number,
): TreePerspective {
  const spouseId = spouseIds[0];
  if (spouseId != null && readFocusPersonId === spouseId) {
    return 'spouse';
  }
  return 'self';
}

function allowedFocusToLocal(
  entry: AllowedFocusPerson,
  extras?: { birthDate?: string; status?: Person['status']; spouseIds?: string[] },
): Person {
  return {
    id: String(entry.id),
    fullName: entry.fullName,
    nickname: entry.nickname ?? undefined,
    gender: entry.gender,
    birthDate: extras?.birthDate ?? '',
    status: extras?.status ?? 'alive',
    photoUrl: entry.photoUrl ?? undefined,
    spouseIds: extras?.spouseIds ?? [],
    isSelf: entry.relation === 'self',
  };
}

export function FamilyPerspectiveProvider({ children }: { children: ReactNode }) {
  const { person: authPerson, readFocusPersonId, setReadFocusPersonId } =
    useAuth();
  const { source } = useDataSource();
  const { persons, rootPersonId } = useFamily();
  const [mockPerspective, setMockPerspective] = useState<TreePerspective>('self');
  const [isPerspectiveSaving, setIsPerspectiveSaving] = useState(false);

  const allowedFocusPersons = authPerson?.allowedFocusPersons;
  const allowedSelf = useMemo(
    () => allowedFocusPersons?.find((p) => p.relation === 'self'),
    [allowedFocusPersons],
  );
  const allowedSpouse = useMemo(
    () => allowedFocusPersons?.find((p) => p.relation === 'spouse'),
    [allowedFocusPersons],
  );

  const hasSpouse =
    authPerson?.isMarried === true || allowedSpouse != null;

  const apiPerspective = useMemo((): TreePerspective => {
    if (!authPerson || readFocusPersonId == null) return 'self';
    const spouseIds =
      allowedSpouse != null
        ? [allowedSpouse.id, ...authPerson.spouseIds.filter((id) => id !== allowedSpouse.id)]
        : authPerson.spouseIds;
    return perspectiveFromFocusId(spouseIds, readFocusPersonId);
  }, [authPerson, readFocusPersonId, allowedSpouse]);

  const perspective = source === 'api' ? apiPerspective : mockPerspective;

  const me = useMemo(() => {
    if (authPerson) {
      const fromAuth = authPersonToLocal(authPerson);
      if (allowedSelf) {
        return {
          ...fromAuth,
          fullName: allowedSelf.fullName,
          nickname: allowedSelf.nickname ?? fromAuth.nickname,
          photoUrl: allowedSelf.photoUrl ?? fromAuth.photoUrl,
          gender: allowedSelf.gender,
        };
      }
      return fromAuth;
    }
    return (
      persons.find((p) => p.isSelf) ??
      persons.find((p) => p.id === rootPersonId)
    );
  }, [authPerson, allowedSelf, persons, rootPersonId]);

  const spouse = useMemo(() => {
    const spouseId =
      allowedSpouse?.id ??
      authPerson?.spouseIds[0] ??
      (me?.spouseIds[0] != null ? Number(me.spouseIds[0]) : undefined);

    if (spouseId == null || Number.isNaN(spouseId)) return undefined;

    const fromList = persons.find((p) => p.id === String(spouseId));
    if (fromList) {
      if (!allowedSpouse) return fromList;
      return {
        ...fromList,
        fullName: allowedSpouse.fullName,
        nickname: allowedSpouse.nickname ?? fromList.nickname,
        photoUrl: allowedSpouse.photoUrl ?? fromList.photoUrl,
        gender: allowedSpouse.gender,
      };
    }

    if (allowedSpouse) {
      return allowedFocusToLocal(allowedSpouse, {
        spouseIds: me ? [me.id] : [],
      });
    }

    return undefined;
  }, [allowedSpouse, authPerson, me, persons]);

  const focusPerson = perspective === 'spouse' && spouse ? spouse : me;
  const focusLabel = focusPerson?.fullName ?? 'Saya';
  const focusShortLabel =
    perspective === 'spouse'
      ? shortPersonName(spouse ?? allowedSpouse, 'Pasangan')
      : shortPersonName(me ?? allowedSelf, 'Saya');

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

  const setPerspective = useCallback(
    (p: TreePerspective) => {
      if (source === 'mock') {
        setMockPerspective(p);
        return;
      }

      if (!authPerson) return;

      const spouseTargetId = allowedSpouse?.id ?? authPerson.spouseIds[0];
      const targetId =
        p === 'spouse' && spouseTargetId != null
          ? spouseTargetId
          : authPerson.id;

      setIsPerspectiveSaving(true);
      void setReadFocusPersonId(targetId).finally(() => {
        setIsPerspectiveSaving(false);
      });
    },
    [source, authPerson, allowedSpouse, setReadFocusPersonId],
  );

  return (
    <FamilyPerspectiveContext.Provider
      value={{
        perspective,
        setPerspective,
        isPerspectiveSaving,
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
