import type { FamilyData, Person } from '@/types/person';

function generateId(): string {
  return `person-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
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
