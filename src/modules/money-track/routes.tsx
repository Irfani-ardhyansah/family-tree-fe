import { Outlet, type RouteObject } from 'react-router-dom';
import { ModuleShellLayout } from '@/app/layouts/ModuleShellLayout';
import { MoneyTrackPage } from '@/modules/money-track/pages/MoneyTrackPage';
import { moneyPaths } from '@/shared/routes';

export const moneyTrackRoutes: RouteObject[] = [
  {
    path: moneyPaths.home,
    element: (
      <ModuleShellLayout moduleName="Money Track">
        <Outlet />
      </ModuleShellLayout>
    ),
    children: [{ index: true, element: <MoneyTrackPage /> }],
  },
];
