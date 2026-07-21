import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type DataSource = 'api' | 'mock';

const STORAGE_KEY = 'familyroots_data_source';

function readStoredSource(): DataSource {
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
};

const DataSourceContext = createContext<DataSourceContextValue | null>(null);

export function DataSourceProvider({ children }: { children: ReactNode }) {
  const [source, setSourceState] = useState<DataSource>(readStoredSource);

  const setSource = useCallback((next: DataSource) => {
    setSourceState(next);
    try {
      sessionStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore storage errors
    }
  }, []);

  const value = useMemo(
    () => ({
      source,
      setSource,
      isApi: source === 'api',
      isMock: source === 'mock',
    }),
    [source, setSource],
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
