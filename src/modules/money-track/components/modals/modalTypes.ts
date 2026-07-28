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
  accountId?: string;
  accountName?: string;
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
  const n = Number(digits.replace(/\D/g, '')) || 0;
  return n.toLocaleString('id-ID');
}

export function parseIdrDigits(value: string): number {
  return Number(value.replace(/\D/g, '')) || 0;
}
