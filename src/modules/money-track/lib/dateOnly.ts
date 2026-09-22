/** Ambil YYYY-MM-DD kalender tanpa geser timezone. */
export function toDateOnlyIso(value: string | Date): string {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return '';
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const raw = value.trim();
  if (!raw) return '';
  // Jangan parse lewat Date() — "YYYY-MM-DD" / "...T00:00:00Z" cukup ambil prefix kalender.
  const prefix = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (prefix) return prefix[1];
  // Format bebas (mis. label id-ID): parse lokal, lalu ambil komponen kalender lokal.
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return toDateOnlyIso(parsed);
}

/** Nilai dari `<input type="date">`; kosong → hari ini (lokal). */
export function dateFromFormInput(value: string): string {
  const iso = toDateOnlyIso(value);
  return iso || todayDateOnlyIso();
}

/** Hari ini (lokal), bukan UTC dari toISOString(). */
export function todayDateOnlyIso(): string {
  return toDateOnlyIso(new Date());
}

const ID_MONTHS = [
  'januari',
  'februari',
  'maret',
  'april',
  'mei',
  'juni',
  'juli',
  'agustus',
  'september',
  'oktober',
  'november',
  'desember',
];

/** "Juli 2026" → `2026-07`. Fallback: bulan berjalan. */
export function yearMonthFromPeriodLabel(label: string): string {
  const parts = label.trim().toLowerCase().split(/\s+/);
  const year = parts.find((part) => /^\d{4}$/.test(part));
  const monthName = parts.find((part) => ID_MONTHS.includes(part));
  if (year && monthName) {
    const month = ID_MONTHS.indexOf(monthName) + 1;
    return `${year}-${String(month).padStart(2, '0')}`;
  }
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/** Batas kalender `YYYY-MM` → `from`/`to` inklusif. */
export function monthDateRange(
  yearMonth: string,
): { from: string; to: string } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(yearMonth);
  if (!match) return null;
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  const last = new Date(Number(match[1]), month, 0).getDate();
  return {
    from: `${match[1]}-${match[2]}-01`,
    to: `${match[1]}-${match[2]}-${String(last).padStart(2, '0')}`,
  };
}

/** Label tampilan id-ID dari tanggal kalender (tanpa UTC shift). */
export function formatDateOnlyLabel(value: string): string {
  const iso = toDateOnlyIso(value);
  const parts = iso.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return value;
  const [y, m, d] = parts;
  const date = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}
