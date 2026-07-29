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
  | 'adjustment';

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
};

export type MoneyModalState = {
  type: MoneyModalType;
  payload?: MoneyModalPayload;
} | null;

export const EXPENSE_CATEGORIES = [
  { id: 'makan', name: 'Makan', emoji: '🍜' },
  { id: 'transport', name: 'Transport', emoji: '🚗' },
  { id: 'tagihan', name: 'Tagihan', emoji: '🧾' },
  { id: 'hiburan', name: 'Hiburan', emoji: '🎬' },
  { id: 'belanja', name: 'Belanja', emoji: '🛒' },
  { id: 'kesehatan', name: 'Kesehatan', emoji: '🏥' },
  { id: 'pendidikan', name: 'Pendidikan', emoji: '📚' },
  { id: 'lainnya', name: 'Lainnya', emoji: '➕' },
] as const;

export const INCOME_CATEGORIES = [
  { id: 'gaji', name: 'Gaji', emoji: '💼' },
  { id: 'bonus', name: 'Bonus', emoji: '🎁' },
  { id: 'freelance', name: 'Freelance', emoji: '💻' },
  { id: 'investasi', name: 'Investasi', emoji: '📈' },
  { id: 'lainnya-in', name: 'Lainnya', emoji: '➕' },
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
