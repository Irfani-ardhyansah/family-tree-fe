/** App runtime mode from `.env` — independent of Vite's `MODE`/`DEV`. */
export type AppEnv = 'development' | 'production';

export function getAppEnv(): AppEnv {
  const raw = (import.meta.env.VITE_APP_ENV ?? 'production').toLowerCase();
  return raw === 'development' ? 'development' : 'production';
}

export function isDevelopmentApp(): boolean {
  return getAppEnv() === 'development';
}
