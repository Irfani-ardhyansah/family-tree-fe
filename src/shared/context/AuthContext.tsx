import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AuthMeResponse, AuthPerson } from '@/shared/types/api';
import {
  bootstrapSession,
  clearModuleUnlockToken,
  fetchMe,
  loginRequest,
  logoutRequest,
  mapLoginError,
  SESSION_EXPIRED_EVENT,
} from '@/shared/lib/apiClient';
import { disableWebPush } from '@/shared/lib/webPush';
import { patchMeOption, fetchMeOptions } from '@/shared/lib/authOptionsApi';
import {
  isValidLoginCodeFormat,
  normalizeLoginCode,
} from '@/shared/utils/loginCode';
import { appPaths } from '@/shared/routes';

const AUTH_PERSON_KEY = 'familyroots_auth_person';

function persistAuthPerson(person: AuthMeResponse) {
  try {
    sessionStorage.setItem(AUTH_PERSON_KEY, JSON.stringify(person));
  } catch {
    // ignore storage errors
  }
}

function readStoredAuthPerson(): AuthMeResponse | null {
  try {
    const raw = sessionStorage.getItem(AUTH_PERSON_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthMeResponse;
  } catch {
    return null;
  }
}

function clearStoredAuthPerson() {
  try {
    sessionStorage.removeItem(AUTH_PERSON_KEY);
  } catch {
    // ignore storage errors
  }
}

function mergeAuthPerson(
  base: AuthPerson,
  me: Partial<AuthMeResponse>,
): AuthMeResponse {
  const baseMe = base as AuthMeResponse;
  const readFocusRaw =
    me.readFocusPersonId ??
    baseMe.readFocusPersonId ??
    base.id;
  const readFocusPersonId =
    typeof readFocusRaw === 'string' ? Number(readFocusRaw) : readFocusRaw;

  return {
    id: me.id ?? base.id,
    fullName: me.fullName ?? base.fullName,
    nickname: me.nickname ?? base.nickname,
    gender: me.gender ?? base.gender,
    birthDate: me.birthDate ?? base.birthDate,
    status: me.status ?? base.status,
    photoUrl: me.photoUrl ?? base.photoUrl,
    isMarried: me.isMarried ?? base.isMarried,
    isLegal: me.isLegal ?? base.isLegal,
    spouseIds: me.spouseIds ?? base.spouseIds,
    role: me.role ?? base.role,
    isAdmin: me.isAdmin ?? base.isAdmin,
    familyId: me.familyId ?? baseMe.familyId ?? 0,
    readFocusPersonId: Number.isNaN(readFocusPersonId) ? base.id : readFocusPersonId,
    allowedFocusPersonIds:
      me.allowedFocusPersonIds ??
      baseMe.allowedFocusPersonIds ??
      [base.id, ...(base.spouseIds ?? [])],
    allowedFocusPersons:
      me.allowedFocusPersons ?? base.allowedFocusPersons ?? baseMe.allowedFocusPersons,
    accessVersion: me.accessVersion ?? baseMe.accessVersion,
    moduleStatuses: me.moduleStatuses ?? baseMe.moduleStatuses,
    secondaryPassword: me.secondaryPassword ?? baseMe.secondaryPassword,
  };
}

type AuthContextValue = {
  isAuthenticated: boolean;
  isInitializing: boolean;
  userId: number | null;
  person: AuthMeResponse | null;
  readFocusPersonId: number | null;
  /** Belum pernah set password kedua */
  mustSetupSecondaryPassword: boolean;
  /** Password kedua sudah diset */
  hasSecondaryPassword: boolean;
  login: (
    code: string,
    remember: boolean,
  ) => Promise<{ ok: true; personId: number } | { ok: false; message: string }>;
  logout: () => Promise<void>;
  refreshPerson: () => Promise<void>;
  setReadFocusPersonId: (personId: number) => Promise<void>;
  /** Update status secondary password di person state lokal */
  setSecondaryPasswordStatus: (
    status: NonNullable<AuthMeResponse['secondaryPassword']>,
  ) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isInitializing, setIsInitializing] = useState(true);
  const [person, setPerson] = useState<AuthMeResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const me = await bootstrapSession();
        if (!cancelled) {
          if (me) {
            const stored = readStoredAuthPerson();
            setPerson(stored ? mergeAuthPerson(stored, me) : me);
          } else {
            clearStoredAuthPerson();
            setPerson(null);
          }
        }
      } finally {
        if (!cancelled) {
          setIsInitializing(false);
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onSessionExpired = () => {
      clearModuleUnlockToken();
      clearStoredAuthPerson();
      setPerson(null);
      // Hard redirect — hindari state router kosong / blank setelah sesi mati
      const path = window.location.pathname;
      if (path !== appPaths.login && path !== appPaths.register) {
        window.location.replace(appPaths.login);
      }
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
    return () =>
      window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
  }, []);

  const login = useCallback(async (rawCode: string, remember: boolean) => {
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

    try {
      const data = await loginRequest(code, remember);

      try {
        const fullMe = await fetchMe();
        const merged = mergeAuthPerson(data.person, {
          ...fullMe,
          secondaryPassword:
            fullMe.secondaryPassword ?? data.secondaryPassword,
        });
        setPerson(merged);
        persistAuthPerson(merged);
      } catch {
        const fallback: AuthMeResponse = {
          ...data.person,
          familyId: 0,
          secondaryPassword: data.secondaryPassword,
        };
        setPerson(fallback);
        persistAuthPerson(fallback);
      }

      return { ok: true as const, personId: data.person.id };
    } catch (error) {
      return {
        ok: false as const,
        message: mapLoginError(error),
      };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await disableWebPush();
    } catch {
      // ignore push cleanup errors
    }
    await logoutRequest();
    clearModuleUnlockToken();
    clearStoredAuthPerson();
    setPerson(null);
  }, []);

  const setSecondaryPasswordStatus = useCallback(
    (status: NonNullable<AuthMeResponse['secondaryPassword']>) => {
      setPerson((prev) => {
        if (!prev) return prev;
        const merged: AuthMeResponse = {
          ...prev,
          secondaryPassword: status,
        };
        persistAuthPerson(merged);
        return merged;
      });
    },
    [],
  );

  const refreshPerson = useCallback(async () => {
    const me = await fetchMe();
    setPerson((prev) => {
      const merged = prev ? mergeAuthPerson(prev, me) : me;
      persistAuthPerson(merged);
      return merged;
    });
  }, []);

  const setReadFocusPersonId = useCallback(async (personId: number) => {
    const patchResult = await patchMeOption(
      'readFocusPersonId',
      String(personId),
    );

    let nextFocusId = personId;
    const fromPatch = patchResult.options?.readFocusPersonId;
    if (fromPatch != null) {
      const parsed = Number(fromPatch);
      if (!Number.isNaN(parsed)) nextFocusId = parsed;
    }

    setPerson((prev) => {
      if (!prev) return prev;
      const merged: AuthMeResponse = { ...prev, readFocusPersonId: nextFocusId };
      persistAuthPerson(merged);
      return merged;
    });

    try {
      const [me, options] = await Promise.all([fetchMe(), fetchMeOptions()]);
      const fromOptions = options.options?.readFocusPersonId;
      const resolvedFocusId =
        me.readFocusPersonId ??
        (fromOptions != null ? Number(fromOptions) : undefined) ??
        nextFocusId;

      setPerson((prev) => {
        if (!prev) {
          const merged = mergeAuthPerson(me, {
            ...me,
            readFocusPersonId: resolvedFocusId,
          });
          persistAuthPerson(merged);
          return merged;
        }
        const merged = mergeAuthPerson(prev, {
          ...me,
          readFocusPersonId: resolvedFocusId,
        });
        persistAuthPerson(merged);
        return merged;
      });
    } catch {
      // optimistic update from PATCH already applied
    }
  }, []);

  const readFocusPersonId = person?.readFocusPersonId ?? person?.id ?? null;
  const mustSetupSecondaryPassword =
    person?.secondaryPassword?.mustSetup === true;
  const hasSecondaryPassword = person?.secondaryPassword?.isSet === true;

  const value = useMemo(
    () => ({
      isAuthenticated: person != null,
      isInitializing,
      userId: person?.id ?? null,
      person,
      readFocusPersonId,
      mustSetupSecondaryPassword,
      hasSecondaryPassword,
      login,
      logout,
      refreshPerson,
      setReadFocusPersonId,
      setSecondaryPasswordStatus,
    }),
    [
      person,
      isInitializing,
      readFocusPersonId,
      mustSetupSecondaryPassword,
      hasSecondaryPassword,
      login,
      logout,
      refreshPerson,
      setReadFocusPersonId,
      setSecondaryPasswordStatus,
    ],
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
