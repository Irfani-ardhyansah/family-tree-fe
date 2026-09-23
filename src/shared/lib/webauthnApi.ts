import {
  startAuthentication,
  startRegistration,
  type AuthenticationResponseJSON,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
  type RegistrationResponseJSON,
} from '@simplewebauthn/browser';
import type { LoginResponse } from '@/shared/types/api';
import type { SecondaryVerifyResult } from '@/shared/lib/secondaryPasswordApi';
import {
  apiFetch,
  commitAuthSession,
  publicJsonFetch,
  setModuleUnlockToken,
} from '@/shared/lib/apiClient';
import { isBiometricChallengeExpired } from '@/shared/lib/webauthnErrors';

export type WebAuthnCredential = {
  id: number;
  label: string;
  enabled: boolean;
  createdAt: string;
  lastUsedAt: string | null;
};

export type AdminWebAuthnCredential = WebAuthnCredential & {
  personId: number;
  personName: string;
};

async function withFreshChallenge<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (!isBiometricChallengeExpired(error)) throw error;
    return run();
  }
}

export async function loginWithWebAuthn(remember: boolean): Promise<LoginResponse> {
  const data = await withFreshChallenge(async () => {
    const optionsJSON = await publicJsonFetch<PublicKeyCredentialRequestOptionsJSON>(
      '/auth/webauthn/login/options',
      {},
    );
    const assertion: AuthenticationResponseJSON = await startAuthentication({
      optionsJSON,
    });
    return publicJsonFetch<LoginResponse>('/auth/webauthn/login/verify', {
      ...assertion,
      remember,
    });
  });
  commitAuthSession(data, remember);
  return data;
}

export async function unlockWithWebAuthn(): Promise<SecondaryVerifyResult> {
  const data = await withFreshChallenge(async () => {
    const optionsJSON = await apiFetch<PublicKeyCredentialRequestOptionsJSON>(
      '/auth/webauthn/unlock/options',
      { method: 'POST', body: JSON.stringify({}) },
    );
    const assertion: AuthenticationResponseJSON = await startAuthentication({
      optionsJSON,
    });
    return apiFetch<SecondaryVerifyResult>('/auth/webauthn/unlock/verify', {
      method: 'POST',
      body: JSON.stringify(assertion),
    });
  });
  setModuleUnlockToken(data.unlockToken, data.expiresIn);
  return data;
}

export async function registerWebAuthnCredential(
  label: string,
): Promise<WebAuthnCredential> {
  return withFreshChallenge(async () => {
    const optionsJSON = await apiFetch<PublicKeyCredentialCreationOptionsJSON>(
      '/auth/webauthn/register/options',
      { method: 'POST', body: JSON.stringify({}) },
    );
    const credential: RegistrationResponseJSON = await startRegistration({
      optionsJSON,
    });
    return apiFetch<WebAuthnCredential>('/auth/webauthn/register/verify', {
      method: 'POST',
      body: JSON.stringify({ ...credential, label }),
    });
  });
}

export async function fetchMyWebAuthnCredentials(): Promise<WebAuthnCredential[]> {
  const data = await apiFetch<{ items: WebAuthnCredential[] }>(
    '/auth/webauthn/credentials',
  );
  return data.items ?? [];
}

export async function updateMyWebAuthnLabel(
  id: number,
  label: string,
): Promise<WebAuthnCredential> {
  return apiFetch<WebAuthnCredential>(`/auth/webauthn/credentials/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ label }),
  });
}

export async function deleteMyWebAuthnCredential(id: number): Promise<void> {
  await apiFetch<{ deleted: boolean }>(`/auth/webauthn/credentials/${id}`, {
    method: 'DELETE',
  });
}

export async function fetchAdminWebAuthnCredentials(): Promise<
  AdminWebAuthnCredential[]
> {
  const data = await apiFetch<{ items: AdminWebAuthnCredential[] }>(
    '/admin/biometric/credentials',
  );
  return data.items ?? [];
}

export async function updateAdminWebAuthnCredential(
  id: number,
  patch: { label: string } | { enabled: boolean },
): Promise<AdminWebAuthnCredential> {
  return apiFetch<AdminWebAuthnCredential>(`/admin/biometric/credentials/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export async function deleteAdminWebAuthnCredential(id: number): Promise<void> {
  await apiFetch<{ deleted: boolean }>(`/admin/biometric/credentials/${id}`, {
    method: 'DELETE',
  });
}
