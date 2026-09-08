import type { ComponentType } from 'react';
import {
  Activity,
  BookOpen,
  Box,
  Calendar,
  Coffee,
  CreditCard,
  FileText,
  GitBranch,
  Home,
  MapPin,
  Repeat,
  ShoppingCart,
  Star,
} from 'react-feather';
import {
  corePaths,
  householdPaths,
  moneyPaths,
  rootsPaths,
} from '@/shared/routes';

export type AppModuleId = 'roots' | 'core' | 'money' | 'household';

export type ModuleDevStatus = 'in-dev' | 'planned' | 'ready';

export type ModuleFeature = {
  label: string;
  icon: ComponentType<{ size?: number | string; className?: string }>;
};

export type ModuleCatalogItem = {
  id: AppModuleId;
  title: string;
  subtitle: string;
  description: string;
  to: string;
  status: ModuleDevStatus;
  accent: string;
  iconWrap: string;
  iconColor: string;
  /** Optional title hover color on launcher card */
  titleHover?: string;
  Icon: ComponentType<{ size?: number | string; className?: string }>;
  features: ModuleFeature[];
};

export const MODULE_CATALOG: ModuleCatalogItem[] = [
  {
    id: 'roots',
    title: 'Family Roots',
    subtitle: 'Keluarga besar',
    description: 'Silsilah, acara keluarga, memoriam, dan peta alamat.',
    to: rootsPaths.home,
    status: 'ready',
    accent: 'border-t-emerald-500',
    iconWrap: 'bg-emerald-500/12',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    titleHover: 'group-hover:text-emerald-600 dark:group-hover:text-emerald-300',
    Icon: GitBranch,
    features: [
      { label: 'Silsilah keluarga', icon: GitBranch },
      { label: 'Acara & gathering', icon: Calendar },
      { label: 'Memoriam', icon: BookOpen },
      { label: 'Peta alamat', icon: MapPin },
    ],
  },
  {
    id: 'core',
    title: 'Family Core',
    subtitle: 'Keluarga inti',
    description: 'Dokumen penting, health tracker, dan kalender keluarga inti.',
    to: corePaths.home,
    status: 'ready',
    accent: 'border-t-sky-500',
    iconWrap: 'bg-sky-500/12',
    iconColor: 'text-sky-600 dark:text-sky-400',
    titleHover: 'group-hover:text-sky-600 dark:group-hover:text-sky-300',
    Icon: Home,
    features: [
      { label: 'Dokumen penting', icon: FileText },
      { label: 'Health tracker', icon: Activity },
      { label: 'Family calendar', icon: Calendar },
    ],
  },
  {
    id: 'money',
    title: 'Money Track',
    subtitle: 'Pasangan',
    description:
      'Pencatatan keuangan pasangan: transaksi, kantong, transfer, balancing.',
    to: moneyPaths.home,
    status: 'ready',
    accent: 'border-t-slate-500',
    iconWrap: 'bg-money-brown-soft',
    iconColor: 'text-money-brown',
    titleHover: 'group-hover:text-slate-700 dark:group-hover:text-slate-200',
    Icon: CreditCard,
    features: [
      { label: 'Dashboard & kantong', icon: Activity },
      { label: 'Wishlist & goals', icon: Star },
      { label: 'Utang / piutang', icon: Repeat },
    ],
  },
  {
    id: 'household',
    title: 'Household',
    subtitle: 'Pasangan',
    description: 'Inventory rumah, resep, dan daftar belanja harian.',
    to: householdPaths.home,
    status: 'planned',
    accent: 'border-t-violet-500',
    iconWrap: 'bg-violet-500/12',
    iconColor: 'text-violet-600 dark:text-violet-400',
    titleHover: 'group-hover:text-violet-600 dark:group-hover:text-violet-300',
    Icon: Coffee,
    features: [
      { label: 'Inventory rumah', icon: Box },
      { label: 'Resep & meal planner', icon: Coffee },
      { label: 'Daftar belanja', icon: ShoppingCart },
    ],
  },
];

export function getModuleById(id: AppModuleId): ModuleCatalogItem | undefined {
  return MODULE_CATALOG.find((m) => m.id === id);
}
