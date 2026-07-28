import type { MoneyDashboardMock } from '@/modules/money-track/types';

export type MoneyDataSource = 'dummy' | 'api';

export const MONEY_DATA_SOURCE_KEY = 'money-track-data-source';

export function readMoneyDataSource(): MoneyDataSource {
  try {
    const raw = localStorage.getItem(MONEY_DATA_SOURCE_KEY);
    if (raw === 'api' || raw === 'dummy') return raw;
  } catch {
    /* ignore */
  }
  return 'dummy';
}

export function writeMoneyDataSource(source: MoneyDataSource) {
  try {
    localStorage.setItem(MONEY_DATA_SOURCE_KEY, source);
  } catch {
    /* ignore */
  }
}

/** Empty workspace used when data source = API (until BE is wired). */
export const emptyMoneyDashboard: MoneyDashboardMock = {
  mode: 'couple',
  periodLabel: '—',
  loginPersonId: '',
  persons: [],
  jointPockets: [],
  summary: {
    income: 0,
    expense: 0,
    net: 0,
    incomeChangePct: 0,
    expenseChangePct: 0,
    totalSavings: 0,
  },
  recentActivity: [],
  alerts: [],
};
