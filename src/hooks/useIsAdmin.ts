import { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useFamily } from '@/context/FamilyDataContext';

export function useIsAdmin(): boolean {
  const { userId } = useAuth();
  const { persons } = useFamily();

  return useMemo(() => {
    if (!userId) return false;
    const user = persons.find((p) => p.id === userId);
    return user?.role === 'admin';
  }, [userId, persons]);
}
