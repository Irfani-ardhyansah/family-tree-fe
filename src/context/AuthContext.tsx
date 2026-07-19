import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Person } from '@/types/person';
import {
  findPersonByLoginCode,
  isValidLoginCodeFormat,
  normalizeLoginCode,
} from '@/utils/loginCode';

const AUTH_FLAG_KEY = 'familyroots_auth';
const AUTH_USER_KEY = 'familyroots_auth_user';

type AuthContextValue = {
  isAuthenticated: boolean;
  userId: string | null;
  login: (
    code: string,
    persons: Person[],
    remember: boolean,
  ) => Promise<{ ok: true; personId: string } | { ok: false; message: string }>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredAuth(): { isAuthenticated: boolean; userId: string | null } {
  try {
    const flag =
      localStorage.getItem(AUTH_FLAG_KEY) === '1' ||
      sessionStorage.getItem(AUTH_FLAG_KEY) === '1';
    if (!flag) return { isAuthenticated: false, userId: null };

    const userId =
      localStorage.getItem(AUTH_USER_KEY) ??
      sessionStorage.getItem(AUTH_USER_KEY);

    return { isAuthenticated: true, userId };
  } catch {
    return { isAuthenticated: false, userId: null };
  }
}

function persistAuth(userId: string, remember: boolean) {
  try {
    const storage = remember ? localStorage : sessionStorage;
    const other = remember ? sessionStorage : localStorage;

    storage.setItem(AUTH_FLAG_KEY, '1');
    storage.setItem(AUTH_USER_KEY, userId);
    other.removeItem(AUTH_FLAG_KEY);
    other.removeItem(AUTH_USER_KEY);
  } catch {
    // ignore storage errors
  }
}

function clearAuth() {
  try {
    localStorage.removeItem(AUTH_FLAG_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    sessionStorage.removeItem(AUTH_FLAG_KEY);
    sessionStorage.removeItem(AUTH_USER_KEY);
  } catch {
    // ignore storage errors
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const stored = readStoredAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(stored.isAuthenticated);
  const [userId, setUserId] = useState<string | null>(stored.userId);

  const login = useCallback(
    async (rawCode: string, persons: Person[], remember: boolean) => {
      const code = normalizeLoginCode(rawCode);

      if (!code) {
        return {
          ok: false as const,
          message: 'Kode masuk wajib diisi.',
        };
      }

      if (!isValidLoginCodeFormat(code)) {
        return {
          ok: false as const,
          message:
            'Format kode salah. Contoh: MR170845 atau MIA210399 (singkatan nama + DDMMYY).',
        };
      }

      await new Promise((resolve) => window.setTimeout(resolve, 300));

      const person = findPersonByLoginCode(persons, code);
      if (!person) {
        return {
          ok: false as const,
          message:
            'Kode tidak ditemukan. Periksa singkatan nama dan tanggal lahir Anda.',
        };
      }

      persistAuth(person.id, remember);
      setUserId(person.id);
      setIsAuthenticated(true);
      return { ok: true as const, personId: person.id };
    },
    [],
  );

  const logout = useCallback(() => {
    clearAuth();
    setUserId(null);
    setIsAuthenticated(false);
  }, []);

  const value = useMemo(
    () => ({ isAuthenticated, userId, login, logout }),
    [isAuthenticated, userId, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
