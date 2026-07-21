import { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useFamilyPerspective } from '@/context/FamilyPerspectiveContext';

export function useFocusPersonId(): number | null {
  const { person } = useAuth();
  const { perspective } = useFamilyPerspective();

  return useMemo(() => {
    if (!person) return null;

    if (perspective === 'spouse' && person.spouseIds.length > 0) {
      return person.spouseIds[0];
    }

    return person.id;
  }, [person, perspective]);
}
