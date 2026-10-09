/**
 * Cadangan urutan manual di localStorage.
 *
 * Urutan "resmi" disimpan di server (lihat
 * `docs/requests/from-fe/pending/TASK-BOARD-ORDERING-API.md` dan
 * `TASK-BOARD-ITEM-ORDERING-API.md`). Karena endpoint-nya belum tentu live,
 * FE menyimpan urutan lokal dulu supaya drag & drop tetap terasa jalan; begitu
 * BE rilis, urutan ikut tersinkron.
 */

const MANUAL_ORDER_KEY = 'task-board:manual-order';

function readKeys(storageKey: string): string[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((value) => String(value));
  } catch {
    return [];
  }
}

function writeKeys(storageKey: string, keys: string[]): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(keys));
  } catch {
    // ignore storage errors
  }
}

/** Baca urutan manual task; array kosong kalau belum ada / korup. */
export function readManualOrder(): number[] {
  return readKeys(MANUAL_ORDER_KEY)
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0);
}

/** Simpan urutan manual task. Aman kalau storage tidak tersedia. */
export function writeManualOrder(ids: number[]): void {
  writeKeys(
    MANUAL_ORDER_KEY,
    ids.map((id) => String(id)),
  );
}

/* ---------------- Urutan generik (deskripsi, todo, dst.) ---------------- */

export function readKeyOrder(storageKey: string): string[] {
  return readKeys(storageKey);
}

export function writeKeyOrder(storageKey: string, keys: string[]): void {
  writeKeys(storageKey, keys);
}

/** Kunci localStorage urutan penjelasan per task. */
export function descriptionOrderKey(taskId: string | number): string {
  return `task-board:description-order:${taskId}`;
}

/** Kunci localStorage urutan todo per task. */
export function todoOrderKey(taskId: string | number): string {
  return `task-board:todo-order:${taskId}`;
}

/**
 * Urutkan `items` mengikuti `order` (daftar key). Item yang tidak ada di
 * `order` diletakkan paling belakang dengan urutan aslinya.
 */
export function sortByOrder<T>(
  items: T[],
  keyOf: (item: T, index: number) => string,
  order: string[],
): T[] {
  if (order.length === 0) return items;
  const rank = new Map(order.map((key, index) => [key, index]));
  return items
    .map((item, index) => ({ item, index, rank: rank.get(keyOf(item, index)) }))
    .sort((a, b) => {
      if (a.rank !== undefined && b.rank !== undefined) return a.rank - b.rank;
      if (a.rank !== undefined) return -1;
      if (b.rank !== undefined) return 1;
      return a.index - b.index;
    })
    .map((entry) => entry.item);
}
