import { createContext, useContext, useState, type ReactNode } from 'react';
import type { FamilyData, Person } from '@/types/person';
import { MOCK_FAMILY } from '@/data/mockFamilyData';
import {
  addPersonMutation,
  updatePersonMutation,
  deletePersonMutation,
} from '@/utils/personMutations';

type FamilyDataContextType = {
  persons: Person[];
  rootPersonId: string;
  addPerson: (person: Omit<Person, 'id'>) => void;
  updatePerson: (person: Person) => void;
  deletePerson: (id: string) => void;
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

  return (
    <FamilyDataContext.Provider
      value={{
        persons: familyData.persons,
        rootPersonId: familyData.rootPersonId,
        addPerson,
        updatePerson,
        deletePerson,
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
