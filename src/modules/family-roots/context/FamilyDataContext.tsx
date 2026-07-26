import { createContext, useContext, useState, type ReactNode } from 'react';
import type { FamilyData, Person } from '@/shared/types/person';
import type { PersonImportDraft } from '@/shared/utils/personImport';
import { MOCK_FAMILY } from '@/shared/data/mockFamilyData';
import {
  addPersonMutation,
  updatePersonMutation,
  deletePersonMutation,
  importPersonsMutation,
} from '@/shared/utils/personMutations';

type FamilyDataContextType = {
  persons: Person[];
  rootPersonId: string;
  addPerson: (person: Omit<Person, 'id'>) => void;
  updatePerson: (person: Person) => void;
  deletePerson: (id: string) => void;
  importPersons: (drafts: PersonImportDraft[]) => number;
};

const FamilyDataContext = createContext<FamilyDataContextType | null>(null);

export function FamilyDataProvider({ children }: { children: ReactNode }) {
  const [familyData, setFamilyData] = useState<FamilyData>(MOCK_FAMILY);

  const addPerson = (personData: Omit<Person, 'id'>) => {
    setFamilyData((prev) => addPersonMutation(prev, personData));
  };

  const updatePerson = (updated: Person) => {
    setFamilyData((prev) => updatePersonMutation(prev, updated));
  };

  const deletePerson = (id: string) => {
    setFamilyData((prev) => deletePersonMutation(prev, id));
  };

  const importPersons = (drafts: PersonImportDraft[]) => {
    if (drafts.length === 0) return 0;
    setFamilyData((prev) => importPersonsMutation(prev, drafts));
    return drafts.length;
  };

  return (
    <FamilyDataContext.Provider
      value={{
        persons: familyData.persons,
        rootPersonId: familyData.rootPersonId,
        addPerson,
        updatePerson,
        deletePerson,
        importPersons,
      }}
    >
      {children}
    </FamilyDataContext.Provider>
  );
}

export function useFamily() {
  const ctx = useContext(FamilyDataContext);
  if (!ctx) throw new Error('useFamily must be used inside FamilyDataProvider');
  return ctx;
}
