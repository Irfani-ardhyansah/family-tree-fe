import { ApiClientError } from '@/shared/lib/apiClient';

const CLEAR_MARKER_CODES = new Set([
  'BIOMETRIC_CREDENTIAL_NOT_FOUND',
  'BIOMETRIC_CREDENTIAL_DISABLED',
  'BIOMETRIC_DISABLED',
]);

function errorName(error: unknown): string | null {
  if (error instanceof Error && error.name) return error.name;
  return null;
}

export function shouldClearBiometricMarker(error: unknown): boolean {
  return error instanceof ApiClientError && CLEAR_MARKER_CODES.has(error.code);
}

/** Route belum ada (BE belum live), bukan BIOMETRIC_CREDENTIAL_NOT_FOUND. */
export function isBiometricRouteMissing(error: unknown): boolean {
  return error instanceof ApiClientError && error.code === 'NOT_FOUND';
}

export function isBiometricCancelled(error: unknown): boolean {
  const name = errorName(error);
  return name === 'NotAllowedError' || name === 'AbortError';
}

export function isBiometricUnsupported(error: unknown): boolean {
  const name = errorName(error);
  return name === 'NotSupportedError' || name === 'SecurityError';
}

export function isBiometricChallengeExpired(error: unknown): boolean {
  return (
    error instanceof ApiClientError && error.code === 'BIOMETRIC_CHALLENGE_EXPIRED'
  );
}

export function mapBiometricMessage(error: unknown): string {
  if (isBiometricCancelled(error)) return 'Dibatalkan.';

  const name = errorName(error);
  if (name === 'InvalidStateError') return 'Perangkat ini sudah terdaftar.';

  if (error instanceof ApiClientError) {
    switch (error.code) {
      case 'BIOMETRIC_VERIFICATION_FAILED':
        return 'Verifikasi gagal. Coba lagi, atau masuk dengan kode keluarga.';
      case 'BIOMETRIC_CREDENTIAL_NOT_FOUND':
        return 'Belum ada biometrik di perangkat ini. Masuk dengan kode keluarga.';
      case 'BIOMETRIC_CREDENTIAL_DISABLED':
        return 'Perangkat ini dinonaktifkan admin. Masuk dengan kode keluarga.';
      case 'BIOMETRIC_CREDENTIAL_EXISTS':
        return 'Perangkat ini sudah terdaftar.';
      case 'BIOMETRIC_LIMIT_REACHED':
        return 'Maksimal 2 perangkat. Hapus satu perangkat dulu.';
      case 'BIOMETRIC_DISABLED':
        return 'Login biometrik dimatikan admin.';
      case 'BIOMETRIC_CHALLENGE_EXPIRED':
        return 'Verifikasi kedaluwarsa. Coba lagi.';
      case 'VALIDATION_ERROR':
        return error.message;
      default:
        return error.message || 'Terjadi kesalahan. Coba lagi nanti.';
    }
  }

  if (error instanceof TypeError) {
    return 'Tidak dapat terhubung ke server. Pastikan backend sudah berjalan.';
  }

  return 'Terjadi kesalahan. Coba lagi nanti.';
}
