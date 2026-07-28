import type { MoneyDashboardMock } from '@/modules/money-track/types';
import { moneyPaths } from '@/shared/routes';

/** Static mock for layout verification — replace with API later. */
export const moneyDashboardMock: MoneyDashboardMock = {
  mode: 'couple',
  periodLabel: 'Juli 2026',
  loginPersonId: 'person-irfan',
  persons: [
    {
      id: 'person-irfan',
      name: 'Irfan',
      role: 'husband',
      initial: 'I',
      totalBalance: 96_200_000,
      pockets: [
        {
          id: 'p-irfan-txn',
          name: 'Transaksi',
          category: 'transaksi',
          balance: 8_450_000,
          accountName: 'BCA',
        },
        {
          id: 'p-irfan-save',
          name: 'Tabungan',
          category: 'tabungan',
          balance: 42_100_000,
          accountName: 'Jago',
        },
        {
          id: 'p-irfan-inv',
          name: 'Investasi',
          category: 'investasi',
          balance: 45_650_000,
          accountName: 'Reksadana',
        },
      ],
    },
    {
      id: 'person-ayu',
      name: 'Ayu',
      role: 'wife',
      initial: 'A',
      totalBalance: 71_900_000,
      pockets: [
        {
          id: 'p-ayu-txn',
          name: 'Transaksi',
          category: 'transaksi',
          balance: 5_900_000,
          accountName: 'BCA',
        },
        {
          id: 'p-ayu-save',
          name: 'Tabungan',
          category: 'tabungan',
          balance: 38_300_000,
          accountName: 'Seabank',
        },
        {
          id: 'p-ayu-inv',
          name: 'Investasi',
          category: 'investasi',
          balance: 27_700_000,
          accountName: 'Emas Digital',
        },
      ],
    },
  ],
  jointPockets: [
    {
      id: 'p-joint-emergency',
      name: 'Dana Darurat',
      balance: 34_500_000,
      goalAmount: 60_000_000,
      goalDateLabel: 'Des 2026',
      progressPct: 57,
    },
  ],
  summary: {
    income: 24_500_000,
    expense: 14_180_000,
    net: 10_320_000,
    incomeChangePct: 8,
    expenseChangePct: 3,
    totalSavings: 187_400_000,
  },
  recentActivity: [
    {
      id: 'a1',
      kind: 'income',
      title: 'Gaji Bulanan',
      meta: 'Income · Irfan · Transaksi · 25 Jul',
      amount: 18_000_000,
      signed: 'pos',
    },
    {
      id: 'a2',
      kind: 'expense',
      title: 'Makan siang & belanja bulanan',
      meta: 'Expense · Ayu · Transaksi · 24 Jul',
      amount: 850_000,
      signed: 'neg',
    },
    {
      id: 'a3',
      kind: 'transfer',
      title: 'Transfer ke Ayu',
      meta: 'Transfer · Irfan → Ayu · 23 Jul',
      amount: 3_000_000,
      signed: 'neutral',
    },
    {
      id: 'a4',
      kind: 'expense',
      title: 'Listrik & Internet',
      meta: 'Expense · Irfan · Transaksi · 22 Jul',
      amount: 650_000,
      signed: 'neg',
    },
    {
      id: 'a5',
      kind: 'expense',
      title: 'Bensin & tol',
      meta: 'Expense · Ayu · Transaksi · 21 Jul',
      amount: 320_000,
      signed: 'neg',
    },
  ],
  alerts: [
    {
      id: 'alert-1',
      message:
        'Kantong Transaksi — Irfan tidak sinkron Rp 120.000 dengan saldo riil.',
      href: moneyPaths.balancing,
    },
  ],
};
