import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { LauncherPage } from '@/app/launcher/LauncherPage';
import { authRoutes } from '@/app/auth/routes';
import { ProtectedRoute, PublicRoute } from '@/app/routes/guards';
import { legacyRedirectRoutes } from '@/app/routes/legacy';
import { familyCoreRoutes } from '@/modules/family-core/routes';
import { familyRootsRoutes } from '@/modules/family-roots/routes';
import { householdRoutes } from '@/modules/household/routes';
import { moneyTrackRoutes } from '@/modules/money-track/routes';
import { AuthProvider } from '@/shared/context/AuthContext';
import { DataSourceProvider } from '@/shared/context/DataSourceContext';
import { appPaths } from '@/shared/routes';

const router = createBrowserRouter([
  {
    element: <ProtectedRoute />,
    children: [
      { path: appPaths.launcher, element: <LauncherPage /> },
      ...familyRootsRoutes,
      ...familyCoreRoutes,
      ...moneyTrackRoutes,
      ...householdRoutes,
      ...legacyRedirectRoutes,
    ],
  },
  {
    element: <PublicRoute />,
    children: authRoutes,
  },
]);

export function AppRouter() {
  return (
    <AuthProvider>
      <DataSourceProvider>
        <RouterProvider router={router} />
      </DataSourceProvider>
    </AuthProvider>
  );
}
