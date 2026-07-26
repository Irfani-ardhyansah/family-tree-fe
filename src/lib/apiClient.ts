import type {
  ApiError,
  ApiSuccess,
  AuthMeResponse,
  LoginResponse,
  RefreshResponse,
} from '@/types/api';

const BASE =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1';

const ACCESS_TOKEN_KEY = 'familyroots_access_token';
const REFRESH_TOKEN_KEY = 'familyroots_refresh_token';
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

export function clearStoredTokens() {
  try {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(REMEMBER_KEY);
  } catch {
    // ignore storage errors
  }
}

let accessToken: string | null = readStoredAccessToken();
let refreshToken: string | null = readStoredRefreshToken();

export function getAccessToken(): string | null {
  return accessToken;
}

export function getRefreshToken(): string | null {
  return refreshToken;
}

export function setTokens(access: string | null, refresh: string | null) {
  accessToken = access;
  refreshToken = refresh;
}

async function parseResponse<T>(res: Response): Promise<T> {
  const body: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    if (isApiError(body)) {
      throw new ApiClientError(body.error.code, body.error.message);
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
    return true;
  } catch {
    return false;
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body != null) {
    headers.set('Content-Type', 'application/json');
  }
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const res = await fetch(`${BASE}${path}`, { ...init, headers });

  if (res.status === 401 && retry && refreshToken) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiFetch<T>(path, init, false);
    }
  }

  return parseResponse<T>(res);
}

/** Multipart upload — do not set Content-Type (browser sets boundary). */
export async function apiFormFetch<T>(
  path: string,
  body: FormData,
  retry = true,
): Promise<T> {
  const headers = new Headers();
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const res = await fetch(`${BASE}${path}`, { method: 'POST', headers, body });

  if (res.status === 401 && retry && refreshToken) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiFormFetch<T>(path, body, false);
    }
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return parseResponse<T>(res);
}

/** Binary/text download (e.g. CSV template) — not JSON-wrapped. */
export async function apiBlobFetch(
  path: string,
  retry = true,
): Promise<{ blob: Blob; filename: string | null }> {
  const headers = new Headers();
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const res = await fetch(`${BASE}${path}`, { headers });

  if (res.status === 401 && retry && refreshToken) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiBlobFetch(path, false);
    }
  }

  if (!res.ok) {
    const body: unknown = await res.json().catch(() => null);
    if (isApiError(body)) {
      throw new ApiClientError(body.error.code, body.error.message);
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
    clearStoredTokens();
  }
}

export async function bootstrapSession(): Promise<AuthMeResponse | null> {
  accessToken = readStoredAccessToken();
  refreshToken = readStoredRefreshToken();

  if (!accessToken && !refreshToken) {
    return null;
  }

  try {
    if (accessToken) {
      return await fetchMe();
    }

    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      accessToken = null;
      refreshToken = null;
      clearStoredTokens();
      return null;
    }

    return await fetchMe();
  } catch {
    accessToken = null;
    refreshToken = null;
    clearStoredTokens();
    return null;
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
