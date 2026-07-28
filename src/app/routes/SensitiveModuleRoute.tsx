import { useEffect, useState } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { hasValidModuleUnlock } from '@/shared/lib/apiClient';
import { useAuth } from '@/shared/context/AuthContext';
import { useSecondaryPasswordGate } from '@/shared/context/SecondaryPasswordGateContext';
import { appPaths } from '@/shared/routes';

function GateLoading({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-500">
      {label}
    </div>
  );
}

/** Gate Admin / Money / Household — setup atau verify password kedua. */
export function SensitiveModuleRoute() {
  const { isAuthenticated, isInitializing } = useAuth();
  const { ensureUnlocked } = useSecondaryPasswordGate();
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState(() => hasValidModuleUnlock());
  const [checking, setChecking] = useState(() => !hasValidModuleUnlock());

  useEffect(() => {
    if (isInitializing || !isAuthenticated) return;
    if (hasValidModuleUnlock()) {
      setAllowed(true);
      setChecking(false);
      return;
    }

    let cancelled = false;
    setChecking(true);
    void ensureUnlocked().then((ok) => {
      if (cancelled) return;
      if (ok) {
        setAllowed(true);
        setChecking(false);
      } else {
        navigate(appPaths.launcher, { replace: true });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isInitializing, isAuthenticated, ensureUnlocked, navigate]);

  if (isInitializing) return <GateLoading label="Memuat sesi…" />;
  if (!isAuthenticated) {
    return <Navigate to={appPaths.login} replace />;
  }
  if (checking || !allowed) {
    return <GateLoading label="Memverifikasi akses…" />;
  }

  return <Outlet />;
}
