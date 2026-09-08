import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { CheckCircle, AlertCircle, X } from 'react-feather';

type ToastKind = 'success' | 'error';

type ToastItem = {
  id: string;
  kind: ToastKind;
  message: string;
};

type AdminToastContextValue = {
  pushToast: (kind: ToastKind, message: string) => void;
};

const AdminToastContext = createContext<AdminToastContextValue | null>(null);

export function AdminToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const pushToast = useCallback((kind: ToastKind, message: string) => {
    const id = Math.random().toString(36).slice(2);
    setItems((prev) => [...prev, { id, kind, message }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <AdminToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(100%-2rem,22rem)] flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-2.5 rounded-2xl border px-3.5 py-3 shadow-lg backdrop-blur-md animate-[adminSlideIn_0.28s_ease-out] ${
              t.kind === 'success'
                ? 'border-admin-200 bg-suite-surface/95 text-suite-ink dark:border-admin-500/40'
                : 'border-rose-200 bg-suite-surface/95 text-suite-ink dark:border-rose-500/40'
            }`}
          >
            {t.kind === 'success' ? (
              <CheckCircle size={18} className="mt-0.5 shrink-0 text-admin-600 dark:text-admin-300" />
            ) : (
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-500 dark:text-rose-300" />
            )}
            <p className="flex-1 text-sm font-medium leading-snug">{t.message}</p>
            <button
              type="button"
              onClick={() =>
                setItems((prev) => prev.filter((x) => x.id !== t.id))
              }
              className="rounded-lg p-1 text-suite-faint hover:bg-suite-soft hover:text-suite-ink"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes adminSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </AdminToastContext.Provider>
  );
}

export function useAdminToast() {
  const ctx = useContext(AdminToastContext);
  if (!ctx) {
    throw new Error('useAdminToast must be used within AdminToastProvider');
  }
  return ctx;
}
