import type {
  ApiError,
  ApiSuccess,
  AuthMeResponse,
  LoginResponse,
  RefreshResponse,
} from '@/shared/types/api';

const BASE =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1';

const ACCESS_TOKEN_KEY = 'familyroots_access_token';
const REFRESH_TOKEN_KEY = 'familyroots_refresh_token';
const SESSION_ID_KEY = 'familyroots_session_id';
const REMEMBER_KEY = 'familyroots_remember';

export class ApiClientError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
  }
}

function isApiError(body: unknown): body is ApiError {
  return (
    typeof body === 'object' &&
    body != null &&
    'error' in body &&
    typeof (body as ApiError).error?.code === 'string'
  );
}

function readRemember(): boolean {
  try {
    return localStorage.getItem(REMEMBER_KEY) === '1';
  } catch {
    return false;
  }
}

function readStoredAccessToken(): string | null {
  try {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

function readStoredRefreshToken(): string | null {
  try {
    return (
      localStorage.getItem(REFRESH_TOKEN_KEY) ??
      sessionStorage.getItem(REFRESH_TOKEN_KEY)
    );
  } catch {
    return null;
  }
}

export function persistTokens(
  accessToken: string,
  refreshToken: string,
  remember: boolean,
) {
  try {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);

    const refreshStorage = remember ? localStorage : sessionStorage;
    const otherRefreshStorage = remember ? sessionStorage : localStorage;

    refreshStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    otherRefreshStorage.removeItem(REFRESH_TOKEN_KEY);

    if (remember) {
      localStorage.setItem(REMEMBER_KEY, '1');
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

function readStoredSessionId(): string | null {
  try {
    return (
      sessionStorage.getItem(SESSION_ID_KEY) ??
      localStorage.getItem(SESSION_ID_KEY)
    );
  } catch {
    return null;
  }
}

function persistSessionId(sessionId: string | null | undefined, remember: boolean) {
  try {
    if (!sessionId) {
      sessionStorage.removeItem(SESSION_ID_KEY);
      localStorage.removeItem(SESSION_ID_KEY);
      return;
    }
    const storage = remember ? localStorage : sessionStorage;
    const other = remember ? sessionStorage : localStorage;
    storage.setItem(SESSION_ID_KEY, sessionId);
    other.removeItem(SESSION_ID_KEY);
  } catch {
    // ignore storage errors
  }
}

export function clearStoredTokens() {
  try {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(SESSION_ID_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(SESSION_ID_KEY);
    localStorage.removeItem(REMEMBER_KEY);
  } catch {
    // ignore storage errors
  }
}

let accessToken: string | null = readStoredAccessToken();
let refreshToken: string | null = readStoredRefreshToken();
let sessionId: string | null = readStoredSessionId();
let moduleUnlockToken: string | null = null;
let moduleUnlockExpiresAt = 0;
/** Saat bootstrap, jangan fire event redirect — AuthContext yang handle. */
let suppressSessionExpiredEvent = false;

export const SECONDARY_UNLOCK_REQUIRED_EVENT =
  'familyroots:secondary-unlock-required';

/** Token access/refresh tidak valid — AuthContext harus clear person + arahkan ke login. */
export const SESSION_EXPIRED_EVENT = 'familyroots:session-expired';

export function getAccessToken(): string | null {
  return accessToken;
}

export function getRefreshToken(): string | null {
  return refreshToken;
}

export function getSessionId(): string | null {
  return sessionId;
}

export function setTokens(access: string | null, refresh: string | null) {
  accessToken = access;
  refreshToken = refresh;
}

export function setModuleUnlockToken(token: string, expiresInSeconds: number) {
  moduleUnlockToken = token;
  // skew 5s supaya tidak kirim token hampir expired
  moduleUnlockExpiresAt = Date.now() + Math.max(0, expiresInSeconds) * 1000 - 5000;
}

export function clearModuleUnlockToken() {
  moduleUnlockToken = null;
  moduleUnlockExpiresAt = 0;
}

export function getModuleUnlockToken(): string | null {
  if (!moduleUnlockToken) return null;
  if (Date.now() >= moduleUnlockExpiresAt) {
    clearModuleUnlockToken();
    return null;
  }
  return moduleUnlockToken;
}

export function hasValidModuleUnlock(): boolean {
  return getModuleUnlockToken() != null;
}

function needsModuleUnlockHeader(path: string): boolean {
  const p = path.split('?')[0] ?? path;
  return (
    p.startsWith('/admin') ||
    p.startsWith('/money') ||
    p.startsWith('/household')
  );
}

function applySessionIdFromAuth(next?: string | number | null) {
  if (next == null || next === '') return;
  sessionId = String(next);
  persistSessionId(sessionId, readRemember());
}

function notifySecondaryUnlockRequired() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(SECONDARY_UNLOCK_REQUIRED_EVENT));
  }
}

function notifySessionExpired() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  }
}

