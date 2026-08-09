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
import {
  emptyHealthProfile,
  HEALTH_PROFILES,
} from '@/modules/family-core/mocks/healthMock';
import type {
  GrowthPoint,
  HealthAllergy,
  HealthAppointment,
  HealthBasics,
  HealthCondition,
  HealthMedication,
  HealthNote,
  HealthSurgery,
  HealthVaccine,
  HealthXray,
  MemberHealthProfile,
} from '@/modules/family-core/types';

function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

type FamilyCoreHealthContextValue = {
  profiles: MemberHealthProfile[];
  getProfile: (memberId: string) => MemberHealthProfile;
  updateBasics: (memberId: string, basics: HealthBasics) => void;
  upsertAllergy: (
    memberId: string,
    item: Omit<HealthAllergy, 'id'> & { id?: string },
  ) => void;
  removeAllergy: (memberId: string, id: string) => void;
  upsertMedication: (
    memberId: string,
    item: Omit<HealthMedication, 'id'> & { id?: string },
  ) => void;
  removeMedication: (memberId: string, id: string) => void;
  upsertAppointment: (
    memberId: string,
    item: Omit<HealthAppointment, 'id'> & { id?: string },
  ) => HealthAppointment;
  removeAppointment: (memberId: string, id: string) => void;
  upsertCondition: (
    memberId: string,
    item: Omit<HealthCondition, 'id'> & { id?: string },
  ) => void;
  removeCondition: (memberId: string, id: string) => void;
  upsertSurgery: (
    memberId: string,
    item: Omit<HealthSurgery, 'id'> & { id?: string },
  ) => void;
  removeSurgery: (memberId: string, id: string) => void;
  upsertVaccine: (
    memberId: string,
    item: Omit<HealthVaccine, 'id'> & { id?: string },
  ) => void;
  removeVaccine: (memberId: string, id: string) => void;
  upsertNote: (
    memberId: string,
    item: Omit<HealthNote, 'id'> & { id?: string },
  ) => void;
  removeNote: (memberId: string, id: string) => void;
  upsertXray: (
    memberId: string,
    item: Omit<HealthXray, 'id'> & { id?: string },
  ) => void;
  removeXray: (memberId: string, id: string) => void;
  upsertGrowth: (
    memberId: string,
    item: Omit<GrowthPoint, 'id'> & { id?: string },
  ) => void;
  removeGrowth: (memberId: string, id: string) => void;
};

const FamilyCoreHealthContext =
  createContext<FamilyCoreHealthContextValue | null>(null);

function ensureProfile(
  profiles: MemberHealthProfile[],
  memberId: string,
): MemberHealthProfile[] {
  if (profiles.some((p) => p.memberId === memberId)) return profiles;
  return [...profiles, emptyHealthProfile(memberId)];
}

function patchList<T extends { id: string }>(
  list: T[],
  item: Omit<T, 'id'> & { id?: string },
  prefix: string,
): T[] {
  if (item.id) {
    return list.map((row) =>
      row.id === item.id ? ({ ...row, ...item, id: item.id } as T) : row,
    );
  }
  return [{ ...(item as T), id: newId(prefix) }, ...list];
}

