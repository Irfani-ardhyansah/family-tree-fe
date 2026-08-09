import type { RouteObject } from 'react-router-dom';
import { FamilyCoreLayout } from '@/modules/family-core/layout/FamilyCoreLayout';
import { FamilyCoreHubPage } from '@/modules/family-core/pages/FamilyCoreHubPage';
import { CalendarEventDetailPage } from '@/modules/family-core/pages/calendar/CalendarEventDetailPage';
import { CalendarEventFormPage } from '@/modules/family-core/pages/calendar/CalendarEventFormPage';
import { CalendarEventTypesPage } from '@/modules/family-core/pages/calendar/CalendarEventTypesPage';
import { CalendarPage } from '@/modules/family-core/pages/calendar/CalendarPage';
import { DocumentDetailPage } from '@/modules/family-core/pages/documents/DocumentDetailPage';
import { DocumentFormPage } from '@/modules/family-core/pages/documents/DocumentFormPage';
import { DocumentTypesPage } from '@/modules/family-core/pages/documents/DocumentTypesPage';
import { DocumentsPage } from '@/modules/family-core/pages/documents/DocumentsPage';
import { HealthMemberPage } from '@/modules/family-core/pages/health/HealthMemberPage';
import { HealthPage } from '@/modules/family-core/pages/health/HealthPage';
import { corePaths } from '@/shared/routes';

export const familyCoreRoutes: RouteObject[] = [
  {
    path: corePaths.home,
    element: <FamilyCoreLayout />,
    children: [
      { index: true, element: <FamilyCoreHubPage /> },
      { path: 'documents', element: <DocumentsPage /> },
      { path: 'documents/types', element: <DocumentTypesPage /> },
      { path: 'documents/new', element: <DocumentFormPage /> },
      { path: 'documents/:documentId', element: <DocumentDetailPage /> },
      { path: 'documents/:documentId/edit', element: <DocumentFormPage /> },
      { path: 'health', element: <HealthPage /> },
      { path: 'health/:memberId', element: <HealthMemberPage /> },
      { path: 'calendar', element: <CalendarPage /> },
      { path: 'calendar/types', element: <CalendarEventTypesPage /> },
      { path: 'calendar/new', element: <CalendarEventFormPage /> },
      { path: 'calendar/:eventId', element: <CalendarEventDetailPage /> },
    ],
  },
];
