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
    status: 'in-dev',
    accent: 'border-t-emerald-500',
    iconWrap: 'bg-emerald-500/15',
    iconColor: 'text-emerald-400',
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
    status: 'planned',
    accent: 'border-t-sky-500',
    iconWrap: 'bg-sky-500/15',
    iconColor: 'text-sky-400',
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
    description: 'Budget, wishlist, dan pencatatan utang/piutang pasangan.',
    to: moneyPaths.home,
    status: 'planned',
    accent: 'border-t-amber-500',
    iconWrap: 'bg-amber-500/15',
    iconColor: 'text-amber-400',
    Icon: CreditCard,
    features: [
      { label: 'Budget planner', icon: Activity },
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
    iconWrap: 'bg-violet-500/15',
    iconColor: 'text-violet-400',
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
