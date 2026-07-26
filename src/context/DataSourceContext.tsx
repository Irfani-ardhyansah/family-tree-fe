import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { isDevelopmentApp } from '@/lib/appEnv';

export type DataSource = 'api' | 'mock';

const STORAGE_KEY = 'familyroots_data_source';

function readStoredSource(): DataSource {
  // Production selalu API — abaikan preferensi mock di storage.
  if (!isDevelopmentApp()) return 'api';

  try {
    const value = sessionStorage.getItem(STORAGE_KEY);
    return value === 'mock' ? 'mock' : 'api';
  } catch {
    return 'api';
  }
}

type DataSourceContextValue = {
  source: DataSource;
  setSource: (source: DataSource) => void;
  isApi: boolean;
  isMock: boolean;
  /** True only when VITE_APP_ENV=development */
  canUseMock: boolean;
};

const DataSourceContext = createContext<DataSourceContextValue | null>(null);

export function DataSourceProvider({ children }: { children: ReactNode }) {
  const canUseMock = isDevelopmentApp();
  const [source, setSourceState] = useState<DataSource>(readStoredSource);

  const setSource = useCallback(
    (next: DataSource) => {
      const resolved = canUseMock ? next : 'api';
      setSourceState(resolved);
      if (!canUseMock) return;
      try {
        sessionStorage.setItem(STORAGE_KEY, resolved);
      } catch {
        // ignore storage errors
      }
    },
    [canUseMock],
  );

  const value = useMemo(
    () => ({
      source: canUseMock ? source : 'api',
      setSource,
      isApi: (canUseMock ? source : 'api') === 'api',
      isMock: canUseMock && source === 'mock',
      canUseMock,
    }),
    [source, setSource, canUseMock],
  );

  return (
    <DataSourceContext.Provider value={value}>
      {children}
    </DataSourceContext.Provider>
  );
}

export function useDataSource() {
  const ctx = useContext(DataSourceContext);
  if (!ctx) {
    throw new Error('useDataSource must be used within DataSourceProvider');
  }
  return ctx;
}