/** Hapus token lokal + beri tahu UI untuk kembali ke login. */
export function invalidateLocalSession(options?: { silent?: boolean }) {
  const hadSession = accessToken != null || refreshToken != null;
  accessToken = null;
  refreshToken = null;
  sessionId = null;
  clearModuleUnlockToken();
  clearStoredTokens();
  if (
    hadSession &&
    !options?.silent &&
    !suppressSessionExpiredEvent
  ) {
    notifySessionExpired();
  }
}

/** Coba refresh setelah 401. Hanya invalidate jika refresh gagal / tidak ada refresh token. */
async function recoverFromUnauthorized(retry: boolean): Promise<boolean> {
  if (!retry) {
    // Sudah pernah refresh + retry; 401 kedua bisa jadi error bisnis
    // (mis. password kedua salah) — jangan anggap sesi mati.
    return false;
  }

  if (refreshToken) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return true;
    invalidateLocalSession();
    return false;
  }

  if (accessToken) {
    invalidateLocalSession();
  }
  return false;
}

function handleSecondaryUnlockError(error: unknown) {
  if (
    error instanceof ApiClientError &&
    (error.code === 'SECONDARY_UNLOCK_REQUIRED' ||
      error.code === 'SECONDARY_UNLOCK_INVALID')
  ) {
    clearModuleUnlockToken();
    notifySecondaryUnlockRequired();
  }
}

async function parseResponse<T>(res: Response): Promise<T> {
  const body: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    if (isApiError(body)) {
      throw new ApiClientError(body.error.code, body.error.message);
    }
    if (
      typeof body === 'object' &&
      body != null &&
      'statusCode' in body &&
      (body as { statusCode?: number }).statusCode === 404
    ) {
      const nestMessage = (body as { message?: unknown }).message;
      throw new ApiClientError(
        'NOT_FOUND',
        typeof nestMessage === 'string' ? nestMessage : 'Not found',
      );
    }
    throw new ApiClientError(
      'INTERNAL_ERROR',
      'Terjadi kesalahan. Coba lagi nanti.',
    );
  }

  if (
    typeof body === 'object' &&
    body != null &&
    'data' in body &&
    (body as ApiSuccess<T>).data !== undefined
  ) {
    return (body as ApiSuccess<T>).data;
  }

  throw new ApiClientError(
    'INTERNAL_ERROR',
    'Respons server tidak valid.',
  );
}

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return false;

    const data = await parseResponse<RefreshResponse>(res);
    accessToken = data.accessToken;
    refreshToken = data.refreshToken;
    persistTokens(data.accessToken, data.refreshToken, readRemember());
    applySessionIdFromAuth(data.sessionId);
    return true;
  } catch {
    return false;
  }
}

