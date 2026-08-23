import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { MoneyModuleEntrySkeleton } from '@/modules/money-track/components/MoneySkeleton';
import { hasValidModuleUnlock } from '@/shared/lib/apiClient';
import { useAuth } from '@/shared/context/AuthContext';
import { useSecondaryPasswordGate } from '@/shared/context/SecondaryPasswordGateContext';
import { appPaths, moneyPaths } from '@/shared/routes';

function GateLoading({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-suite-bg px-4 text-suite-muted">
      <div className="h-10 w-10 animate-pulse rounded-[12px] bg-sky-200/80" />
      <div className="h-3 w-40 animate-pulse rounded bg-slate-200/90" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

/** Gate Admin / Core / Money / Household — setup atau verify password kedua. */
export function SensitiveModuleRoute() {
  const { isAuthenticated, isInitializing } = useAuth();
  const { ensureUnlocked } = useSecondaryPasswordGate();
  const navigate = useNavigate();
  const location = useLocation();
  const isMoneyModule =
    location.pathname === moneyPaths.home ||
    location.pathname.startsWith(`${moneyPaths.home}/`);
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

  if (isInitializing) {
    return isMoneyModule ? (
      <MoneyModuleEntrySkeleton />
    ) : (
      <GateLoading label="Memuat sesi…" />
    );
  }
  if (!isAuthenticated) {
    return <Navigate to={appPaths.login} replace />;
  }
  if (checking || !allowed) {
    return isMoneyModule ? (
      <MoneyModuleEntrySkeleton />
    ) : (
      <GateLoading label="Memverifikasi akses…" />
    );
  }

  return <Outlet />;
}
