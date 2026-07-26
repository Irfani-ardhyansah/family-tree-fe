import { lazy, Suspense } from 'react';
import { Outlet, type RouteObject } from 'react-router-dom';
import { MainLayout } from '@/shared/components/layouts/MainLayout';
import { rootsPaths } from '@/shared/routes';
import { EventProvider } from '@/modules/family-roots/context/EventContext';
import { FamilyDataProvider } from '@/modules/family-roots/context/FamilyDataContext';
import { FamilyPerspectiveProvider } from '@/modules/family-roots/context/FamilyPerspectiveContext';
import { MemoriamProvider } from '@/modules/family-roots/context/MemoriamContext';
import { DashboardPage } from '@/modules/family-roots/features/dashboard/DashboardPage';
import { EventDetailPage } from '@/modules/family-roots/features/events/EventDetailPage';
import { EventsPage } from '@/modules/family-roots/features/events/EventsPage';
import { FamilyDataPage } from '@/modules/family-roots/features/family-data/FamilyDataPage';
import { InMemoriamListPage } from '@/modules/family-roots/features/in-memoriam/InMemoriamListPage';
import { MemorialPage } from '@/modules/family-roots/features/in-memoriam/MemorialPage';
import { PrayerGatePage } from '@/modules/family-roots/features/in-memoriam/PrayerGatePage';
import { TreePage } from '@/modules/family-roots/features/tree-view/TreePage';

const FamilyMapPage = lazy(() =>
  import('@/modules/family-roots/features/family-map/FamilyMapPage').then(
    (m) => ({
      default: m.FamilyMapPage,
    }),
  ),
);

function LazyFamilyMapPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24 text-sm text-gray-400">
          Memuat peta...
        </div>
      }
    >
      <FamilyMapPage />
    </Suspense>
  );
}

function RootsLayoutRoute() {
  return (
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
}

export const familyRootsRoutes: RouteObject[] = [
  {
    path: rootsPaths.home,
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
];
