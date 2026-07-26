import { Outlet, type RouteObject } from 'react-router-dom';
import { ModuleShellLayout } from '@/app/layouts/ModuleShellLayout';
import { FamilyCorePage } from '@/modules/family-core/pages/FamilyCorePage';
import { corePaths } from '@/shared/routes';

export const familyCoreRoutes: RouteObject[] = [
  {
    path: corePaths.home,
    element: (
      <ModuleShellLayout moduleName="Family Core">
        <Outlet />
      </ModuleShellLayout>
    ),
    children: [{ index: true, element: <FamilyCorePage /> }],
  },
];
