/**
 * Preferensi Money Track.
 *
 * Sumber kebenaran = API (`GET/PUT /money/preferences`). localStorage hanya
 * dipakai sebagai cache agar UI tidak berkedip + fallback mode dummy / saat
 * endpoint BE belum tersedia.
 */

export type MoneyPrefType = 'expense' | 'income';

/** Default per tipe transaksi (dipakai bersama atau per-person). */
export type MoneyScopedDefaults = {
  expensePocketId: string | null;
  incomePocketId: string | null;
  expenseCategoryId: string | null;
  incomeCategoryId: string | null;
};

export type MoneyPreferences = {
  /** Tipe yang otomatis aktif saat form Catat Transaksi dibuka. */
  defaultTxType: MoneyPrefType;
  /** Preset nominal cepat di numpad (digit rupiah, mis. 20000). */
  quickAmounts: number[];
  /** Default untuk scope "Gabungan". */
  shared: MoneyScopedDefaults;
  /** Override per-person (mode couple), key = personId. */
  persons: Record<string, MoneyScopedDefaults>;
};

/** Uppercase label supaya konsisten di seluruh UI. */
export const QUICK_AMOUNT_MAX = 6;
export const QUICK_AMOUNT_MIN = 1;

export const DEFAULT_QUICK_AMOUNTS = [10000, 20000, 50000, 100000, 200000];

export function emptyScopedDefaults(): MoneyScopedDefaults {
  return {
    expensePocketId: null,
    incomePocketId: null,
    expenseCategoryId: null,
    incomeCategoryId: null,
  };
}

export const DEFAULT_MONEY_PREFERENCES: MoneyPreferences = {
  defaultTxType: 'expense',
  quickAmounts: [...DEFAULT_QUICK_AMOUNTS],
  shared: emptyScopedDefaults(),
  persons: {},
};

function normalizeId(value: unknown): string | null {
  if (value == null || value === '') return null;
  return String(value);
}

function normalizeScoped(input: unknown): MoneyScopedDefaults {
  const row = (input ?? {}) as Record<string, unknown>;
  return {
    expensePocketId: normalizeId(row.expensePocketId),
    incomePocketId: normalizeId(row.incomePocketId),
    expenseCategoryId: normalizeId(row.expenseCategoryId),
    incomeCategoryId: normalizeId(row.incomeCategoryId),
  };
}

function normalizeQuickAmounts(input: unknown): number[] {
  const raw = Array.isArray(input) ? input : DEFAULT_QUICK_AMOUNTS;
  const seen = new Set<number>();
  const list: number[] = [];
  for (const value of raw) {
    const amount = Math.trunc(Number(value));
    if (!Number.isFinite(amount) || amount <= 0) continue;
    if (seen.has(amount)) continue;
    seen.add(amount);
    list.push(amount);
    if (list.length >= QUICK_AMOUNT_MAX) break;
  }
  return list.length > 0 ? list : [...DEFAULT_QUICK_AMOUNTS];
}

/** Terima shape apa pun (API/cache) → bentuk valid. */
export function normalizeMoneyPreferences(input: unknown): MoneyPreferences {
  const row = (input ?? {}) as Record<string, unknown>;
  const persons: Record<string, MoneyScopedDefaults> = {};
  const rawPersons = (row.persons ?? {}) as Record<string, unknown>;
  for (const [key, value] of Object.entries(rawPersons)) {
    if (!key) continue;
    persons[key] = normalizeScoped(value);
  }
  return {
    defaultTxType: row.defaultTxType === 'income' ? 'income' : 'expense',
    quickAmounts: normalizeQuickAmounts(row.quickAmounts),
    shared: normalizeScoped(row.shared),
    persons,
  };
}

/** Scope (personId) → defaults yang berlaku. */
export function resolveScopedDefaults(
  prefs: MoneyPreferences,
  scope: string,
): MoneyScopedDefaults {
  if (scope !== 'all' && prefs.persons[scope]) {
    return prefs.persons[scope];
  }
  return prefs.shared;
}

export function pocketIdForType(
  defaults: MoneyScopedDefaults,
  type: MoneyPrefType,
): string | null {
  return type === 'income'
    ? defaults.incomePocketId
    : defaults.expensePocketId;
}

export function categoryIdForType(
  defaults: MoneyScopedDefaults,
  type: MoneyPrefType,
): string | null {
  return type === 'income'
    ? defaults.incomeCategoryId
    : defaults.expenseCategoryId;
}

/* ------------------------------------------------------------------ */
/* Cache lokal                                                         */
/* ------------------------------------------------------------------ */

export const MONEY_PREFERENCES_KEY = 'money-track-preferences';

export function readCachedMoneyPreferences(): MoneyPreferences {
  try {
    const raw = localStorage.getItem(MONEY_PREFERENCES_KEY);
    if (!raw) return DEFAULT_MONEY_PREFERENCES;
    return normalizeMoneyPreferences(JSON.parse(raw));
  } catch {
    return DEFAULT_MONEY_PREFERENCES;
  }
}

export function writeCachedMoneyPreferences(prefs: MoneyPreferences) {
  try {
    localStorage.setItem(MONEY_PREFERENCES_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}
