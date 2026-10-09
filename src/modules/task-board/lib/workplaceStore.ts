import { useSyncExternalStore } from 'react';
import type { Workplace, WorkplaceFormData } from '../types';
import { MOCK_WORKPLACES } from '../mocks/workplaces';

/**
 * Penyimpanan tempat kerja versi dummy.
 *
 * Semua mutasi disimpan di `localStorage` supaya bisa dicoba sekarang tanpa BE.
 * Begitu API `/workplaces` rilis, ganti isi fungsi di sini dengan panggilan
 * `apiFetch` — komponen tidak perlu diubah karena tetap lewat hook
 * `useWorkplaces()` / `getWorkplace()`.
 */

const STORAGE_KEY = 'task-board:workplaces';

function seed(): Workplace[] {
  return MOCK_WORKPLACES.map((workplace) => ({ ...workplace }));
}

function load(): Workplace[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return (parsed as Workplace[]).map((workplace) => ({
          ...workplace,
          is_default: Boolean(workplace.is_default),
          archived_at: workplace.archived_at ?? null,
        }));
      }
    }
  } catch {
    // storage tidak tersedia / data korup → pakai seed
  }
  return seed();
}

let state: Workplace[] = load();
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

function commit(next: Workplace[]) {
  state = next;
  persist();
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): Workplace[] {
  return state;
}

/** Semua tempat kerja (termasuk yang diarsipkan). */
export function useWorkplaces(): Workplace[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function getWorkplace(id: number): Workplace | undefined {
  return state.find((workplace) => workplace.id === id);
}

export function getActiveWorkplaces(): Workplace[] {
  return state.filter((workplace) => !workplace.archived_at);
}

function nextId(): number {
  return state.reduce((max, workplace) => Math.max(max, workplace.id), 0) + 1;
}

function fromForm(data: WorkplaceFormData) {
  return {
    name: data.name.trim(),
    employment_type: data.employmentType,
    role: data.role.trim() || null,
    location: data.location.trim() || null,
    accent: data.accent,
    started_at: dateFromInput(data.startedAt),
    ended_at: dateFromInput(data.endedAt),
  };
}

/** `YYYY-MM-DD` → ISO (tengah malam lokal), atau null. */
function dateFromInput(value: string): string | null {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** ISO → `YYYY-MM-DD` untuk input date (pakai tanggal lokal). */
export function toDateInput(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function toWorkplaceFormData(workplace: Workplace): WorkplaceFormData {
  return {
    name: workplace.name,
    employmentType: workplace.employment_type,
    role: workplace.role ?? '',
    location: workplace.location ?? '',
    accent: workplace.accent,
    startedAt: toDateInput(workplace.started_at),
    endedAt: toDateInput(workplace.ended_at),
  };
}

export function createWorkplace(data: WorkplaceFormData): Workplace {
  const now = new Date().toISOString();
  const workplace: Workplace = {
    id: nextId(),
    ...fromForm(data),
    is_default: false,
    archived_at: null,
    created_at: now,
    updated_at: now,
  };
  commit([...state, workplace]);
  return workplace;
}

export function updateWorkplace(
  id: number,
  data: WorkplaceFormData,
): Workplace | undefined {
  let updated: Workplace | undefined;
  const next = state.map((workplace) => {
    if (workplace.id !== id) return workplace;
    updated = {
      ...workplace,
      ...fromForm(data),
      updated_at: new Date().toISOString(),
    };
    return updated;
  });
  if (updated) commit(next);
  return updated;
}

export function archiveWorkplace(id: number): void {
  const now = new Date().toISOString();
  commit(
    state.map((workplace) =>
      workplace.id === id
        ? { ...workplace, archived_at: now, updated_at: now }
        : workplace,
    ),
  );
}

export function unarchiveWorkplace(id: number): void {
  commit(
    state.map((workplace) =>
      workplace.id === id
        ? {
            ...workplace,
            archived_at: null,
            updated_at: new Date().toISOString(),
          }
        : workplace,
    ),
  );
}

export function deleteWorkplace(id: number): void {
  commit(state.filter((workplace) => workplace.id !== id));
}

/** Kembalikan data contoh (buang semua perubahan dummy di localStorage). */
export function resetWorkplaces(): void {
  commit(seed());
}
