import { Navigate, Outlet } from 'react-router-dom';
import { AuthLayout } from '@/shared/components/layouts/AuthLayout';
import { useAuth } from '@/shared/context/AuthContext';
import { useIsAdmin } from '@/shared/hooks/useIsAdmin';
import { appPaths } from '@/shared/routes';

function SessionLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-500">
      Memuat sesi…
    </div>
  );
}

export function ProtectedRoute() {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) return <SessionLoading />;
  if (!isAuthenticated) {
    return <Navigate to={appPaths.login} replace />;
  }

  return <Outlet />;
}

export function PublicRoute() {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) return <SessionLoading />;
  if (isAuthenticated) {
    return <Navigate to={appPaths.launcher} replace />;
  }

  return (
    <AuthLayout>
      <Outlet />
    </AuthLayout>
  );
}

export function AdminRoute() {
  const { isInitializing } = useAuth();
  const isAdmin = useIsAdmin();

  if (isInitializing) return <SessionLoading />;
  if (!isAdmin) {
    return <Navigate to={appPaths.launcher} replace />;
  }

  return <Outlet />;
}
