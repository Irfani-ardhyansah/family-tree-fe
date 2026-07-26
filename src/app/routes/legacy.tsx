import { Navigate, useParams, type RouteObject } from 'react-router-dom';
import { rootsPaths } from '@/shared/routes';

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

/** Old FE paths → Family Roots module paths. */
export const legacyRedirectRoutes: RouteObject[] = [
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
];
