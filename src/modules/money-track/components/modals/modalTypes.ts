export type MoneyModalType =
  | 'transaction'
  | 'transfer'
  | 'move'
  | 'cash'
  | 'account'
  | 'pocket'
  | 'wishlist'
  | 'debt'
  | 'debtPayment'
  | 'adjustment'
  | 'activityEdit';

export type MoneyModalPayload = {
  debtId?: string;
  debtLabel?: string;
  pocketId?: string;
  pocketName?: string;
  pocketCategory?: string;
  pocketGoalAmount?: number | null;
  pocketIsSystem?: boolean;
  pocketCanDelete?: boolean;
  accountId?: string;
  accountName?: string;
  accountType?: 'bank' | 'ewallet' | 'cash';
  personId?: string;
  personName?: string;
  recorded?: number;
  actual?: number;
  /** Edit transaksi (income/expense). */
  transactionId?: string;
  txType?: 'income' | 'expense';
  txAmount?: number;
  txCategoryId?: string | null;
  txNote?: string | null;
  txDateIso?: string;
  /** Edit transfer / tarik tunai dari list activity. */
  activityKind?: 'transfer' | 'cash_withdrawal';
  activityId?: string;
  activityTitle?: string;
  fromPocketId?: string;
  toPocketId?: string;
};

export type MoneyModalState = {
  type: MoneyModalType;
  payload?: MoneyModalPayload;
} | null;

export const EXPENSE_CATEGORIES = [
  { id: 'makan', name: 'Makan', emoji: 'coffee' },
  { id: 'transport', name: 'Transport', emoji: 'truck' },
  { id: 'tagihan', name: 'Tagihan', emoji: 'credit-card' },
  { id: 'hiburan', name: 'Hiburan', emoji: 'film' },
  { id: 'belanja', name: 'Belanja', emoji: 'shopping-cart' },
  { id: 'kesehatan', name: 'Kesehatan', emoji: 'heart' },
  { id: 'pendidikan', name: 'Pendidikan', emoji: 'book-open' },
  { id: 'lainnya', name: 'Lainnya', emoji: 'tag' },
] as const;

export const INCOME_CATEGORIES = [
  { id: 'gaji', name: 'Gaji', emoji: 'briefcase' },
  { id: 'bonus', name: 'Bonus', emoji: 'gift' },
  { id: 'freelance', name: 'Freelance', emoji: 'monitor' },
  { id: 'investasi', name: 'Investasi', emoji: 'trending-up' },
  { id: 'lainnya-in', name: 'Lainnya', emoji: 'tag' },
] as const;

export function todayLabel(): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());
}

export function formatInputIdr(digits: string): string {
  const raw = digits.replace(/\D/g, '');
  if (!raw) return '';
  return Number(raw).toLocaleString('id-ID');
}

export function parseIdrDigits(value: string): number {
  return Number(value.replace(/\D/g, '')) || 0;
}

/** Keep digit-only string for form state (display formatting is separate). */
export function sanitizeIdrDigits(value: string): string {
  return value.replace(/\D/g, '');
}
