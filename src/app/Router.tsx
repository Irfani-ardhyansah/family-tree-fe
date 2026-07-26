import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Outlet,
  useParams,
} from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { MainLayout } from '@/shared/components/layouts/MainLayout';
import { AuthLayout } from '@/shared/components/layouts/AuthLayout';
import { ModuleShellLayout } from '@/app/layouts/ModuleShellLayout';
import { LauncherPage } from '@/app/launcher/LauncherPage';
import { LoginPage } from '@/app/auth/LoginPage';
import { RegisterPage } from '@/app/auth/RegisterPage';
import { DashboardPage } from '@/modules/family-roots/features/dashboard/DashboardPage';
import { FamilyDataPage } from '@/modules/family-roots/features/family-data/FamilyDataPage';
import { TreePage } from '@/modules/family-roots/features/tree-view/TreePage';
import { EventsPage } from '@/modules/family-roots/features/events/EventsPage';
import { EventDetailPage } from '@/modules/family-roots/features/events/EventDetailPage';
import { InMemoriamListPage } from '@/modules/family-roots/features/in-memoriam/InMemoriamListPage';
import { MemorialPage } from '@/modules/family-roots/features/in-memoriam/MemorialPage';
import { PrayerGatePage } from '@/modules/family-roots/features/in-memoriam/PrayerGatePage';
import { FamilyCorePage } from '@/modules/family-core/pages/FamilyCorePage';
import { MoneyTrackPage } from '@/modules/money-track/pages/MoneyTrackPage';
import { HouseholdPage } from '@/modules/household/pages/HouseholdPage';
import { FamilyDataProvider } from '@/modules/family-roots/context/FamilyDataContext';
import { FamilyPerspectiveProvider } from '@/modules/family-roots/context/FamilyPerspectiveContext';
import { EventProvider } from '@/modules/family-roots/context/EventContext';
import { MemoriamProvider } from '@/modules/family-roots/context/MemoriamContext';
import { AuthProvider, useAuth } from '@/shared/context/AuthContext';
import { DataSourceProvider } from '@/shared/context/DataSourceContext';
import { appPaths, rootsPaths } from '@/shared/routes';

const FamilyMapPage = lazy(() =>
  import('@/modules/family-roots/features/family-map/FamilyMapPage').then(
    (m) => ({
      default: m.FamilyMapPage,
    }),
  ),
);

function MapPageLoader() {
  return (
    <div className="flex items-center justify-center py-24 text-sm text-gray-400">
      Memuat peta...
    </div>
  );
}

function LazyFamilyMapPage() {
  return (
    <Suspense fallback={<MapPageLoader />}>
      <FamilyMapPage />
    </Suspense>
  );
}

function SessionLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-500">
      Memuat sesi…
    </div>
  );
}

const ProtectedRoute = () => {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) return <SessionLoading />;
  if (!isAuthenticated) {
    return <Navigate to={appPaths.login} replace />;
  }

  return <Outlet />;
};

const PublicRoute = () => {
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
};

const RootsLayoutRoute = () => (
  <FamilyDataProvider>
    <FamilyPerspectiveProvider>
      <EventProvider>
        <MemoriamProvider>
          <MainLayout>
            <Outlet />
          </MainLayout>
        </MemoriamProvider>
      </EventProvider>
    </FamilyPerspectiveProvider>
  </FamilyDataProvider>
);

function LegacyEventRedirect() {
  const { eventId } = useParams();
  return <Navigate to={rootsPaths.event(eventId!)} replace />;
}

function LegacyMemorialRedirect() {
  const { personId } = useParams();
  return <Navigate to={rootsPaths.memorial(personId!)} replace />;
}

function LegacyMemorialPrayerRedirect() {
  const { personId } = useParams();
  return <Navigate to={rootsPaths.memorialPrayer(personId!)} replace />;
}

const router = createBrowserRouter([
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: appPaths.launcher,
        element: <LauncherPage />,
      },
      {
        path: '/roots',
        element: <RootsLayoutRoute />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'data', element: <FamilyDataPage /> },
          { path: 'tree', element: <TreePage /> },
          { path: 'map', element: <LazyFamilyMapPage /> },
          { path: 'events', element: <EventsPage /> },
          { path: 'events/:eventId', element: <EventDetailPage /> },
          { path: 'memoriam', element: <InMemoriamListPage /> },
          { path: 'memoriam/:personId/doa', element: <PrayerGatePage /> },
          { path: 'memoriam/:personId', element: <MemorialPage /> },
        ],
      },
      {
        path: '/core',
        element: (
          <ModuleShellLayout moduleName="Family Core">
            <Outlet />
          </ModuleShellLayout>
        ),
        children: [{ index: true, element: <FamilyCorePage /> }],
      },
      {
        path: '/money',
        element: (
          <ModuleShellLayout moduleName="Money Track">
            <Outlet />
          </ModuleShellLayout>
        ),
        children: [{ index: true, element: <MoneyTrackPage /> }],
      },
      {
        path: '/home',
        element: (
          <ModuleShellLayout moduleName="Household">
            <Outlet />
          </ModuleShellLayout>
        ),
        children: [{ index: true, element: <HouseholdPage /> }],
      },
      // Legacy FE path redirects
      { path: '/family/data', element: <Navigate to={rootsPaths.data} replace /> },
      { path: '/family/tree', element: <Navigate to={rootsPaths.tree} replace /> },
      { path: '/family/map', element: <Navigate to={rootsPaths.map} replace /> },
      { path: '/events', element: <Navigate to={rootsPaths.events} replace /> },
      { path: '/events/:eventId', element: <LegacyEventRedirect /> },
      {
        path: '/in-memoriam',
        element: <Navigate to={rootsPaths.memoriam} replace />,
      },
      {
        path: '/in-memoriam/:personId/doa',
        element: <LegacyMemorialPrayerRedirect />,
      },
      {
        path: '/in-memoriam/:personId',
        element: <LegacyMemorialRedirect />,
      },
    ],
  },
  {
    element: <PublicRoute />,
    children: [
      { path: appPaths.register, element: <RegisterPage /> },
      { path: appPaths.login, element: <LoginPage /> },
    ],
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
