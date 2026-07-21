import { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { PersonRole } from '@/types/api';

export function useIsAdmin(fallbackRole?: PersonRole): boolean {
  const { person } = useAuth();

  return useMemo(() => {
    if (person?.role) return person.role === 'admin';
    return fallbackRole === 'admin';
  }, [person?.role, fallbackRole]);
}