function withAuthHeaders(
  path: string,
  initHeaders?: HeadersInit,
  hasBody = false,
): Headers {
  const headers = new Headers(initHeaders);
  if (hasBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  if (sessionId) {
    headers.set('X-Session-Id', sessionId);
  }
  if (needsModuleUnlockHeader(path)) {
    const unlock = getModuleUnlockToken();
    if (unlock) {
      headers.set('X-Module-Unlock', unlock);
    }
  }
  return headers;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<T> {
  const headers = withAuthHeaders(path, init.headers, init.body != null);

  const res = await fetch(`${BASE}${path}`, { ...init, headers });

  if (res.status === 401) {
    const recovered = await recoverFromUnauthorized(retry);
    if (recovered) {
      return apiFetch<T>(path, init, false);
    }
  }

  try {
    return await parseResponse<T>(res);
  } catch (error) {
    handleSecondaryUnlockError(error);
    throw error;
  }
}

/** Multipart upload — do not set Content-Type (browser sets boundary). */
export async function apiFormFetch<T>(
  path: string,
  body: FormData,
  retry = true,
): Promise<T> {
  const headers = withAuthHeaders(path);

  const res = await fetch(`${BASE}${path}`, { method: 'POST', headers, body });

  if (res.status === 401) {
    const recovered = await recoverFromUnauthorized(retry);
    if (recovered) {
      return apiFormFetch<T>(path, body, false);
    }
  }

  if (res.status === 204) {
    return undefined as T;
  }

  try {
    return await parseResponse<T>(res);
  } catch (error) {
    handleSecondaryUnlockError(error);
    throw error;
  }
}

/** Binary/text download (e.g. CSV template) — not JSON-wrapped. */
export async function apiBlobFetch(
  path: string,
  retry = true,
): Promise<{ blob: Blob; filename: string | null }> {
  const headers = withAuthHeaders(path);

  const res = await fetch(`${BASE}${path}`, { headers });

  if (res.status === 401) {
    const recovered = await recoverFromUnauthorized(retry);
    if (recovered) {
      return apiBlobFetch(path, false);
    }
  }

  if (!res.ok) {
    const body: unknown = await res.json().catch(() => null);
    if (isApiError(body)) {
      const err = new ApiClientError(body.error.code, body.error.message);
      handleSecondaryUnlockError(err);
      throw err;
    }
    throw new ApiClientError(
      'INTERNAL_ERROR',
      'Terjadi kesalahan. Coba lagi nanti.',
    );
  }

  const disposition = res.headers.get('Content-Disposition');
  const filenameMatch = disposition?.match(/filename\*?=(?:UTF-8''|")?([^\";]+)/i);
  const filename = filenameMatch?.[1]
    ? decodeURIComponent(filenameMatch[1].replace(/"/g, ''))
    : null;

  return { blob: await res.blob(), filename };
}

export async function loginRequest(
  code: string,
  remember: boolean,
): Promise<LoginResponse> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, remember }),
  });

  const data = await parseResponse<LoginResponse>(res);

  accessToken = data.accessToken;
  refreshToken = data.refreshToken;
  persistTokens(data.accessToken, data.refreshToken, remember);
  applySessionIdFromAuth(data.sessionId);

  return data;
}

export async function fetchMe(): Promise<AuthMeResponse> {
  return apiFetch<AuthMeResponse>('/auth/me');
}

export async function logoutRequest(): Promise<void> {
  const token = refreshToken;

  try {
    await apiFetch<{ loggedOut: boolean }>(
      '/auth/logout',
      {
        method: 'POST',
        body: JSON.stringify({ refreshToken: token ?? undefined }),
      },
      false,
    );
  } catch {
    // Clear local session even if API call fails
  } finally {
    accessToken = null;
    refreshToken = null;
    sessionId = null;
    clearModuleUnlockToken();
    clearStoredTokens();
  }
}

export async function bootstrapSession(): Promise<AuthMeResponse | null> {
  accessToken = readStoredAccessToken();
  refreshToken = readStoredRefreshToken();
  sessionId = readStoredSessionId();
  // unlock token sengaja memory-only — refresh tab = harus verify lagi

  if (!accessToken && !refreshToken) {
    return null;
  }

  const BOOTSTRAP_TIMEOUT_MS = 12_000;
  suppressSessionExpiredEvent = true;

  try {
    const me = await Promise.race([
      (async () => {
        if (accessToken) {
          return await fetchMe();
        }

        const refreshed = await refreshAccessToken();
        if (!refreshed) {
          invalidateLocalSession({ silent: true });
          return null;
        }

        return await fetchMe();
      })(),
      new Promise<null>((resolve) => {
        globalThis.setTimeout(() => resolve(null), BOOTSTRAP_TIMEOUT_MS);
      }),
    ]);

    if (me == null && (getAccessToken() || getRefreshToken())) {
      invalidateLocalSession({ silent: true });
      return null;
    }

    return me;
  } catch {
    invalidateLocalSession({ silent: true });
    return null;
  } finally {
    suppressSessionExpiredEvent = false;
  }
}

export function mapLoginError(error: unknown): string {
  if (error instanceof ApiClientError) {
    return error.message;
  }

  if (error instanceof TypeError) {
    return 'Tidak dapat terhubung ke server. Pastikan backend sudah berjalan.';
  }

  return 'Terjadi kesalahan. Coba lagi nanti.';
}
