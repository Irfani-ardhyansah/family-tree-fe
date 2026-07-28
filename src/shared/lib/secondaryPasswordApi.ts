import { apiFetch, setModuleUnlockToken } from '@/shared/lib/apiClient';
import type { SecondaryPasswordStatus, SensitiveModuleId } from '@/shared/types/api';

export type SecondarySetupResult = {
  secondaryPassword: SecondaryPasswordStatus;
  unlockToken: string;
  expiresIn: number;
};

export type SecondaryVerifyResult = {
  unlockToken: string;
  expiresIn: number;
  modules: SensitiveModuleId[];
};

function applyUnlock(unlockToken: string, expiresIn: number) {
  setModuleUnlockToken(unlockToken, expiresIn);
}

export async function setupSecondaryPassword(
  password: string,
  confirmPassword: string,
): Promise<SecondarySetupResult> {
  const data = await apiFetch<SecondarySetupResult>(
    '/auth/secondary-password/setup',
    {
      method: 'POST',
      body: JSON.stringify({ password, confirmPassword }),
    },
  );
  applyUnlock(data.unlockToken, data.expiresIn);
  return data;
}

export async function verifySecondaryPassword(
  password: string,
): Promise<SecondaryVerifyResult> {
  const data = await apiFetch<SecondaryVerifyResult>(
    '/auth/secondary-password/verify',
    {
      method: 'POST',
      body: JSON.stringify({ password }),
    },
  );
  applyUnlock(data.unlockToken, data.expiresIn);
  return data;
}

export async function changeSecondaryPassword(input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<{ secondaryPassword: SecondaryPasswordStatus }> {
  return apiFetch('/auth/secondary-password/change', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function validateSecondaryPasswordInput(
  password: string,
  confirmPassword?: string,
): string | null {
  const trimmed = password.trim();
  if (trimmed.length < 6 || trimmed.length > 72) {
    return 'Password harus 6–72 karakter.';
  }
  if (confirmPassword != null && trimmed !== confirmPassword.trim()) {
    return 'Konfirmasi password tidak cocok.';
  }
  return null;
}
