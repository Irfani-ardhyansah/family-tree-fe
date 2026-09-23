const BIOMETRIC_LOGIN_KEY = 'fr_biometric_login';

/** Penanda non-rahasia: browser ini sudah pernah berhasil mendaftarkan perangkat. */
export function hasBiometricLoginMarker(): boolean {
  try {
    return localStorage.getItem(BIOMETRIC_LOGIN_KEY) === '1';
  } catch {
    return false;
  }
}

export function setBiometricLoginMarker() {
  try {
    localStorage.setItem(BIOMETRIC_LOGIN_KEY, '1');
  } catch {
    // ignore storage errors
  }
}

export function clearBiometricLoginMarker() {
  try {
    localStorage.removeItem(BIOMETRIC_LOGIN_KEY);
  } catch {
    // ignore storage errors
  }
}

export function isBiometricModuleEnabled(
  statuses: { moduleId: string; enabled: boolean }[] | undefined,
): boolean {
  return (statuses ?? []).some(
    (item) => item.moduleId === 'biometric' && item.enabled,
  );
}
