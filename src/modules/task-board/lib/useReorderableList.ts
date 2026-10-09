import { useCallback, useRef, useState, type DragEvent } from 'react';

type DropPosition = 'before' | 'after';

type DragOver = { key: string; position: DropPosition };

/**
 * Hook drag & drop urutan untuk daftar sederhana (tanpa filter/paging).
 *
 * Cara pakai:
 * - Pasang `containerProps` di pembungkus daftar.
 * - Set `data-sort-key={String(keyOf(item))}` di tiap baris.
 * - Pasang `getHandleProps(key)` di tombol/ikon drag handle.
 * - `dragOver.key` dipakai untuk indikator garis sisip sebelum/sesudah.
 *
 * Target ditentukan dari posisi kursor (clientY) terhadap titik tengah baris,
 * jadi tetap jalan dua arah (atas↔bawah) termasuk saat kursor di celah baris.
 */
export function useReorderableList<T>({
  items,
  keyOf,
  onReorder,
  disabled = false,
}: {
  items: T[];
  keyOf: (item: T, index: number) => string;
  onReorder: (nextItems: T[]) => void;
  disabled?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<DragOver | null>(null);

  const reset = useCallback(() => {
    setDraggingKey(null);
    setDragOver(null);
  }, []);

  const resolveTarget = useCallback((clientY: number): DragOver | null => {
    const rows = Array.from(
      containerRef.current?.querySelectorAll<HTMLElement>(
        '[data-sort-key]',
      ) ?? [],
    );
    if (rows.length === 0) return null;
    for (const row of rows) {
      const rect = row.getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) {
        return { key: row.dataset.sortKey ?? '', position: 'before' };
      }
    }
    const last = rows[rows.length - 1];
    return { key: last.dataset.sortKey ?? '', position: 'after' };
  }, []);

  const containerProps = {
    ref: containerRef,
    onDragOver: (event: DragEvent) => {
      if (disabled || draggingKey === null) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      const target = resolveTarget(event.clientY);
      setDragOver((current) =>
        current?.key === target?.key &&
        current?.position === target?.position
          ? current
          : target,
      );
    },
    onDrop: (event: DragEvent) => {
      if (disabled || draggingKey === null) return;
      event.preventDefault();
      const target = resolveTarget(event.clientY);
      if (target && target.key !== draggingKey) {
        const sourceKey = draggingKey;
        const withoutSource = items.filter(
          (item, index) => keyOf(item, index) !== sourceKey,
        );
        const targetIndex = withoutSource.findIndex(
          (item, index) => keyOf(item, index) === target.key,
        );
        const sourceIndex = items.findIndex(
          (item, index) => keyOf(item, index) === sourceKey,
        );
        if (targetIndex >= 0 && sourceIndex >= 0) {
          const insertAt = target.position === 'after' ? targetIndex + 1 : targetIndex;
          const next = [...withoutSource];
          next.splice(insertAt, 0, items[sourceIndex]);
          onReorder(next);
        }
      }
      reset();
    },
  };

  const getHandleProps = (key: string) => ({
    draggable: !disabled,
    onDragStart: (event: DragEvent) => {
      if (disabled) return;
      setDraggingKey(key);
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', key);
    },
    onDragEnd: reset,
  });

  return { containerProps, getHandleProps, draggingKey, dragOver, reset };
}

/** Class garis indikator sisip untuk baris dengan key tertentu. */
export function dropIndicatorClass(
  dragOver: { key: string; position: 'before' | 'after' } | null,
  key: string,
  draggingKey: string | null,
): string | false {
  if (!dragOver || dragOver.key !== key || draggingKey === key) return false;
  return dragOver.position === 'before'
    ? 'shadow-[inset_0_3px_0_0_#f59e0b]'
    : 'shadow-[inset_0_-3px_0_0_#f59e0b]';
}
