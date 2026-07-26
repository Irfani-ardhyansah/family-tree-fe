import { useAuth } from '@/shared/context/AuthContext';

/** CRUD person hanya untuk user berusia 17+ (isLegal dari response login/me). */
export function useCanManagePersons(): boolean {
  const { person } = useAuth();
  return person?.isLegal === true;
}
