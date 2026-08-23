import {
  Activity,
  Archive,
  Bell,
  Clipboard,
  Settings,
  Shield,
  Sliders,
  Users,
} from 'react-feather';
import { adminPaths } from '@/shared/routes';

export type AdminNavItem = {
  to: string;
  label: string;
  icon: typeof Shield;
  end?: boolean;
};

export type AdminNavGroup = {
  id: string;
  label: string;
  items: AdminNavItem[];
};

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    id: 'ops',
    label: 'Operasi',
    items: [
      { to: adminPaths.home, label: 'Dashboard', icon: Activity, end: true },
      { to: adminPaths.modules, label: 'Status Modul', icon: Sliders },
      { to: adminPaths.audit, label: 'Audit Log', icon: Clipboard },
      { to: adminPaths.sessions, label: 'Session', icon: Users },
    ],
  },
  {
    id: 'system',
    label: 'Sistem',
    items: [
      { to: adminPaths.broadcast, label: 'Broadcast', icon: Bell },
      { to: adminPaths.settings, label: 'Pengaturan', icon: Settings },
      { to: adminPaths.backup, label: 'Backup & Export', icon: Archive },
    ],
  },
];

export const ADMIN_NAV_ITEMS: AdminNavItem[] = ADMIN_NAV_GROUPS.flatMap(
  (group) => group.items,
);
