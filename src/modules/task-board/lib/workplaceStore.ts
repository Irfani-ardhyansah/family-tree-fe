import { useEffect, useSyncExternalStore } from 'react';
import type { Workplace, WorkplaceFormData } from '../types';
import { workplaceApi } from '../api/workplaceApi';

/**
 * Cache tempat kerja dari BE (`GET /workplaces`) + subscribe ringan.
 *
 * Mutasi memanggil API lalu refresh cache. Komponen membaca lewat
 * `useWorkplaces()` supaya otomatis re-render.
 */

let state: Workplace[] = [];
let loaded = false;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function commit(next: Workplace[]) {
  state = next;
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

/** Hook daftar tempat kerja (memuat sekali di mount). */
export function useWorkplaces(): Workplace[] {
  const list = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  useEffect(() => {
    void ensureWorkplacesLoaded();
  }, []);
  return list;
}

export function ensureWorkplacesLoaded(force = false): Promise<void> {
  if (loaded && !force) return Promise.resolve();
  if (inflight) return inflight;

  inflight = (async () => {
    const items = await workplaceApi.list();
    loaded = true;
    commit(items);
  })().finally(() => {
    inflight = null;
  });

  return inflight;
}

/** Paksa ambil ulang dari server. */
export function refreshWorkplaces(): Promise<void> {
  return ensureWorkplacesLoaded(true);
}

export function getWorkplace(id: number): Workplace | undefined {
  return state.find((workplace) => workplace.id === id);
}

export function getActiveWorkplaces(): Workplace[] {
  return state.filter((workplace) => !workplace.archived_at);
}

export async function createWorkplace(
  data: WorkplaceFormData,
): Promise<Workplace> {
  const created = await workplaceApi.create(data);
  await refreshWorkplaces();
  return created;
}

export async function updateWorkplace(
  id: number,
  data: WorkplaceFormData,
): Promise<Workplace> {
  const updated = await workplaceApi.update(id, data);
  await refreshWorkplaces();
  return updated;
}

export async function archiveWorkplace(id: number): Promise<void> {
  await workplaceApi.archive(id);
  await refreshWorkplaces();
}

export async function unarchiveWorkplace(id: number): Promise<void> {
  await workplaceApi.unarchive(id);
  await refreshWorkplaces();
}

export async function deleteWorkplace(id: number): Promise<void> {
  await workplaceApi.remove(id);
  await refreshWorkplaces();
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
    accent: workplace.accent ?? 'amber',
    startedAt: toDateInput(workplace.started_at),
    endedAt: toDateInput(workplace.ended_at),
  };
}
