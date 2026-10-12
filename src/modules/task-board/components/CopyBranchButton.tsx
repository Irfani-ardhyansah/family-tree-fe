import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { Check, Copy } from 'react-feather';
import { cx } from '@/shared/ui';

interface CopyBranchButtonProps {
  /** Nama branch yang disalin. */
  value: string;
  /** Ukuran ikon; kecilkan di baris list. */
  size?: number;
  className?: string;
}

/**
 * Tombol salin nama branch. Aman dipakai di dalam `<Link>` (baris list task):
 * klik tidak men-trigger navigasi.
 */
export function CopyBranchButton({
  value,
  size = 13,
  className,
}: CopyBranchButtonProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timeoutRef.current != null) window.clearTimeout(timeoutRef.current);
    },
    [],
  );

  const handleCopy = async (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (timeoutRef.current != null) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={(event) => void handleCopy(event)}
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-control p-1 transition-colors',
        copied
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-suite-faint hover:bg-suite-soft hover:text-suite-ink',
        className,
      )}
      title={copied ? 'Tersalin' : 'Salin nama branch'}
      aria-label={copied ? 'Nama branch tersalin' : 'Salin nama branch'}
    >
      {copied ? <Check size={size} /> : <Copy size={size} />}
    </button>
  );
}
