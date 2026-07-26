import { useMemo } from 'react';
import { useAuth } from '@/shared/context/AuthContext';
import type { PersonRole } from '@/shared/types/api';

export function useIsAdmin(fallbackRole?: PersonRole): boolean {
  const { person } = useAuth();

  return useMemo(() => {
    if (person?.isAdmin === true) return true;
    if (person?.isAdmin === false) return false;
    if (person?.role) return person.role === 'admin';
    return fallbackRole === 'admin';
  }, [person?.isAdmin, person?.role, fallbackRole]);
}