export function FamilyCoreHealthProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] =
    useState<MemberHealthProfile[]>(HEALTH_PROFILES);

  const getProfile = useCallback(
    (memberId: string) => {
      const found =
        profiles.find((p) => p.memberId === memberId) ??
        emptyHealthProfile(memberId);
      return {
        ...found,
        xrays: found.xrays ?? [],
      };
    },
    [profiles],
  );

  const updateMember = useCallback(
    (
      memberId: string,
      updater: (profile: MemberHealthProfile) => MemberHealthProfile,
    ) => {
      setProfiles((prev) => {
        const ensured = ensureProfile(prev, memberId);
        return ensured.map((p) =>
          p.memberId === memberId ? updater(p) : p,
        );
      });
    },
    [],
  );

  const updateBasics = useCallback(
    (memberId: string, basics: HealthBasics) => {
      updateMember(memberId, (p) => ({ ...p, basics }));
    },
    [updateMember],
  );

  const upsertAllergy = useCallback(
    (
      memberId: string,
      item: Omit<HealthAllergy, 'id'> & { id?: string },
    ) => {
      updateMember(memberId, (p) => ({
        ...p,
        allergies: patchList(p.allergies, item, 'ha'),
      }));
    },
    [updateMember],
  );

  const removeAllergy = useCallback(
    (memberId: string, id: string) => {
      updateMember(memberId, (p) => ({
        ...p,
        allergies: p.allergies.filter((x) => x.id !== id),
      }));
    },
    [updateMember],
  );

  const upsertMedication = useCallback(
    (
      memberId: string,
      item: Omit<HealthMedication, 'id'> & { id?: string },
    ) => {
      updateMember(memberId, (p) => ({
        ...p,
        medications: patchList(p.medications, item, 'hm'),
      }));
    },
    [updateMember],
  );

  const removeMedication = useCallback(
    (memberId: string, id: string) => {
      updateMember(memberId, (p) => ({
        ...p,
        medications: p.medications.filter((x) => x.id !== id),
      }));
    },
    [updateMember],
  );

  const upsertAppointment = useCallback(
    (
      memberId: string,
      item: Omit<HealthAppointment, 'id'> & { id?: string },
    ) => {
      const id = item.id ?? newId('hap');
      const saved: HealthAppointment = { ...item, id };
      updateMember(memberId, (p) => ({
        ...p,
        appointments: item.id
          ? p.appointments.map((row) => (row.id === id ? saved : row))
          : [saved, ...p.appointments],
      }));
      return saved;
    },
    [updateMember],
  );

  const removeAppointment = useCallback(
    (memberId: string, id: string) => {
      updateMember(memberId, (p) => ({
        ...p,
        appointments: p.appointments.filter((x) => x.id !== id),
      }));
    },
    [updateMember],
  );

  const upsertCondition = useCallback(
    (
      memberId: string,
      item: Omit<HealthCondition, 'id'> & { id?: string },
    ) => {
      updateMember(memberId, (p) => ({
        ...p,
        conditions: patchList(p.conditions, item, 'hc'),
      }));
    },
    [updateMember],
  );

  const removeCondition = useCallback(
    (memberId: string, id: string) => {
      updateMember(memberId, (p) => ({
        ...p,
        conditions: p.conditions.filter((x) => x.id !== id),
      }));
    },
    [updateMember],
  );

  const upsertSurgery = useCallback(
    (
      memberId: string,
      item: Omit<HealthSurgery, 'id'> & { id?: string },
    ) => {
      updateMember(memberId, (p) => ({
        ...p,
        surgeries: patchList(p.surgeries, item, 'hs'),
      }));
    },
    [updateMember],
  );

  const removeSurgery = useCallback(
    (memberId: string, id: string) => {
      updateMember(memberId, (p) => ({
        ...p,
        surgeries: p.surgeries.filter((x) => x.id !== id),
      }));
    },
    [updateMember],
  );

  const upsertVaccine = useCallback(
    (
      memberId: string,
      item: Omit<HealthVaccine, 'id'> & { id?: string },
    ) => {
      updateMember(memberId, (p) => ({
        ...p,
        vaccines: patchList(p.vaccines, item, 'hv'),
      }));
    },
    [updateMember],
  );

  const removeVaccine = useCallback(
    (memberId: string, id: string) => {
      updateMember(memberId, (p) => ({
        ...p,
        vaccines: p.vaccines.filter((x) => x.id !== id),
      }));
    },
    [updateMember],
  );

  const upsertNote = useCallback(
    (memberId: string, item: Omit<HealthNote, 'id'> & { id?: string }) => {
      updateMember(memberId, (p) => ({
        ...p,
        notes: patchList(p.notes, item, 'hn'),
      }));
    },
    [updateMember],
  );

  const removeNote = useCallback(
    (memberId: string, id: string) => {
      updateMember(memberId, (p) => ({
        ...p,
        notes: p.notes.filter((x) => x.id !== id),
      }));
    },
    [updateMember],
  );

  const upsertXray = useCallback(
    (memberId: string, item: Omit<HealthXray, 'id'> & { id?: string }) => {
      updateMember(memberId, (p) => ({
        ...p,
        xrays: patchList(p.xrays ?? [], item, 'hx'),
      }));
    },
    [updateMember],
  );

  const removeXray = useCallback(
    (memberId: string, id: string) => {
      updateMember(memberId, (p) => ({
        ...p,
        xrays: (p.xrays ?? []).filter((x) => x.id !== id),
      }));
    },
    [updateMember],
  );

  const upsertGrowth = useCallback(
    (memberId: string, item: Omit<GrowthPoint, 'id'> & { id?: string }) => {
      updateMember(memberId, (p) => ({
        ...p,
        growth: patchList(p.growth, item, 'g').sort((a, b) =>
          a.date.localeCompare(b.date),
        ),
      }));
    },
    [updateMember],
  );

  const removeGrowth = useCallback(
    (memberId: string, id: string) => {
      updateMember(memberId, (p) => ({
        ...p,
        growth: p.growth.filter((x) => x.id !== id),
      }));
    },
    [updateMember],
  );

  const value = useMemo(
    () => ({
      profiles,
      getProfile,
      updateBasics,
      upsertAllergy,
      removeAllergy,
      upsertMedication,
      removeMedication,
      upsertAppointment,
      removeAppointment,
      upsertCondition,
      removeCondition,
      upsertSurgery,
      removeSurgery,
      upsertVaccine,
      removeVaccine,
      upsertNote,
      removeNote,
      upsertXray,
      removeXray,
      upsertGrowth,
      removeGrowth,
    }),
    [
      profiles,
      getProfile,
      updateBasics,
      upsertAllergy,
      removeAllergy,
      upsertMedication,
      removeMedication,
      upsertAppointment,
      removeAppointment,
      upsertCondition,
      removeCondition,
      upsertSurgery,
      removeSurgery,
      upsertVaccine,
      removeVaccine,
      upsertNote,
      removeNote,
      upsertXray,
      removeXray,
      upsertGrowth,
      removeGrowth,
    ],
  );

  return (
    <FamilyCoreHealthContext.Provider value={value}>
      {children}
    </FamilyCoreHealthContext.Provider>
  );
}

export function useFamilyCoreHealth() {
  const ctx = useContext(FamilyCoreHealthContext);
  if (!ctx) {
    throw new Error(
      'useFamilyCoreHealth must be used within FamilyCoreHealthProvider',
    );
  }
  return ctx;
}
