import type { FamilyData, Person } from '@/types/person';
import type { PersonImportDraft } from '@/utils/personImport';

function generateId(): string {
  return `person-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function buildPersonFromDraft(
  draft: PersonImportDraft,
  id: string,
): Person {
  const hasAddress =
    draft.street ||
    draft.district ||
    draft.city ||
    draft.province ||
    draft.postalCode ||
    draft.latitude != null ||
    draft.longitude != null;

  return {
    id,
    fullName: draft.fullName.trim(),
    nickname: draft.nickname,
    gender: draft.gender,
    birthDate: draft.birthDate,
    status: draft.status,
    deathDate: draft.deathDate,
    religion: draft.religion,
    occupation: draft.occupation,
    phone: draft.phone,
    phoneAlt: draft.phoneAlt,
    address: hasAddress
      ? {
          street: draft.street,
          district: draft.district,
          city: draft.city,
          province: draft.province,
          postalCode: draft.postalCode,
          country: 'Indonesia',
          latitude: draft.latitude,
          longitude: draft.longitude,
        }
      : undefined,
    generationLabel: draft.generationLabel,
    spouseIds: [],
    role: 'member',
  };
}

function findIdByName(
  name: string | undefined,
  nameToId: Map<string, string>,
): string | undefined {
  if (!name?.trim()) return undefined;
  return nameToId.get(name.trim().toLowerCase());
}

function splitSpouseNames(raw?: string): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean);
}

export function addPersonMutation(
  data: FamilyData,
  personData: Omit<Person, 'id'>,
): FamilyData {
  const newId = generateId();
  const newPerson: Person = { ...personData, id: newId };
  let persons = [...data.persons, newPerson];

  if (newPerson.spouseIds.length > 0) {
    persons = persons.map((p) => {
      if (newPerson.spouseIds.includes(p.id)) {
        return { ...p, spouseIds: [...new Set([...p.spouseIds, newId])] };
      }
      return p;
    });
  }

  return { ...data, persons };
}

export function updatePersonMutation(
  data: FamilyData,
  updated: Person,
): FamilyData {
  const oldPerson = data.persons.find((p) => p.id === updated.id);
  let persons = data.persons.map((p) => (p.id === updated.id ? updated : p));

  const removedSpouses = (oldPerson?.spouseIds ?? []).filter(
    (id) => !updated.spouseIds.includes(id),
  );
  const addedSpouses = updated.spouseIds.filter(
    (id) => !(oldPerson?.spouseIds ?? []).includes(id),
  );

  persons = persons.map((p) => {
    if (removedSpouses.includes(p.id)) {
      return { ...p, spouseIds: p.spouseIds.filter((id) => id !== updated.id) };
    }
    if (addedSpouses.includes(p.id)) {
      return { ...p, spouseIds: [...new Set([...p.spouseIds, updated.id])] };
    }
    return p;
  });

  return { ...data, persons };
}

export function deletePersonMutation(data: FamilyData, id: string): FamilyData {
  const persons = data.persons
    .filter((p) => p.id !== id)
    .map((p) => ({
      ...p,
      spouseIds: p.spouseIds.filter((sid) => sid !== id),
      fatherId: p.fatherId === id ? undefined : p.fatherId,
      motherId: p.motherId === id ? undefined : p.motherId,
    }));

  return { ...data, persons };
}

export function importPersonsMutation(
  data: FamilyData,
  drafts: PersonImportDraft[],
): FamilyData {
  if (drafts.length === 0) return data;

  const nameToId = new Map(
    data.persons.map((p) => [p.fullName.trim().toLowerCase(), p.id]),
  );

  const newPersons: Person[] = drafts.map((draft) => {
    const id = generateId();
    nameToId.set(draft.fullName.trim().toLowerCase(), id);
    return buildPersonFromDraft(draft, id);
  });

  const linkedPersons = newPersons.map((person, index) => {
    const draft = drafts[index];
    const fatherId = findIdByName(draft.fatherName, nameToId);
    const motherId = findIdByName(draft.motherName, nameToId);
    const spouseIds = splitSpouseNames(draft.spouseNames)
      .map((name) => findIdByName(name, nameToId))
      .filter((id): id is string => !!id && id !== person.id);

    return {
      ...person,
      fatherId,
      motherId,
      spouseIds,
    };
  });

  let persons = [...data.persons, ...linkedPersons];

  for (const person of linkedPersons) {
    for (const spouseId of person.spouseIds) {
      persons = persons.map((p) => {
        if (p.id !== spouseId) return p;
        if (p.spouseIds.includes(person.id)) return p;
        return { ...p, spouseIds: [...p.spouseIds, person.id] };
      });
    }
  }

  return { ...data, persons };
}
