import { useMemo } from 'react';
import { useAuth } from '@/shared/context/AuthContext';
import { useDataSource } from '@/shared/context/DataSourceContext';
import { useFamilyPerspective } from '@/modules/family-roots/context/FamilyPerspectiveContext';

/** Active read focus — from BE person_options (API) or local perspective (mock). */
export function useFocusPersonId(): number | null {
  const { person, readFocusPersonId } = useAuth();
  const { source } = useDataSource();
  const { perspective } = useFamilyPerspective();

  return useMemo(() => {
    if (!person) return null;

    if (source === 'api') {
      return readFocusPersonId ?? person.id;
    }

    if (perspective === 'spouse' && person.spouseIds.length > 0) {
      return person.spouseIds[0];
    }

    return person.id;
  }, [person, readFocusPersonId, source, perspective]);
}
