import {
  BarChart2,
  Briefcase,
  CreditCard,
  DollarSign,
  Home,
  Repeat,
  Sliders,
  Tag,
} from 'react-feather';
import type { MoneyModalType } from '@/modules/money-track/components/modals/modalTypes';
import { moneyPaths } from '@/shared/routes';

export type MoneyNavGroupId = 'daily' | 'analysis' | 'setup';

export type MoneyNavItem = {
  to: string;
  label: string;
  icon: typeof Home;
  group: MoneyNavGroupId;
  end?: boolean;
  requiresOpeningBalances?: boolean;
};

export const MONEY_NAV_GROUPS: { id: MoneyNavGroupId; label: string }[] = [
  { id: 'daily', label: 'Harian' },
  { id: 'analysis', label: 'Analisis' },
  { id: 'setup', label: 'Setup' },
];

export const MONEY_NAV_ITEMS: MoneyNavItem[] = [
  { to: moneyPaths.home, label: 'Dashboard', icon: Home, end: true, group: 'daily' },
  { to: moneyPaths.transactions, label: 'Transaksi', icon: Repeat, group: 'daily' },
  { to: moneyPaths.pockets, label: 'Kantong', icon: Briefcase, group: 'daily' },
  { to: moneyPaths.reporting, label: 'Reporting', icon: BarChart2, group: 'analysis' },
  { to: moneyPaths.debts, label: 'Utang Piutang', icon: CreditCard, group: 'analysis' },
  { to: moneyPaths.balancing, label: 'Balancing', icon: Sliders, group: 'analysis' },
  { to: moneyPaths.categories, label: 'Kategori', icon: Tag, group: 'setup' },
  {
    to: moneyPaths.opening,
    label: 'Saldo Awal',
    icon: DollarSign,
    group: 'setup',
    requiresOpeningBalances: true,
  },
];

export type MoneyQuickAction = {
  type: MoneyModalType;
  title: string;
  subtitle: string;
  tone: 'primary' | 'rose' | 'violet' | 'amber';
};

export const MONEY_QUICK_ACTIONS: MoneyQuickAction[] = [
  {
    type: 'transaction',
    title: 'Catat Transaksi',
    subtitle: 'Pemasukan atau pengeluaran harian',
    tone: 'primary',
  },
  {
    type: 'transfer',
    title: 'Transfer ke Pasangan',
    subtitle: 'Kirim uang ke pasangan',
    tone: 'rose',
  },
  {
    type: 'move',
    title: 'Pindah Antar Kantong',
    subtitle: 'Geser saldo antar kantong (termasuk pasangan)',
    tone: 'violet',
  },
  {
    type: 'cash',
    title: 'Tarik Tunai',
    subtitle: 'Catat uang keluar jadi cash',
    tone: 'amber',
  },
];

export function visibleMoneyNavItems(needsOpeningBalancesUi: boolean): MoneyNavItem[] {
  return MONEY_NAV_ITEMS.filter(
    (item) => !item.requiresOpeningBalances || needsOpeningBalancesUi,
  );
}
