import type { RouteObject } from 'react-router-dom';
import { AdminRoute } from '@/app/routes/guards';
import { SensitiveModuleRoute } from '@/app/routes/SensitiveModuleRoute';
import { AdminLayout } from '@/modules/admin/layout/AdminLayout';
import { AuditLogPage } from '@/modules/admin/pages/AuditLogPage';
import { BackupExportPage } from '@/modules/admin/pages/BackupExportPage';
import { BroadcastPage } from '@/modules/admin/pages/BroadcastPage';
import { DashboardPage } from '@/modules/admin/pages/DashboardPage';
import { SessionManagementPage } from '@/modules/admin/pages/SessionManagementPage';
import { SettingsPage } from '@/modules/admin/pages/SettingsPage';
import { StatusModulPage } from '@/modules/admin/pages/StatusModulPage';
import { adminPaths } from '@/shared/routes';

export const adminRoutes: RouteObject[] = [
  {
    element: <AdminRoute />,
    children: [
      {
        element: <SensitiveModuleRoute />,
        children: [
          {
            path: adminPaths.home,
            element: <AdminLayout />,
            children: [
              { index: true, element: <DashboardPage /> },
              // RBAC Modul — disembunyikan sementara
              { path: 'modules', element: <StatusModulPage /> },
              { path: 'audit', element: <AuditLogPage /> },
              { path: 'sessions', element: <SessionManagementPage /> },
              { path: 'broadcast', element: <BroadcastPage /> },
              { path: 'settings', element: <SettingsPage /> },
              { path: 'backup', element: <BackupExportPage /> },
            ],
          },
        ],
      },
    ],
  },
];
