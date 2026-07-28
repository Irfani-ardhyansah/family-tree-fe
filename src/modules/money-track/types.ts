export type MoneyPersonRole = 'husband' | 'wife' | 'self';

export type MoneyScope = 'all' | string; // 'all' | personId

export type MoneyPerson = {
  id: string;
  name: string;
  role: MoneyPersonRole;
  initial: string;
};

export type MoneyPocketCategory = 'transaksi' | 'tabungan' | 'investasi' | 'custom';

export type MoneyPocketSummary = {
  id: string;
  name: string;
  category: MoneyPocketCategory;
  balance: number;
  accountName: string;
};

export type MoneyPersonCard = MoneyPerson & {
  totalBalance: number;
  pockets: MoneyPocketSummary[];
};

export type MoneyJointPocket = {
  id: string;
  name: string;
  balance: number;
  goalAmount: number | null;
  goalDateLabel: string | null;
  progressPct: number;
};

export type MoneyActivityKind =
  | 'income'
  | 'expense'
  | 'transfer'
  | 'cash_withdrawal';

export type MoneyActivityItem = {
  id: string;
  kind: MoneyActivityKind;
  title: string;
  meta: string;
  amount: number;
  signed: 'pos' | 'neg' | 'neutral';
};

export type MoneyAlert = {
  id: string;
  message: string;
  href: string;
};

export type MoneyDashboardMock = {
  mode: 'single' | 'couple';
  periodLabel: string;
  loginPersonId: string;
  persons: MoneyPersonCard[];
  jointPockets: MoneyJointPocket[];
  summary: {
    income: number;
    expense: number;
    net: number;
    incomeChangePct: number;
    expenseChangePct: number;
    totalSavings: number;
  };
  recentActivity: MoneyActivityItem[];
  alerts: MoneyAlert[];
};

export function formatIdr(amount: number): string {
  const abs = Math.abs(amount);
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(abs);
  if (amount < 0) return `-${formatted}`;
  return formatted;
}

export function formatIdrShort(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) {
    const jt = amount / 1_000_000;
    const rounded = Math.round(jt * 10) / 10;
    return `Rp ${rounded.toLocaleString('id-ID')} jt`;
  }
  return formatIdr(amount);
}
