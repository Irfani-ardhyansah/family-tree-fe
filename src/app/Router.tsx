import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { LauncherPage } from '@/app/launcher/LauncherPage';
import { authRoutes } from '@/app/auth/routes';
import { ProtectedRoute, PublicRoute } from '@/app/routes/guards';
import { legacyRedirectRoutes } from '@/app/routes/legacy';
import { adminRoutes } from '@/modules/admin/routes';
import { familyCoreRoutes } from '@/modules/family-core/routes';
import { familyRootsRoutes } from '@/modules/family-roots/routes';
import { householdRoutes } from '@/modules/household/routes';
import { moneyTrackRoutes } from '@/modules/money-track/routes';
import { AuthProvider } from '@/shared/context/AuthContext';
import { DataSourceProvider } from '@/shared/context/DataSourceContext';
import { SecondaryPasswordGateProvider } from '@/shared/context/SecondaryPasswordGateContext';
import { getRouterBasename } from '@/shared/lib/basePath';
import { appPaths } from '@/shared/routes';

const router = createBrowserRouter(
  [
    {
      element: <ProtectedRoute />,
      children: [
        { path: appPaths.launcher, element: <LauncherPage /> },
        {
          path: appPaths.inbox,
          element: (
            <Navigate to={`${appPaths.launcher}?notifications=1`} replace />
          ),
        },
        ...familyRootsRoutes,
        ...familyCoreRoutes,
        ...moneyTrackRoutes,
        ...householdRoutes,
        ...adminRoutes,
        ...legacyRedirectRoutes,
        { path: '*', element: <Navigate to={appPaths.launcher} replace /> },
      ],
    },
    {
      element: <PublicRoute />,
      children: authRoutes,
    },
  ],
  { basename: getRouterBasename() },
);

export function AppRouter() {
  return (
    <AuthProvider>
      <SecondaryPasswordGateProvider>
        <DataSourceProvider>
          <RouterProvider router={router} />
        </DataSourceProvider>
      </SecondaryPasswordGateProvider>
    </AuthProvider>
  );
}
