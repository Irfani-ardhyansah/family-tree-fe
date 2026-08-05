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

/** Setelah "Hapus Data Contoh" sukses — tombol tidak ditampilkan lagi. */
export const MONEY_SAMPLE_DATA_CLEARED_KEY = 'money-track-sample-data-cleared';

export function readMoneySampleDataCleared(): boolean {
  try {
    return localStorage.getItem(MONEY_SAMPLE_DATA_CLEARED_KEY) === '1';
  } catch {
    return false;
  }
}

export function writeMoneySampleDataCleared(cleared: boolean) {
  try {
    if (cleared) {
      localStorage.setItem(MONEY_SAMPLE_DATA_CLEARED_KEY, '1');
    } else {
      localStorage.removeItem(MONEY_SAMPLE_DATA_CLEARED_KEY);
    }
  } catch {
    /* ignore */
  }
}

/** Pocket IDs yang sudah punya opening balance (per kantong, bisa bertambah). */
export const MONEY_OPENING_POCKET_IDS_KEY = 'money-track-opening-pocket-ids';

/** @deprecated diganti per-pocket ids; tetap dibaca untuk migrasi ringan. */
export const MONEY_OPENING_BALANCES_DONE_KEY = 'money-track-opening-balances-done';

export function readMoneyOpeningPocketIds(): string[] {
  try {
    const raw = localStorage.getItem(MONEY_OPENING_POCKET_IDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === 'string');
  } catch {
    return [];
  }
}

export function writeMoneyOpeningPocketIds(ids: string[]) {
  try {
    const unique = [...new Set(ids.filter(Boolean))];
    if (unique.length === 0) {
      localStorage.removeItem(MONEY_OPENING_POCKET_IDS_KEY);
    } else {
      localStorage.setItem(MONEY_OPENING_POCKET_IDS_KEY, JSON.stringify(unique));
    }
  } catch {
    /* ignore */
  }
}

export function addMoneyOpeningPocketIds(ids: string[]) {
  writeMoneyOpeningPocketIds([...readMoneyOpeningPocketIds(), ...ids]);
}

export function clearMoneyOpeningPocketIds() {
  writeMoneyOpeningPocketIds([]);
  try {
    localStorage.removeItem(MONEY_OPENING_BALANCES_DONE_KEY);
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
