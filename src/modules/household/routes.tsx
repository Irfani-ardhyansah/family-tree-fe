import { Outlet, type RouteObject } from 'react-router-dom';
import { ModuleShellLayout } from '@/app/layouts/ModuleShellLayout';
import { SensitiveModuleRoute } from '@/app/routes/SensitiveModuleRoute';
import { HouseholdPage } from '@/modules/household/pages/HouseholdPage';
import { householdPaths } from '@/shared/routes';

export const householdRoutes: RouteObject[] = [
  {
    element: <SensitiveModuleRoute />,
    children: [
      {
        path: householdPaths.home,
        element: (
          <ModuleShellLayout moduleName="Household">
            <Outlet />
          </ModuleShellLayout>
        ),
        children: [{ index: true, element: <HouseholdPage /> }],
      },
    ],
  },
];
